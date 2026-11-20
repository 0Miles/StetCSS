# @stet-css/lint

Owns the framework-neutral **lint policy** that the ESLint plugin and CLI adapt: class sorting, conflict detection, validation diagnostics, canonical class and group suggestions, raw-value checks, whitespace-preserving class-list edits, and the default lint target settings. `lintStetCSSContent` and `fixStetCSSContent` take source text plus a `StetCSS` instance and map class-list diagnostics and fixes onto source ranges.

## Boundaries

- ESLint rule objects, configs, AST visitors, and report and autofix ranges → `@stet-css/eslint-plugin`.
- Class-list tokens, ranges, and top-level splitting → `@stet-css/lexer`; class semantic inspection and numeric normalization → `@stet-css/engine/inspect`.

## Risks

- **Adapter-neutral**: adapters pass in source text and a `StetCSS` instance. Keep ESLint, `@stet-css/project`, filesystem, scanner, language-service, and framework imports out of this package.
- **Engine parity**: ordering, conflicts, and canonical suggestions derive from the rules the engine generates. Reuse lexer parsing, value segment splitting, numeric normalization, and `@stet-css/engine/inspect` rather than duplicating them or reading generated-rule private fields.
- **Inspection helpers** that lint needs go in `@stet-css/engine/inspect`, off the `StetCSS` class, which is on the runtime surface.
- **Validation diagnostics** preserve the results scanner and ESLint consumers expect.
- **Decoded class-list edits** (`scriptString`, `characterReferences`): `buildClassList` rejoins item spellings that were not neighbours, which can change how they decode (a space spelled `&#x20` reads on into a following hex digit). It checks the joined list decodes as its parts do, gives such a space a `;` or writes it as its whitespace, and otherwise returns the list unchanged, so the edit has no fix and an unfixable sort is not reported. A list the parser read as written (a string body that does not decode, such as one holding a line break) is rebuilt as written, without the check.
