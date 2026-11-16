# @stet-css/language-server

Language Server for StetCSS.

## Installation

```bash
npm install @stet-css/language-server
```

## Usage

```js
import CSSLanguageServer from '@stet-css/language-server'

const languageServer = new CSSLanguageServer(connection, customSettings)
```

`CSSLanguageServer` wraps `@stet-css/language-service` with LSP workspace lifecycle, completion, hover, document color, color presentation, semantic token, and directive formatting handlers.

Diagnostics are intentionally limited to language-server-owned behavior: CSS directive diagnostics and project manifest loading diagnostics. Class syntax and policy rules such as sorting, canonical class preference, conflict detection, invalid classes, and raw-value approval are owned by `@stet-css/eslint-plugin`.

## Semantic tokens

The language server supports full-document and active-position semantic tokens.

| `embeddedSyntaxHighlighting` | Behavior |
| --- | --- |
| `always` | Advertises the standard LSP `semanticTokensProvider` and handles `textDocument/semanticTokens/full`. |
| `active` | Uses the VS Code extension request for active class-context highlighting. |
| `off` | Disables embedded utility highlighting. |

CSS directive syntax is highlighted by the shared TextMate grammar. Server semantic tokens cover StetCSS class-list spans and directive class-list spans such as `@compose` and `@safelist`.

## Formatting

The server advertises `documentFormattingProvider` and `documentRangeFormattingProvider` when `formatDirectives` is enabled. Formatting returns directive-only edits for CSS, SCSS, and LESS documents, plus CSS-family `<style>` blocks in Vue, Svelte, and Astro documents.

Directive formatting normalizes safe directive spacing and repairs class-list important markers such as `bg:transparent !` to `bg:transparent!`. It does not run the compiler and does not change generated CSS output.

## Settings

```js
import { settings } from '@stet-css/language-server'
```

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `workspaces` | `FastGlobPattern[] \| 'auto'` | `'auto'` | Workspace roots where independent language services are created. The root workspace is always included. |
| `verbose` | `boolean` | `false` | Print server logs. |
| `formatDirectives` | `boolean` | `true` | Enables LSP document and range formatting for StetCSS directives. |
| `embeddedSyntaxHighlighting` | `'active' \| 'always' \| 'off'` | `'active'` | Inherited language-service semantic token mode. |

With `workspaces: 'auto'`, the server creates workspaces from CSS files importing `@stet-css/core` and `package.json` files that declare StetCSS package dependencies.
