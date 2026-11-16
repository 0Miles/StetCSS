# @stet-css/astro

Astro integration for StetCSS.

## Installation

```bash
npm install @stet-css/astro
```

## Usage

```js
import { defineConfig } from 'astro/config'
import stetCSS from '@stet-css/astro'

export default defineConfig({
  integrations: [
    stetCSS()
  ]
})
```

`stetCSS()` builds static CSS. It reads classes from the project's files, `.astro` templates included, and writes their rules into the CSS that imports StetCSS. Nothing ships to the browser besides that CSS: no runtime script, no `<style id="stet-css">`. `astro dev` updates the CSS when a class changes.

Import StetCSS from a CSS file:

```css
/* src/styles/global.css */
@import '@stet-css/core';
```

and import that file from a layout or page:

```astro
---
import '../styles/global.css'
---
```

Do not write `@import '@stet-css/core'` inside an `.astro` `<style>` block, `is:global` or not. Astro inlines `@import` in `<style>` blocks before Vite plugins see them, so the page ships the raw preset source instead of generated CSS.

## Options

The options are the `@stet-css/vite` plugin options.

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

See [`examples/astro`](https://github.com/0Miles/StetCSS/tree/main/examples/astro) for a full project setup.
