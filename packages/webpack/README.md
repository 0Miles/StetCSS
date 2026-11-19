# @stet-css/webpack

Webpack plugin for StetCSS.

## Installation

```bash
npm install @stet-css/webpack
```

## Usage

```js
import StetCSSPlugin from '@stet-css/webpack'

export default {
  plugins: [
    new StetCSSPlugin()
  ]
}
```

## Client types
Add the client type reference when TypeScript source files import `virtual:stet-utilities.css`, `virtual:stet-css-manifest`, `virtual:stet-css-emitted-globals`, or `?stet-css-manifest` modules:

```ts
/// <reference types="@stet-css/integration/client" />
```

## Stylesheet entry

Import the default stylesheet from your application CSS so the plugin can replace it with generated StetCSS:

```css
@import '@stet-css/core';
```

The plugin builds static CSS with no options: before each compilation it reads the classes from the project's own source files, following the entry's `@source`, `@source not`, `@safelist` and `@blocklist`, and writes the CSS through a virtual module. It works with `style-loader` and with CSS extraction.

- Entries can be `.css`, `.scss` or `.sass` files (Sass entries compile with your project's `sass`), including entries your app imports from outside the project root.
- Files in `node_modules` and in common build output directories are not read; name them with `@source` to include them. Webpack's own `output.path` is never read, not even through `@source`, so emitted bundles cannot feed classes back.
- In watch mode, editing any file the CSS reads rebuilds once. A newly created file that nothing imports is picked up on the next rebuild.
- Local stylesheets such as CSS Modules, and the `<style>` blocks of `.vue` files loaded by `vue-loader`, can use `@compose`, `@variant` and `@reference`; they are lowered in place. In a `<style scoped>` block, the theme variables `@reference` brings in stay on `:root`, and the keyframes they name take the component's scope id, as Vue names that block's own keyframes. `VueLoaderPlugin` can come before or after this plugin.

## Options

```js
new StetCSSPlugin({
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

`adapters` is the only option. Any other key throws and names `adapters`; a removed key such as `mode`, `injectRuntime` or `scanner` names its replacement, and class rules (`@safelist`, `@blocklist`, `@source`, `@source not`) go in the CSS entry. An adapter sees the files the class set reads: the project's source files and the entry's `@source` files. Scanner options passed straight to the plugin (`new StetCSSPlugin({ safelist })`) throw the same way.

See [`examples/webpack`](https://github.com/0Miles/StetCSS/tree/main/examples/webpack) for a complete project setup.
