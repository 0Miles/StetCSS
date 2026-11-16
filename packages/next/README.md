# @stet-css/next

Next.js integration for Master CSS.

## Installation

```bash
npm install @stet-css/next
```

## Usage

```js
import { withMasterCSS } from '@stet-css/next'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
  /* your Next.js config */
})

export default nextConfig
```

## How it works

`withMasterCSS` takes no mode: every build gets static CSS.

- Stylesheet entries (CSS files that `@import '@stet-css/core'`) are rewritten to import one generated module, `.master/next.css`. The `.master` directory ignores itself in git.
- The generated module is computed from the project's files in one pass when Next compiles it: the project's own source files plus `@source`, minus `@source not`, plus `@safelist`, minus `@blocklist`. Classes used only in Server Components, and pages built with `output: 'export'`, are covered.
- Turbopack and `next build --webpack` both get the CSS. In `next dev`, editing a source file or a stylesheet updates the CSS.
- CSS files that import `@stet-css/core` keep all of their native CSS, the same as any other CSS file.
- Local stylesheets such as CSS Modules can use `@compose`, `@variant` and `@reference`; they are lowered in place.
- `node_modules` and workspace packages outside the project root are not read. List them with `@source` in the entry.

`withMasterCSS` returns a plain config object synchronously, so it composes with other wrappers on either side:

```js
export default withBundleAnalyzer(withMasterCSS(nextConfig))
```

## Client types

Add `@stet-css/integration/client` to a project environment file when TypeScript imports Master CSS virtual modules.

```ts
/// <reference types="@stet-css/integration/client" />
```

## Runtime input imports

The integration exposes canonical project-level runtime input modules:

```ts
import manifest from 'virtual:stet-css-manifest'
import emittedGlobals from 'virtual:stet-css-emitted-globals'
```

Use these virtual modules when application code should receive the same manifest graph and emittedGlobals global CSS state discovered from the project CSS entry.

## Options

```js
export default withMasterCSS(nextConfig, {
  adapters: [{
    name: 'markdown-attributes',
    test: /\.md$/,
    async extract({ content }) {
      // `{.fg:red .bold}` attribute lists
      return [...content.matchAll(/\{\.([^}]*)\}/g)].flatMap((match) => match[1].split(/\s+\.?/))
    }
  }]
})
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `adapters` | `SourceAdapter[]` | `[]` | Custom source adapters. For each file the class set reads, the first adapter whose `test` matches extracts its classes, custom ones before the built-in ones. |

`adapters` is the only option. Any other key throws and names `adapters`; a removed key such as `mode`, `injectRuntime` or `scanner` names its replacement, and class rules (`@safelist`, `@blocklist`, `@source`, `@source not`) go in the CSS entry. An adapter sees the files the class set reads: the project's source files and the entry's `@source` files.

Custom adapters need webpack: run `next dev --webpack` and `next build --webpack`. Turbopack passes loader options to its workers as JSON, which drops the adapter functions, so `withMasterCSS` throws when Turbopack runs with custom adapters.

See the [Next.js installation guide](https://rc.css.master.co/guide/installation/nextjs) for a full setup.
