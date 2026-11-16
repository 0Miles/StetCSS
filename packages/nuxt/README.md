# @stet-css/nuxt

Nuxt module for StetCSS.

## Installation

```bash
npm install @stet-css/nuxt
```

## Usage

```ts
export default defineNuxtConfig({
  modules: [
    '@stet-css/nuxt'
  ]
})
```

Import the default stylesheet from a global Vue style block:

```vue
<style>
@import '@stet-css/core';
</style>
```

The module builds static CSS for every Nuxt build: `nuxt build`, `nuxt generate`, and `ssr: false` apps. Classes come from the project's files under the Nuxt root and from every layer, including server components (`.server.vue`), `layers/`, and layers added with `extends`. Add other directories with `@source` in your stylesheet.

## Options

```ts
export default defineNuxtConfig({
  modules: [
    ['@stet-css/nuxt', {
      adapters: [{
        name: 'markdown-attributes',
        test: /\.md$/,
        async extract({ content }) {
          // `{.fg:red .bold}` attribute lists
          return [...content.matchAll(/\{\.([^}]*)\}/g)].flatMap((match) => match[1].split(/\s+\.?/))
        }
      }]
    }]
  ]
})
```

The module also reads these options from the `stetcss` key of the Nuxt config.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `adapters` | `SourceAdapter[]` | `[]` | Custom source adapters. For each file the class set reads, the first adapter whose `test` matches extracts its classes, custom ones before the built-in ones. |

`adapters` is the only option. Any other key throws and names `adapters`; a removed key such as `mode`, `injectRuntime` or `scanner` names its replacement, and class rules (`@safelist`, `@blocklist`, `@source`, `@source not`) go in the CSS entry. An adapter sees the files the class set reads: the project's source files and the entry's `@source` files.

See [`examples/nuxt.js`](https://github.com/0Miles/StetCSS/tree/main/examples/nuxt.js) for a full project setup.
