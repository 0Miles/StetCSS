<br>
<div align="center">

<p align="center">
  <a href="https://css.master.co">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/33840671/201701649-3bb7d698-abec-4d5f-ac30-ccc4d7bafcd4.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg">
      <img alt="Master CSS" src="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg" width="100%">
    </picture>
  </a>
</p>
<p align="center">Vite plugin for Master CSS</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@stet-css/vite">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@stet-css/vite?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@stet-css/vite?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@stet-css/vite?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Discord Community" href="https://discord.gg/sZNKpAAAw6">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/discord/917780624314613760?color=212022&label=%20&logo=discord&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/discord/917780624314613760?color=f6f7f8&label=%20&logo=discord&style=for-the-badge">
      <img alt="Discord online" src="https://img.shields.io/discord/917780624314613760?color=f6f7f8&label=%20&logo=discord&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Follow @mastercorg" href="https://twitter.com/mastercorg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=212022&logo=twitter&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
      <img alt="Follow @mastercorg" src="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Github Actions" href="https://github.com/master-co/css/actions/workflows/ci-release.yml">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=212022&logo=githubactions&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
      <img alt="Github release actions" src="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
    </picture>
  </a>
</p>

</div>

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
Add the client type reference when TypeScript source files import Master CSS virtual manifest, emittedGlobals, or generated CSS modules:

```ts
/// <reference types="vite/client" />
/// <reference types="@stet-css/integration/client" />
```

## Master CSS imports

Import the generated stylesheet from a source stylesheet.

```css
@import '@stet-css/core';
```

Classes come from the project's own source files, plus `@source` files, minus `@source not` files, plus `@safelist`, minus `@blocklist`, so templates that only a server build compiles, such as Astro pages, get their rules. The plugin does not collect classes from Vite's module graph, so classes that appear only in `node_modules`, outside the Vite root, or only in code another plugin generates need `@source` or `@safelist`; for example, `src/style.css` adds a component library with `@source "../node_modules/my-ui/dist";` (paths are relative to the stylesheet). In dev, the plugin updates the CSS when a file it reads is added, changed or removed; a new file under an `@source` pattern outside the Vite root is picked up after the next change to a watched file or a restart.

Source stylesheets that import `@stet-css/core` keep all of their native CSS, the same as any other CSS file, and the import inserts generated Master CSS.

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

See the [Vite installation guide](https://rc.css.master.co/guide/installation/vite) for a full project setup.
