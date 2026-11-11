# @stet-css/compiler

The CSS source compiler: parses Master CSS directives and native CSS, resolves the CSS **import graph** (`compileCSSFile()`), and lowers CSS-first authoring into `MasterCSSManifest` values, returning native CSS with consumed directives removed plus dependency paths.

## Boundaries

- Entry discovery: `@stet-css/project` decides which files are project entries; the compiler compiles the entries it is given (`compileProjectManifest()`).
- Class usage: the compiler reads only the CSS import graph; finding used classes in source files is `@stet-css/scanner`.

## Risks

- **Entry markers**: `@master entry;` and `@import "@stet-css/core"` are equivalent user project entry markers. Package CSS files stay free of `@master entry;`.
- **Definitions emit nothing alone**: components, utilities, variables, variants, and animations produce CSS only once a class uses or extracts them.
- **Managed vs native**: generated definitions go through managed directives. Native `@layer` blocks are not compiler-managed, and top-level native `@keyframes` stay native CSS; managed animations go inside top-level `@theme`.
- **Directive shape**: managed definition directives (`@defaults`, `@components`, `@utilities`) take bare first-level names such as `btn { }`, with selector states and descendants as nested selectors inside the named block. `@compose` works in managed class definitions and native style rules, including inside `@variant`.
- **Directive syntax changes** carry compiler tests, plus matching updates to `@stet-css/language` tokens (`syntaxes/master-css.tmLanguage.json`, `src/semantic/css/`) and to the directive list in this package's `README.md` wherever they cover the changed syntax.
- **Retired pipelines**: build on the CSS-first directive pipeline; old JS `Config` behaviour and PostCSS stay out.
