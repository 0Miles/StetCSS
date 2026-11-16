# @stet-css/vite

Vite plugin for StetCSS.

## Installation

```bash
npm install @stet-css/vite
```

## Usage

```js
import stetCSS from '@stet-css/vite'

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    stetCSS()
  ]
}

export default config
```

Import the default stylesheet from the CSS entry your app already loads:

```css
@import '@stet-css/core';
```

The build writes the rules for the classes in your source into that stylesheet. The plugin only builds static CSS: it adds no runtime script and no `hidden` attribute to your HTML. If your HTML has a hand-written `hidden` on `<html>` for runtime rendering, remove it: the plugin never removes it, so the page would stay blank.

## Client types
Add the client type reference when TypeScript source files import StetCSS virtual manifest, emittedGlobals, or generated CSS modules:

```ts
/// <reference types="vite/client" />
/// <reference types="@stet-css/integration/client" />
```

## StetCSS imports

Import the generated stylesheet from a source stylesheet.

```css
@import '@stet-css/core';
```

Classes come from the project's own source files, plus `@source` files, minus `@source not` files, plus `@safelist`, minus `@blocklist`, so templates that only a server build compiles, such as Astro pages, get their rules. The plugin does not collect classes from Vite's module graph, so classes that appear only in `node_modules`, outside the Vite root, or only in code another plugin generates need `@source` or `@safelist`; for example, `src/style.css` adds a component library with `@source "../node_modules/my-ui/dist";` (paths are relative to the stylesheet). In dev, the plugin updates the CSS when a file it reads is added, changed or removed; a new file under an `@source` pattern outside the Vite root is picked up after the next change to a watched file or a restart.

Source stylesheets that import `@stet-css/core` keep all of their native CSS, the same as any other CSS file, and the import inserts generated StetCSS.

## Runtime input imports

The plugin exposes canonical project-level runtime input modules:

```ts
import manifest from 'virtual:stet-css-manifest'
import emittedGlobals from 'virtual:stet-css-emitted-globals'
```

Use these virtual modules when application code should receive the same manifest graph and emittedGlobals global CSS state that the plugin discovered from the project CSS entry. The plugin never loads the runtime itself: to run it, import `@stet-css/runtime` and pass it both modules, as `examples/lit` does.

## Options

```js
stetCSS({
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

See [`examples/vite`](https://github.com/0Miles/StetCSS/tree/main/examples/vite) for a full project setup.
