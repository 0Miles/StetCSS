# @stet-css/stylesheet

Owns the **stylesheet entry** pipeline for static rendering: detecting Master CSS entries, expanding their CSS import graph through compiler results, lowering CSS-first and local directives, pruning native CSS, and composing the generated CSS with its emittedGlobals.

## Boundaries

- Scanner state arrives as the structural `ScannerState` interface. `@stet-css/scanner` sits on the same tier, so it stays a dev dependency.
- Candidate extraction and source adapters → `@stet-css/source`; manifest discovery → `@stet-css/project`; CSS output semantics → `@stet-css/engine`.

## Risks

- **Source scope**: source files enter only through the `@source` include and exclude globs (`resolveStylesheetSourcePaths`).
- **CSS output** hot spots: native CSS pruning, generated CSS ordering, emittedGlobals counts, and local `@compose` / `@reference` lowering.
- **Entry detection and import graph**: the dependencies they collect become the integrations' reset watch lists.
