#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node check-capabilities-compatibility.js --baseFile=capabilities.base.json --prFile=capabilities.json [--allowlist=.github/capabilities-compatibility-allowlist.json]');
  process.exit(2);
}

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  acc[k.replace(/^--/, '')] = v || true;
  return acc;
}, {});

if (!args.baseFile || !args.prFile) usage();
const baseFile = path.resolve(args.baseFile);
const prFile = path.resolve(args.prFile);
const allowlistFile = args.allowlist ? path.resolve(args.allowlist) : path.resolve('.github/capabilities-compatibility-allowlist.json');

function readJson(file) {
  try {
    const content = fs.readFileSync(file, 'utf8').trim();
    if (!content) {
      console.warn(`Warning: ${file} is empty, treating as empty object`);
      return {};
    }
    return JSON.parse(content);
  } catch (e) {
    console.error(`Failed to read or parse JSON file: ${file}\n${e.message}`);
    process.exit(2);
  }
}

const base = readJson(baseFile);
const pr = readJson(prFile);

// Special case: if base is null (missing file), only validate PR structure
if (base === null || (typeof base === 'object' && Object.keys(base).length === 0)) {
  console.log('Base capabilities.json is missing or empty - treating as new file addition.');
  console.log('Performing basic validation of new capabilities.json structure...');
  
  // Basic validation for required properties in new capabilities.json
  const requiredProps = ['dataRoles', 'dataViewMappings'];
  const missingProps = requiredProps.filter(prop => !pr.hasOwnProperty(prop));
  if (missingProps.length > 0) {
    console.error(`\nNew capabilities.json is missing required properties: ${missingProps.join(', ')}`);
    process.exit(1);
  }
  
  // Check for WebAccess (not allowed)
  if (pr.privileges && pr.privileges.includes('WebAccess')) {
    console.error('\nWebAccess privilege is not allowed in capabilities.json');
    process.exit(1);
  }
  
  console.log('New capabilities.json structure is valid.');
  process.exit(0);
}

let allowlist = [];
if (fs.existsSync(allowlistFile)) {
  try { allowlist = JSON.parse(fs.readFileSync(allowlistFile, 'utf8')); } catch (e) { console.warn('Warning: failed to parse allowlist, continuing without it'); }
}

function isPrimitive(val) {
  return val === null || (typeof val !== 'object');
}

function pathJoin(parent, key) {
  return parent ? `${parent}.${key}` : key;
}

const issues = [];

function record(path, message) {
  // if allowlist contains exact path, skip
  if (allowlist && Array.isArray(allowlist) && allowlist.includes(path)) return;
  issues.push({ path, message });
}

function compareObjects(baseNode, prNode, parentPath) {
  if (typeof baseNode !== typeof prNode) {
    // Allow object vs array difference? report as modified
    record(parentPath || '<root>', `Type changed from ${typeof baseNode} to ${typeof prNode}`);
    return;
  }

  if (Array.isArray(baseNode)) {
    // Heuristics: if array of objects and elements have `name` property, match by name.
    if (baseNode.length > 0 && typeof baseNode[0] === 'object' && baseNode[0] !== null) {
      const byName = baseNode[0] && Object.prototype.hasOwnProperty.call(baseNode[0], 'name');
      if (byName) {
        const map = new Map();
        (prNode || []).forEach(item => { if (item && item.name) map.set(item.name, item); });
        baseNode.forEach((item, idx) => {
          const key = item && item.name ? item.name : null;
          const childPath = pathJoin(parentPath, `${idx}${key ? `(${key})` : ''}`);
          if (key && !map.has(key)) {
            record(childPath, `Array element with name='${key}' removed or renamed`);
          } else if (key) {
            compareObjects(item, map.get(key), pathJoin(parentPath, `name=${key}`));
          } else {
            // fallback to index compare
            const prItem = (prNode || [])[idx];
            if (prItem === undefined) record(childPath, `Array element at index ${idx} removed`);
            else compareObjects(item, prItem, childPath);
          }
        });
      } else {
        // compare by index
        for (let i = 0; i < baseNode.length; i++) {
          const childPath = pathJoin(parentPath, String(i));
          if (prNode.length <= i) {
            record(childPath, `Array element at index ${i} removed`);
            continue;
          }
          compareObjects(baseNode[i], prNode[i], childPath);
        }
      }
    } else {
      // base array of primitives - ensure not removed elements by index
      for (let i = 0; i < baseNode.length; i++) {
        const childPath = pathJoin(parentPath, String(i));
        if (!prNode || prNode.length <= i) record(childPath, `Array element at index ${i} removed`);
        else if (typeof baseNode[i] !== typeof prNode[i]) record(childPath, `Type changed at array index ${i} from ${typeof baseNode[i]} to ${typeof prNode[i]}`);
      }
    }
    return;
  }

  if (isPrimitive(baseNode)) {
    // primitive - only check type compatibility
    if (isPrimitive(prNode) && typeof baseNode !== typeof prNode) {
      record(parentPath || '<root>', `Primitive type changed from ${typeof baseNode} to ${typeof prNode}`);
    }
    return;
  }

  // both are objects
  for (const key of Object.keys(baseNode)) {
    const childPath = pathJoin(parentPath, key);
    if (!Object.prototype.hasOwnProperty.call(prNode || {}, key)) {
      record(childPath, `Property removed`);
      continue;
    }
    compareObjects(baseNode[key], prNode[key], childPath);
  }
}

compareObjects(base, pr, '');

if (issues.length) {
  console.error('\n=== capabilities.json compatibility issues detected ===\n');
  issues.forEach((it, i) => {
    console.error(`${i + 1}. ${it.path} - ${it.message}`);
  });
  console.error('\nIf these changes are intentional, add the exact JSON paths to the allowlist file (one per line) or update the baseline.');
  process.exit(1);
}

console.log('capabilities.json structure is compatible with baseline. No breaking changes detected.');
process.exit(0);
