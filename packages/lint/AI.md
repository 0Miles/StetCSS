# @stet-css/lint

Owns the framework-neutral **lint policy** that the ESLint plugin, CLI and MCP adapt: class sorting, conflict detection, validation diagnostics, canonical class and group suggestions, raw-value checks, whitespace-preserving class-list edits, and the default lint target settings. `lintMasterCSSContent` and `fixMasterCSSContent` take source text plus a `MasterCSS` instance and map class-list diagnostics and fixes onto source ranges.

## Boundaries

- ESLint rule objects, configs, AST visitors, and report and autofix ranges → `@stet-css/eslint-plugin`.
- Class-list tokens, ranges, and top-level splitting → `@stet-css/lexer`; class semantic inspection and numeric normalization → `@stet-css/engine/inspect`.

## Risks

- **Adapter-neutral**: adapters pass in source text and a `MasterCSS` instance. Keep ESLint, `@stet-css/project`, filesystem, scanner, language-service, and framework imports out of this package.
- **Engine parity**: ordering, conflicts, and canonical suggestions derive from the rules the engine generates. Reuse lexer parsing, value segment splitting, numeric normalization, and `@stet-css/engine/inspect` rather than duplicating them or reading generated-rule private fields.
- **Inspection helpers** that lint needs go in `@stet-css/engine/inspect`, off the `MasterCSS` class, which is on the runtime surface.
- **Validation diagnostics** preserve the results scanner and ESLint consumers expect.
