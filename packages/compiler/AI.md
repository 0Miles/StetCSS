# @stet-css/compiler

The CSS source compiler: parses Master CSS directives and native CSS, resolves the CSS **import graph** (`compileCSSFile()`), and lowers CSS-first authoring into `MasterCSSManifest` values, returning native CSS with consumed directives removed plus dependency paths.

## Boundaries

- Entry discovery: `@stet-css/project` decides which files are project entries; the compiler compiles the entries it is given (`compileProjectManifest()`).
- Class usage: the compiler reads only the CSS import graph; finding used classes in source files is `@stet-css/scanner`.

## Risks

- **Entry marker**: `@import "@stet-css/core"` is the only user project entry marker. Every `@master` at-rule that starts a statement (`@master entry;`, `@master { … }`, at any depth) fails with the replacement. `assertNoMasterAtRules` decides: the CSS import-graph reader runs it on every stylesheet it reads and `compileCSS` on its own input, both with a source reference for the editor. Routing filters upstream (local-style directive names, the Next Turbopack content condition, project discovery) are deliberately wider and only send files here.
- **Definitions emit nothing alone**: components, utilities, variables, variants, and animations produce CSS only once a class uses or extracts them.
- **Managed vs native**: generated definitions go through managed directives. Native `@layer` blocks are not compiler-managed, and top-level native `@keyframes` stay native CSS; managed animations go inside top-level `@theme`.
- **Directive shape**: managed definition directives (`@defaults`, `@components`, `@utilities`) take bare first-level names such as `btn { }`, with selector states and descendants as nested selectors inside the named block. `@compose` works in managed class definitions and native style rules, including inside `@variant`.
- **Directive syntax changes** carry compiler tests, plus matching updates to `@stet-css/language` tokens (`syntaxes/master-css.tmLanguage.json`, `src/semantic/css/`) and to the directive list in this package's `README.md` wherever they cover the changed syntax.
- **Nesting-depth prescan** (`src/css-nesting.ts`): every stylesheet passes `assertCSSNestingDepth` before lightningcss parses it, in `compileCSS` (which also covers `compileCSSManifest(source)` and the browser entry) and in `findCSSImportStatements` (which names each imported file); keep both. lightningcss recurses per nested rule, selector function and media-query parenthesis and kills the process on deep input. The 64-level limit compiles every measured shape on a 0.5 MB worker stack, where 128 nested `:is()` already crash; real stylesheets nest at most about 12. The scanner must tokenize like CSS (matching closers only, opaque unquoted `url(...)`, strings, comments, escapes): anything it counts short lets a crashing stylesheet through. Rerun the nesting tests in `tests/import-graph-inputs.test.ts` after changing the scanner or the limit, or upgrading lightningcss.
- **Retired pipelines**: build on the CSS-first directive pipeline; old JS `Config` behaviour and PostCSS stay out.
