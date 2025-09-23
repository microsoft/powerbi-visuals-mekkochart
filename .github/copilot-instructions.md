# Agent-oriented Copilot instructions for PR checks

**Purpose.** Keep only the checks and guidance that an automated coding agent (Copilot-style) can perform reliably during a PR review for a Power BI custom visual repository. Interactive/manual steps live in `HUMAN-certification-checklist.md`.

**Context.** This repository contains a Microsoft custom visual for Power BI. All contributions must follow Microsoft coding standards and Power BI custom visual guidelines. The agent prioritizes checks that enforce those standards and flags deviations for human review.

---

## Summary of agent-capable checks (categories)

- **PR metadata**: non-empty description; conventional commit title.
- **Manifests & capabilities (Power BI)**: presence & schema sanity of `capabilities.json`, `pbiviz.json`, `package.json`, `tsconfig.json`, `src/visual.ts`; no `WebAccess`; version bump rules.
- **Security & forbidden patterns**: unsafe DOM, dynamic scripts, timers-with-strings, `eval/new Function`, network APIs, unsafe bindings.
- **Secrets scanning**: common tokens/keys; urgent human review.
- **Build artifacts & minification & assets**: `.min.*` in `src/`, overly large or minified-looking files.
- **Linting, tests, CI**: scripts present; ESLint config; CI status present if `src/**` changed.
- **Dependencies**: lockfile updated on dependency change; major version bumps flagged.
- **Tests & localization**: unit tests reminder on logic changes; `stringResources/en-US/**` coverage; spellcheck.
- **Documentation & changelog**: `changelog.md` on non-trivial changes; usage examples for public APIs.
- **Code quality & architecture**: scope summary, performance & accessibility hints, state/event cleanup, error handling, maintainability notes.
- **Reporting**: one-line summary counts; per-finding snippets; suggested fixes; auto-labels.

> Maintainers: thresholds, regexes and message templates are the **single source of truth** in this file to avoid divergence.

---

## Detailed rules

### 1) Manifests & capabilities (Power BI)
- **Presence**: `capabilities.json`, `pbiviz.json`, `package.json`, `tsconfig.json`, `src/visual.ts`.  
  Missing → `error`.
- **Capabilities**:
  - No `WebAccess` or privileges that permit arbitrary network calls → `error`.
  - `dataRoles` and `dataViewMappings` must be present → `error`.
- **`pbiviz.json`**:
  - `visual.version` must bump for functional changes (semver).  
  - `visual.guid`, `visual.displayName`, `author`, `supportUrl`, `apiVersion` present.  
  - `apiVersion` compatible with `@types/powerbi-visuals-api` (major alignment) → mismatch → `warning`.

### 2) Security & forbidden patterns (report file:line)
- Unsafe DOM:
  - `innerHTML\s*=` → `error` with safe alternative.
  - `.html\(` (D3 selections) → `error` when D3 imported; otherwise `warning`.
- Dynamic scripts / code eval:
  - `createElement\(['"]script['"]\)` / `appendChild` of scripts → `error`.
  - `eval\(` or `new Function\(` → `error`.
  - String-based timers:  
    `set(?:Timeout|Interval)\(\s*(['"]).*?\1` → `error`.
- Network / runtime:
  - `fetch\(`, `XMLHttpRequest`, `WebSocket` → `error` (Power BI certified visuals constraint).
- Prefer safe APIs:
  - `textContent`, `setAttribute` over `innerHTML`. Provide auto-fix snippet if RHS is a simple string literal.

### 3) Secrets & credentials
- Run regex scans on changed text files (exclude binaries and lock files).
- Examples (non-exhaustive):
  - `AKIA[0-9A-Z]{16}` (AWS)
  - `ghp_[A-Za-z0-9]{36,}` (GitHub)
  - `xox[baprs]-[A-Za-z0-9-]{10,48}` (Slack)
  - `eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}` (JWT)
  - `(AccountKey|SharedAccessKey|SAS|Sig|se=|sp=|sr=|spr=|sv=|st=|sk=|connection\s*string)\s*=\s*[^;'\n]+` (Azure)
  - `npm_[A-Za-z0-9]{36,}` (NPM)
  - `-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----`
- Any hit → `error` + urgent human review. **Do not auto-edit.**

### 4) Build artifacts, minification & large assets
- `error`: any `\.min\.(js|ts|css)$` under `src/**`.
- `warning`: likely-minified file (avg line length > 300 and median > 120) in `src/**`.
- `warning`: large files in `src/**` > 250 KB (exclude `assets/**` and PBIVIZ icons).
- `warning`: assets > 500 KB — recommend re-evaluating bundling, compression, or CDN prohibition (if applicable).

### 5) Linting, tests
- `package.json` scripts must include:
  - `lint`, `test`, `package` (or `pbiviz package`) → missing → `warning`.
- ESLint configuration must exist at repo root:
  - Prefer `eslint.config.mjs`; if `.eslintrc.*` or `.eslintignore` or `eslintConfig` in `package.json` -> ask to migrate to `eslint.config.mjs`.
  - Missing → `warning` + suggest basic config for Power BI visuals.

### 6) Dependencies
- On `dependencies`/`devDependencies` changes require updated `package-lock.json` or `yarn.lock` → `warning`.
- Major-bump in `package.json` → `warning` with request to describe motivation/test-case.
- When adding new features → ensure minor-version is bumped.
- (Optional, as `info`) suggest running `npm audit` (at maintainers' discretion).

### 7) Tests & localization
- If logic touched in `src/**` and no new/updated tests nearby → `warning`-reminder.
- UI strings:
  - Check `stringResources/en-US/resources.resjson` and string correspondence from code.
  - Missing localization keys → `warning`.
- Spellcheck (en-US as source):
  - Report probable typos with level (`info`/`warning`) and replacement suggestion.
  - Exclude identifiers/acronyms/brand-names based on `.spellcheck-whitelist`.

### 8) Documentation & changelog
- For non-trivial changes — update `changelog.md` → `info`/`warning`.
- For new public APIs — add usage examples → `info`.

### 9) Code quality & architecture (senior review mindset)
- Briefly summarize PR purpose and affected areas (render, data, settings, UI).
- Highlight:
  - Potential performance bottlenecks (DOM in hot paths, unnecessary loops, re-renders).
  - Accessibility (ARIA, contrasts, keyboard navigation, screen reader).
  - Errors/edge-cases: null/undefined/empty data.
  - Resource management: cleanup D3-selectors, event handlers, timers.
  - State/races/leaks; excessive coupling; duplication.
  - Power BI SDK/utilities compliance, formatting, API contracts.

## Spellcheck Configuration

### What to Check:
- UI strings in code (`src/**`)
- localization files (`stringResources/en-US/**`)
- PR title and description.

### Severity:
- `warning` — UI strings and localization.
- `info` — PR metadata and comments.

---

## Severity & automated labels

- **error** — must fix before merge (e.g., secrets, `WebAccess`, minified code in `src/**`, forbidden APIs).
- **warning** — should fix soon (e.g., missing PR description/tests, major dep bump, large assets).
- **info** — suggestions/style (typos, architecture improvements).

**Auto-labels** (by highest severity and change type):  
`security`, `needs-review`, `tests`, `enhancement`, `performance`, `localization`.

---

## Canonical regex library (reference)
```
# Conventional commits
^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9-./]+\))?(!)?: .{1,72}$

# Unsafe DOM / HTML injection
\binnerHTML\s*=
\.html\s*\(

# Dynamic scripts / code eval
createElement\s*\(\s*['"]script['"]\s*\)|appendChild\s*\([^)]*script[^)]*\)
\beval\s*\(
\bnew\s+Function\s*\(
set(?:Timeout|Interval)\s*\(\s*(['"]).*?\1

# Network APIs
\bXMLHttpRequest\b|\bWebSocket\b|\bfetch\s*\(

# Secrets (subset)
AKIA[0-9A-Z]{16}
ghp_[A-Za-z0-9]{36,}
xox[baprs]-[A-Za-z0-9-]{10,48}
eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}
(AccountKey|SharedAccessKey|SAS|Sig|se=|sp=|sr=|spr=|sv=|st=|sk=|connection\s*string)\s*=\s*[^;'\n]+
npm_[A-Za-z0-9]{36,}
```
