# @stet-css/scanner

StetCSS source scanner for static rendering.

## Installation

```bash
npm install @stet-css/scanner
```

`@stet-css/scanner` validates class candidates from supplied source text, inserts the rules of the valid ones, and caches what it has seen for build integrations. Source discovery, the class set, file watching, and CSS file output are owned by `@stet-css/stylesheet` and the CLI/framework/build integrations.

## Usage

```js
import { CSSScanner } from '@stet-css/scanner'

const scanner = new CSSScanner(options, cwd)
```

## Options

Default options are exported from the root package and the side-effect-free `./options` subpath:

```js
import { scannerOptions, validateScannerOptions } from '@stet-css/scanner'
import defaultScannerOptions from '@stet-css/scanner/options'
```

| Option | Type | Description |
| --- | --- | --- |
| `adapters` | `SourceAdapter[]` | Custom source adapters, tried before the built-in ones. |

Any other key throws. The removed options throw with their replacement:

| Removed option | Replacement |
| --- | --- |
| `safelist` | `@safelist` in the CSS entry |
| `blocklist` | `@blocklist` in the CSS entry |
| `exclude` | `@source not` in the CSS entry |
| `manifest` | a CSS entry that imports `@stet-css/core` |
| `verbose` | the CLI's `-v` |
| `path` | none; it had no effect |

`validateScannerOptions(options, owner?)` runs this check for any options object and names `owner` (default `CSSScanner`) in its errors; `SCANNER_OPTION_KEYS` lists the allowed keys and `REMOVED_SCANNER_OPTIONS` maps each removed key to its replacement.

Every build plugin (`@stet-css/vite`, `webpack`, `next`, `nuxt`, `astro`, `svelte`) takes these same options, only `adapters`, and checks them with `validatePluginOptions(options, owner)` when the config loads. Besides the keys above, it rejects the removed plugin keys listed in `REMOVED_PLUGIN_OPTIONS`:

| Removed plugin option | Replacement |
| --- | --- |
| `mode` | none; static CSS is the only output (to also run the runtime, start `@stet-css/runtime` in the app with `CSSRuntime.create(...).observe()`) |
| `injectRuntime` | start `@stet-css/runtime` in the app with `CSSRuntime.create(...).observe()` |
| `avoidFOUC` | none; static CSS is in the page before it renders |
| `scanner`, `scannerOptions` | pass `adapters` directly; removed keys inside them are named in the same error |

## CSS directives

CLI and framework/build integrations handle ordinary project source discovery. Use stylesheet directives when a stylesheet needs explicit source exceptions or candidate policy.

```css
@source '../content/**/*.mdx';
@source '../packages/ui/**/*.{ts,tsx}';
@source not '../packages/ui/**/*.stories.tsx';

@safelist 'dialog-open bg:blue-60@dark';
@blocklist 'debug-*';
```

The stylesheet pipeline resolves the files a static build reads as `(project source files + @source) - @source not`. Project source files are the files under the project root with a source extension, outside dependency (`node_modules`, `vendor`), version control, build output and cache directories. Use `@source` for files outside that set, such as a component library in `node_modules` (`@source '../node_modules/ui-kit';`) or a package outside the project root, rather than restating the default app scan. A path without glob characters that names a directory covers everything under it.

Bare source globs are resolved from `cwd`. Globs that start with `./` or `../` are resolved relative to the CSS file that declares the directive. `@blocklist` accepts exact strings and `*` / `?` wildcard patterns.

## Native CSS in stylesheet entries

A stylesheet that imports `@stet-css/core` keeps all of its native CSS, the same as any other CSS file. Rules such as `.card { color: red; }` are emitted whether or not markup uses `card`. Local relative `.css` imports are expanded and the `@stet-css/core` import is replaced by generated CSS.

## Class candidate extraction

Use `@stet-css/source` when a tool only needs unvalidated class-like candidates from source content:

```ts
import { extractClassCandidates } from '@stet-css/source'

const result = extractClassCandidates(source)
```
