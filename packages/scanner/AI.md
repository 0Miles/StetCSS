# @stet-css/scanner

`CSSScanner` validates and caches: it collects **candidates** from supplied source text through `@stet-css/source`, keeps those `@stet-css/validator` accepts against the default manifest, inserts their rules, remembers valid, invalid and already-read sources, and emits `init`, `change`, `reset` and `destroy`. Its only option is `adapters`, which is also every build plugin's only option.

## Boundaries

- Source adapters and raw candidate extraction (`extractClassCandidates`) → `@stet-css/source`.
- Which files a static build reads and which classes it forces in or out (`@source`, `@source not`, `@safelist`, `@blocklist`) → the class set in `@stet-css/stylesheet`.
- File watching, output writing and build lifecycle → the CLI and build plugins.
- Stylesheet entries, CSS-first compilation, extraction directives, generated CSS composition and emittedGlobals output → `@stet-css/stylesheet`.
- Manifest discovery and loading → `@stet-css/project`.

## Risks

- **Candidates** are guesses: each passes `generateValidRules` before it becomes a rule, and only literal class text is reachable (dynamically concatenated classes are not). Loosen extraction only alongside false-positive tests.
- **Async**: `init`, `reset`, `scan`, `scanSource` and `collectCandidates` return promises; every consumer awaits them.
- **Options**: `src/options/index.ts` is the one place that lists the allowed keys and maps each removed key to its replacement, for the scanner and for every build plugin; `validateScannerOptions` throws on a removed or unknown key during `init` and `reset`, and the build plugins call `validatePluginOptions` when their config loads.
- **Caches**: `reset()` and `destroy()` clear every scanner cache (class sets, content hashes, valid-rule memo).
- **`resetDependencies`** feed the reset watchers in the CLI, webpack and Next integrations; guard changes against reset loops.

## Validation

Extend `tests/extract.test.ts` for extraction, `tests/syntax.test.ts` for class syntax, and `tests/options.test.ts` for option keys.
