# @stet-css/language-service

Owns the stateful **editor features** over a manifest: completion, hover with generated CSS, document colors and color presentations, and directive formatting. `CSSLanguageService` builds its engine from an injectable `CSSLanguageRuntime` (the language server supplies a workspace's own), and its class-position and semantic-token methods are thin `TextDocument` wrappers over `@stet-css/language`.

## Boundaries

- Class-position scanning, semantic tokenization, browser and Shiki helpers, and the TextMate grammar → `@stet-css/language`; raw class-list parsing and unescaping reach this package through it from `@stet-css/lexer`.
- LSP capabilities, workspace lifecycle, and diagnostics → `@stet-css/language-server`.

## Risks

- **Document syntaxes**: class strings live in JSX, Vue, Svelte, Astro, template literals, and function calls as well as HTML attributes. Back every class-position or regex change with a framework-specific case in `tests/get-class-position/`.
- **Feature gating**: each feature returns nothing when its setting is off or `isDocumentAccepted` rejects the document (`exclude` globs); route new features through the same check.
- **Completion** trigger characters and the sort order of variables and colors are user-visible; cover changes in `tests/suggest-syntax/`.
- **Engine consistency**: hover CSS, completions, and colors come from `this.css` and `this.runtime`, so they match what the engine generates for the active runtime and manifest.

## Validation

Hover and color changes extend `tests/inspect-syntax.test.ts`, `tests/render-syntax-colors.test.ts`, or `tests/edit-syntax-colors.test.ts`.
