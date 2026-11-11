# @stet-css/scanner

`CSSScanner` turns source files into rules for static builds: it collects **candidates** through `@stet-css/source`, keeps those `@stet-css/validator` accepts, inserts their rules, and emits `init`, `change`, `reset` and `destroy` for build integrations.

## Boundaries

- Source adapters and raw candidate extraction (`extractClassCandidates`) → `@stet-css/source`.
- File watching, output writing and build lifecycle → the CLI and build plugins.
- Stylesheet entries, CSS-first compilation, native CSS pruning, extraction directives, generated CSS composition and emittedGlobals output → `@stet-css/stylesheet`.
- Manifest discovery and loading → `@stet-css/project`.

## Risks

- **Candidates** are guesses: each passes `generateValidRules` before it becomes a rule, and only literal class text is reachable (dynamically concatenated classes are not). Loosen extraction only alongside false-positive tests.
- **Async**: `init`, `reset`, `scan`, `scanModule` and `collectCandidates` return promises; every consumer awaits them.
- **Caches**: `reset()` and `destroy()` clear every scanner cache (class sets, content hashes, valid-rule memo).
- **`resetDependencies`** feed the reset watchers in the CLI, webpack and Next integrations; guard changes against reset loops.
- **Exclude** matching decides which modules reach the scanner. `**/*.css` stays in the defaults; CSS import graphs belong to `@stet-css/stylesheet`.

## Validation

Extend `tests/extract.test.ts` for extraction, `tests/syntax.test.ts` for class syntax, and `tests/source/` for module exclusion.
