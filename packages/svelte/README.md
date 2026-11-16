# @stet-css/svelte

Svelte and SvelteKit integration for StetCSS.

## Installation

`@stet-css/svelte` provides the SvelteKit Vite integration. With no options it builds static CSS for the classes in your project's files, `.svelte` files included, in both `vite dev` and `vite build`; no server hook is needed.

```bash
npm install @stet-css/core @stet-css/svelte
```

### Vite plugin

```ts
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import stetCSS from '@stet-css/svelte/vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    stetCSS()
  ]
})
```

### Stylesheet

```css
@import '@stet-css/core';
```

### Options

The options are the `@stet-css/vite` plugin options.

```ts
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

See [`examples/svelte`](https://github.com/0Miles/StetCSS/tree/main/examples/svelte) for a full project setup.
