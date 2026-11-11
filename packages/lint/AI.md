# AI Notes For `@stet-css/lint`

## Responsibility

`@stet-css/lint` owns framework-neutral Master CSS class lint policy. It sorts class names, detects conflicting classes, validates class diagnostics for lint consumers, and suggests canonical class names and class groups.

## Owns

- Class sorting policy for lint tools.
- Class conflict detection policy.
- Class validation diagnostic mapping for lint tools.
- Canonical class name suggestion policy.
- Canonical class group suggestion policy.
- Framework-neutral class-list edit helpers for sorting, removing, and replacing tokens while preserving source whitespace.
- Default lint target settings shared by adapters.
- Framework-neutral source-content lint orchestration that maps class-list diagnostics and fixes onto source ranges.

## Does Not Own

- ESLint rule objects, reports, configs, parser visitors, or autofix ranges.
- Project manifest discovery or filesystem access.
- Source extraction adapters.
- Engine CSS generation semantics.
- Class-list token/range parsing; use `@stet-css/lexer`.
- Class semantic inspection; use tooling-only helpers from `@stet-css/engine/inspect`.
- Language service lifecycle, scanner, runtime, framework, or site behavior.

## Public Surface

- `sortClassNames`
- `findClassConflicts`
- `findPartialClassConflicts`
- `findUnapprovedRawValueClasses`
- `getClassValidationIssues`
- `suggestCanonicalClassGroups`
- `suggestCanonicalClassName`
- `sortClassList`
- `removeClassNamesFromClassList`
- `replaceClassNameInClassList`
- `replaceClassGroupInClassList`
- `lintMasterCSSContent`
- `fixMasterCSSContent`
- `resolveMasterCSSLintRules`
- `summarizeMasterCSSLintFiles`
- `defaultClassLintSettings`
- `defaultCanonicalClassNameOptions`

## Key Files

- `src/index.ts`
- `src/sort-class-names.ts`
- `src/find-class-conflicts.ts`
- `src/find-partial-class-conflicts.ts`
- `src/find-unapproved-raw-value-classes.ts`
- `src/get-class-validation-issues.ts`
- `src/suggest-canonical-class-groups.ts`
- `src/suggest-canonical-class-name.ts`
- `src/class-list-edits.ts`

## Risk Areas

- Ordering, conflict, and canonical suggestion behavior must match generated engine rules.
- Do not duplicate class parsing, value segment splitting, numeric normalization, or generated-rule private field inspection in this package. Do not add lint-only inspection helpers to `MasterCSS`; use `@stet-css/engine/inspect`.
- Validation diagnostics must preserve scanner and ESLint expectations.
- This package must not import ESLint, project resolution, filesystem, scanner, language service, or framework packages.

## Validation

```sh
pnpm --filter @stet-css/lint test
pnpm --filter @stet-css/lint lint
pnpm --filter @stet-css/lint type-check
pnpm --filter @stet-css/lint build
```
