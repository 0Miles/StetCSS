# @stet-css/stylesheet

Stylesheet entry pipeline for Master CSS static rendering.

## Installation

```bash
npm install @stet-css/stylesheet
```

## Responsibility

`@stet-css/stylesheet` detects Master CSS stylesheet entries, resolves stylesheet import graphs, compiles CSS-first directives, registers stylesheet sources, prunes native CSS using scanner state, and composes final CSS with emittedGlobals metadata.

It accepts structural scanner state from callers and does not depend on `@stet-css/scanner`. It decides the static class set itself: the project's own source files (from `@stet-css/project/sources`), plus every entry's `@source` files, minus every entry's `@source not` files, read through `@stet-css/source` adapters, plus `@safelist`, minus `@blocklist`. `resolveStylesheetSourceFiles()` lists those files and `isStylesheetSourceFile()` answers the same rule for one changed path.

## API

```ts
import {
  isStyleCSSRequest,
  resolveMasterStyleSource,
  transformLocalStyleCSS,
  registerStyleCSSSource,
  createStyleCSSManifest,
  createExtractedCSS,
} from '@stet-css/stylesheet'
```

Common API areas:

| API area | Purpose |
| --- | --- |
| Style request helpers | Detect and resolve Master CSS stylesheet requests. |
| Local CSS transforms | Lower local `@compose` and `@reference` directives. |
| Source registration | Register stylesheet sources and dependency metadata. |
| Manifest creation | Build stylesheet-local manifests from compiled CSS. |
| Extracted CSS composition | Combine generated CSS, native CSS pruning output, and emittedGlobals counts. |

## Directives

Extraction directive helpers are exported from `./directives`.

```ts
import {
  collectStylesheetDirectives,
  createStylesheetSourceOptions,
} from '@stet-css/stylesheet/directives'
```

For user-facing CSS directive syntax, see [CSS directives](https://rc.css.master.co/reference/directives).

## Browser rendering

Browser-safe CSS directive compilation and class rendering are exported from `./browser`. This subpath does not include filesystem import graphs, Sass preprocessing, or source scanning.

```ts
import { compileBrowserStyleCSS } from '@stet-css/stylesheet/browser'

const result = await compileBrowserStyleCSS('@theme { --color-brand: #ff0; }', {
  baseManifest,
  classNames: ['fg:brand'],
  from: 'playground.css'
})

console.log(result.css)
```
