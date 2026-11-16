# @stet-css/language-service

Language Service for StetCSS.

## Installation

```bash
npm install @stet-css/language-service
```

## Usage

```js
import CSSLanguageService from '@stet-css/language-service'

const languageService = new CSSLanguageService(customSettings)
```

`CSSLanguageService` provides stateful completion, hover, color, color presentation, and semantic token features around the editor-neutral primitives in `@stet-css/language`.

### Semantic tokens

```ts
const semanticTokens = languageService.renderSemanticTokens(textDocument)
```

Semantic tokens are generated with the project manifest, so custom variables, components, utilities, modes, and other manifest-dependent tokens can be classified after the caller loads the manifest.

Use `renderSemanticTokensAtPosition()` when a client wants active-only highlighting for the embedded class context at the current editor position.

```ts
const semanticTokens = languageService.renderSemanticTokensAtPosition(textDocument, position)
```

CSS directive syntax in CSS-family documents is highlighted by the shared TextMate grammar. Semantic tokens are only added for directive class-list spans such as bare `@compose` preludes and quoted `@safelist` strings.

### Directive formatting

```ts
const edits = languageService.formatDirectives(textDocument)
```

Directive formatting returns LSP text edits for StetCSS directive source. It supports CSS, SCSS, and LESS documents, plus CSS-family `<style>` blocks in Vue, Svelte, and Astro documents. The formatter repairs directive class-list important markers such as `bg:transparent !` to `bg:transparent!` and does not change compiler semantics or generated CSS.

Pass an LSP range as the second argument for range formatting:

```ts
const edits = languageService.formatDirectives(textDocument, range)
```

## Settings

```js
import { settings } from '@stet-css/language-service'
```

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `includedLanguages` | `string[]` | Common web and template languages | Language IDs that receive language-service features. |
| `exclude` | `string[]` | `["**/.git/**", "**/node_modules/**", "**/.hg/**"]` | Glob patterns excluded from all features. |
| `classAttributes` | `string[]` | `["class", "className"]` | Quoted markup attributes that contain StetCSS class strings. |
| `classAttributeBindings` | `Record<string, [string, string] \| false>` | Framework binding defaults | Bound attributes such as `:class`, `[ngClass]`, and `class:list`. |
| `classFunctions` | `string[]` | Common class helpers | Functions and methods whose string arguments contain classes, such as `clsx()` and `classList.add()`. |
| `classDeclarations` | `string[]` | `[]` | Variable declarations or object properties whose string values contain classes. |
| `suggestSyntax` | `boolean` | `true` | Enables syntax suggestions. |
| `inspectSyntax` | `boolean` | `true` | Enables hover inspection and generated CSS previews. |
| `renderSyntaxColors` | `boolean` | `true` | Enables color rendering. |
| `editSyntaxColors` | `boolean` | `true` | Enables color editing. |
| `formatDirectives` | `boolean` | `true` | Enables StetCSS directive formatting. |
| `embeddedSyntaxHighlighting` | `'active' \| 'always' \| 'off'` | `'active'` | Controls embedded semantic token highlighting. |

Use `@stet-css/language` directly for browser helpers, Shiki integration, TextMate grammar assets, and raw class-position scanning.
