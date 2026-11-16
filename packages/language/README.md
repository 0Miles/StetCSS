# @stet-css/language

Language primitives for StetCSS.

## Installation

```bash
npm install @stet-css/language
```

## Usage

`@stet-css/language` provides editor-neutral StetCSS language primitives such as semantic token legends, class-list tokenizers, class-position scanning, directive formatting, browser semantic tokens, Shiki integration, and the shared TextMate grammar.

### Semantic token legend

```js
import { SEMANTIC_TOKENS_LEGEND } from '@stet-css/language'
```

### Browser semantic tokens

Use the browser subpath when a web editor needs StetCSS semantic tokens without the stateful language service class.

```ts
import {
  SEMANTIC_TOKENS_LEGEND,
  renderBrowserSemanticTokens
} from '@stet-css/language/browser'

const semanticTokens = renderBrowserSemanticTokens(source, 'html', { manifest })
```

The browser helper supports CSS directive class-list spans in CSS documents and quoted `class` or `className` attributes in HTML.

### Shiki

Use the Shiki subpath to register the shared TextMate injection grammar and decorate StetCSS semantic ranges.

```ts
import {
  stetCSSShikiLanguage,
  transformerStetCSS
} from '@stet-css/language/shiki'
```

### Class positions

Use `getClassPositions()` when a tool needs raw class spans without LSP service lifecycle.

```ts
import { getClassPositions, languageSettings } from '@stet-css/language'

const positions = getClassPositions(textDocument, languageSettings)
```

### Directive formatting

Use `formatStetCSSDirectives()` when an editor integration needs source-offset edits for StetCSS directive formatting without LSP service lifecycle.

```ts
import {
  applyStetCSSDirectiveFormatEdits,
  formatStetCSSDirectives
} from '@stet-css/language'

const edits = formatStetCSSDirectives(source)
const formatted = applyStetCSSDirectiveFormatEdits(source, edits)
```

The helper repairs directive class-list important markers such as `bg:transparent !` to `bg:transparent!` and returns offset edits only; it does not compile CSS or change generated output.
