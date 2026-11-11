# @stet-css/language

Owns the editor-neutral **language primitives** shared by the language service, language server, lint, and the VS Code extension: class-position scanning (`ClassPositionCache`), semantic token classification and encoding over class lists and CSS directives, browser and Shiki highlighting helpers, `createLanguageCSS`, and the canonical TextMate grammar in `syntaxes/`.

## Boundaries

- Stateful features (completion, hover, colors) → `@stet-css/language-service`; LSP capabilities and workspace lifecycle → `@stet-css/language-server`.
- Raw class-list splitting and unescaping → `@stet-css/lexer`; manifest-driven class inspection → `@stet-css/engine/inspect`; class syntax and generated CSS → `@stet-css/engine`.

## Risks

- **Imports** stay at the lexer, engine, core, preset, and schema level. Language-service, language-server, VS Code, runtime, server, scanner, and ESLint packages are out of bounds, even though the dependency direction puts some of them on the same tier.
- **Raw ranges**: tokenize class lists with the lexer, but report raw editor offsets so escaped and quoted classes map back to the source.
- **Class-position scanning** covers JSX, Vue, Svelte, Astro, strings, and function calls; a fix for one syntax keeps the others passing.
- **Semantic tokens** classify through `@stet-css/engine/inspect`; tooling-only helpers stay off the `MasterCSS` prototype, which is on the runtime surface.
- **CSS directive highlighting** scans directives with the lexer (`collectCSSDirectiveRanges`) rather than the compiler pipeline. The TextMate grammar stays compatible with CSS-family documents; the VS Code extension ships it as-is.

## Validation

Extend the suite for the surface you touch: `tests/get-class-position/` (one file per syntax), `tests/browser.test.ts` and `tests/shiki.test.ts` (both cover semantic tokens), and `tests/format-directives.test.ts`.
