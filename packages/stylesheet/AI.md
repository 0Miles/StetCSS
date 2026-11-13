# @stet-css/stylesheet

Owns the **stylesheet entry** pipeline for static rendering: detecting Master CSS entries, expanding their CSS import graph through compiler results, lowering CSS-first and local directives, pruning native CSS, and composing the generated CSS with its emittedGlobals.

## Boundaries

- Scanner state arrives as the structural `ScannerState` interface. `@stet-css/scanner` sits on the same tier, so it stays a dev dependency.
- Candidate extraction and source adapters → `@stet-css/source`; which files are the project's own sources, and manifest discovery → `@stet-css/project`; CSS output semantics → `@stet-css/engine`.

## Risks

- **Class set**: `src/sources.ts` is the one rule for static classes: the project's own source files (or the caller's `sources` patterns), plus each entry's `@source` files, minus its `@source not` files, extracted through source adapters, plus `@safelist`, minus `@blocklist`. `isStylesheetSourceFile` answers the same rule per path for dev watchers. Until build integrations stop scanning modules, `createExtractedCSSResult` adds their scanner classes to the set, and `@blocklist` removes from both. `resolveStylesheetSourcePaths` and `mergeStylesheetSourceOptions` predate this rule and no longer decide output. Each entry's directives scope that entry's class set and its native CSS pruning; generated rules use the union over entries, so a `@blocklist` or `@source not` holds only where every entry carries it. A pattern without glob characters that names a directory covers everything under it.
- **CSS output** hot spots: native CSS pruning, generated CSS ordering, emittedGlobals counts, and local `@compose` / `@reference` lowering.
- **Entry detection and import graph**: the dependencies they collect become the integrations' reset watch lists.
