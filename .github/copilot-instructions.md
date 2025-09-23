# Agent-oriented Copilot instructions for PR checks

Purpose: keep only the checks and guidance that an automated coding agent (Copilot-style) can perform reliably during a PR review. Manual tasks and interactive certification steps moved to `HUMAN-certification-checklist.md`.

Context: This repository contains a Microsoft custom visual for Power BI. All code contributions must follow Microsoft coding standards and Power BI custom visual development guidelines. Agents should prioritize checks that enforce those standards and flag deviations for human reviewers.

Agent-capable checks (what the agent should do on each PR):

- Verify presence of required files: `capabilities.json`, `pbiviz.json`, `package.json`, `tsconfig.json`, `src/visual.ts`.
- Static scan for strictly forbidden patterns and unsafe APIs:
  - `fetch\(`, `XMLHttpRequest`, `WebSocket` usages
  - `eval\(`, `new Function\(`, `setTimeout\(.*\bFunction\b`, `setInterval\(.*\bFunction\b`
  - `innerHTML\s*=`, `D3.html\(` or other direct HTML injection points
  - Any `.min.js` or obviously minified JS/TS code committed to `src/`
- Validate `capabilities.json` does not include WebAccess privileges and that dataRoles/dataViewMappings exist.
<!-- TEMPORARILY DISABLED: TypeScript strictness check. Uncomment this line when ready to re-enable.
- Check TypeScript strictness: `tsconfig.json` contains `"strict": true` (or explicitly documents deviations).
-->
- Check `package.json` scripts include common targets: `lint`, `package` (or `pbiviz package`).
- Lint configuration: presence of ESLint config or `eslint` devDependency.
- Detect unsafe network or runtime requirements in source (hard-coded URLs, credentials, external service calls).
- Validate use of safe DOM APIs: prefer `textContent`, `setAttribute` over `innerHTML` in `src/` files.
- Search for `TODO`/`FIXME` comments that indicate unfinished security-sensitive code and flag them.
- Check spelling of user-facing string values and string literals (agent-built spellcheck; no external scripts required).
  - Scan all locale folders under `stringResources/**` (check only `en-US` as source-of-truth) and also scan string literals in `src/`.
  - Report likely misspellings with file/line locations and suggested corrections. When a suggestion is low-confidence, mark as `info`; medium-confidence as `warning`.
  - Detect untranslated or new UI strings added only to code (not present in `stringResources`) and warn about missing locale entries.
  - Avoid false positives by skipping: code identifiers, product names, acronyms, and known technical terms listed in a configurable whitelist file (e.g., `.spellcheck-whitelist`).
  - Do not auto-apply fixes. For high-confidence typos, suggest an explicit replacement snippet in the PR comment.
- Verify code is not minified: simple heuristics such as very long single-line files or `.min.` in filenames under `src/`.
- Check for large bundled assets accidentally committed under `src/`.
- Run repository-wide text searches for banned patterns and report exact file/line matches in PR comments.
- Suggest automated fixes where safe and trivial (e.g., replace `innerHTML = x` with `textContent = x` when x is simple string literal), but do not apply changes that require semantic understanding without reviewer approval.

Additional machine-checkable PR review rules for AI agents
---------------------------------------------------------

The agent should apply the following automated checks on every pull request and comment with findings. When possible provide a short remediation message and suggested code snippet.

- PR metadata
  - Require non-empty PR description. If missing, comment: "Please add a description with intent, scope, and testing notes.".
  - Check PR title against conventional commit-like template: `^(feat|fix|chore|docs|refactor|test|ci)(\(.+\))?: .{1,72}`. If not matched, suggest a compliant example.

- Secrets & credentials
  - Run regex scans for common secrets (examples):
    - AWS keys: `AKIA[0-9A-Z]{16}`
    - Azure keys / connection strings: `(?i)(?:azure|access).*key|connectionstring` (heuristic)
    - Generic tokens: `[A-Za-z0-9-_]{20,}` (with path/context check to reduce false positives)
  - If matched, post an urgent comment and mark the finding for human review. Do not attempt to redact automatically.

- Build artifacts & large files
  - Flag files that look like build outputs: very large single-line files or filenames containing `.min.`.
  - Require `package-lock.json` or `yarn.lock` to be updated when `package.json` dependencies change.

- Power BI visual manifest & capability checks
  - Validate presence and basic JSON schema of `capabilities.json`, `pbiviz.json`, `package.json`, `tsconfig.json`, and `src/visual.ts` when touched by PR.
  - Verify `capabilities.json` does not request `WebAccess` and that `dataRoles`/`dataViewMappings` are present.
  - When `pbiviz.json` is changed, ensure the visual version is bumped for functionality changes.

- Static security & DOM safety
  - Reuse existing banning list and add checks for `innerText` vs `textContent` suggestions, and flag `innerHTML` usage when the source is not a safe literal.
  - Flag dynamic script injection patterns and `setTimeout(new Function(...))` patterns.

- Linting, tests, CI
  - Verify `package.json` contains `lint` and `test` scripts. If missing, warn.
  - If PR modifies source files, verify that CI workflow is present or that tests/lint pass in CI status; if CI is not triggered, warn the author.
  - Verify an ESLint config file exists at the repository root. Prefer `eslint.config.mjs` (recommended) but accept other valid ESLint configurations (`.eslintrc.js`, `.eslintrc.cjs`, `.eslintrc.json`, or `package.json` `eslintConfig`). If `eslint.config.mjs` is missing, warn and suggest adding a root `eslint.config.mjs` with recommended settings for Power BI visuals. Also verify `eslint` is listed in `devDependencies`.

- Tests & localization
  - Encourage adding or updating unit tests when logic changes. If code is edited without tests in same area, add a reminder comment.
  - For UI text changes, check `stringResources/**` for corresponding entries; warn on missing locales.

- Dependencies
  - Flag major-version bumps in `package.json` dependencies. For minor/patch bumps, require `package-lock.json` update.

- Documentation & changelog
  - Remind authors to update `changelog.md` for non-trivial changes and to add usage examples for new public APIs.

- Automated actions and severity
  - Categorize findings as `error` (must fix), `warning` (should fix), or `info` (suggestion). Examples:
    - error: secret found, minified file under `src/`, WebAccess in `capabilities.json`.
    - warning: missing PR description, missing tests, major dependency bump.
    - info: style suggestion, minor spelling nit.
  - For safe, localizable fixes (e.g., replace `innerHTML = "literal"` with `textContent = "literal"`), propose an auto-fix snippet but do not apply without reviewer approval.

- Reporting
  - In the PR comment, include:
    - One-line summary of results (counts of errors/warnings/info).
    - File/line snippets for each finding.
    - Suggested remediation text and minimal code snippet when available.
  - Add repository labels automatically (e.g., `needs-review`, `security`, `tests`) based on highest-severity finding.

Implementation notes for maintainers:
- Document exact regexes and message templates in this file so agents add precise PR comments.
- Keep false-positive-prone checks behind a `warning` severity until tuned.

# Refer to `HUMAN-certification-checklist.md` for manual steps and interactive QA.