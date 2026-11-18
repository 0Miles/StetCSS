# @stet-css/runtime

Browser runtime for StetCSS.

## When to use the runtime

The build integrations generate static CSS ahead of time, and production pages should use it. The runtime generates CSS in the browser instead. It has two entries:

- **CDN**: a page with no build step loads it with one `<script>` tag. It knows only the default preset.
- **Manual import**: a project with a build integration imports it itself, for classes the build cannot see, such as HTML a CMS returns at request time.

## CDN

```html
<!DOCTYPE html>
<html lang="en" hidden>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stet-css/preset@<version>/src/base.css">
  <script src="https://cdn.jsdelivr.net/npm/@stet-css/runtime@<version>"></script>
</head>
<body>
  <h1 class="italic m:3rem fg:strong font:40px font:heavy">Hello World</h1>
</body>
</html>
```

Replace both `<version>` placeholders with the same release, such as `0.1.0`. unpkg serves the same files at `https://unpkg.com/@stet-css/preset@<version>/src/base.css` and `https://unpkg.com/@stet-css/runtime@<version>`. [`examples/cdn`](../../examples/cdn) has this page, pinned to `0.1.0` and with the `onerror` fallback described below.

- Link `base.css` from `@stet-css/preset`. The `base.css` in `@stet-css/core` only imports the preset's file by package name, which a browser cannot resolve.
- Put the `<link>` before the `<script>`: `base.css` declares the cascade layer order the runtime's rules rely on (see [Layer order](#layer-order)).
- The script carries the default manifest, so it makes no other request. It starts in `<head>`, styles the classes of the page as the browser parses them, and registers the document runtime as `globalThis.stetCSSRuntime`.
- Only the default preset works. The CDN runtime reads no options and no project CSS, so `@theme`, `@utilities`, `@components`, and the other directives of a CSS entry have no effect on it.
- For production, generate static CSS with a build integration or the CLI. A CDN page downloads about 36 KB (gzip) of script before it can style anything, and generates every rule again on every visit.

### `hidden` and startup failures

`hidden` on `<html>` keeps the page blank until the runtime's first render, so visitors don't see it unstyled. It is optional. The runtime removes it after the first render. It also removes it when startup fails in a way it can see: `CSSRuntime.create()` or `observe()` throws, or a part of the CDN script throws while it loads.

The runtime cannot remove `hidden` when it never runs:

- **The script does not load**, because of a wrong URL or a network error. Reveal the page from the tag itself:

  ```html
  <script src="https://cdn.jsdelivr.net/npm/@stet-css/runtime@<version>" onerror="document.documentElement.hidden = false"></script>
  ```

- **A Content Security Policy blocks the CDN.** A policy strict enough for that also blocks inline handlers such as `onerror`, so the page stays blank. Allow the CDN in `script-src` and `style-src`, or leave `hidden` out.
- **JavaScript is turned off.** Nothing runs, so the page stays blank. Leave `hidden` out of pages that must stay readable without JavaScript, or use static CSS.
- **Your own code fails before `CSSRuntime.create()`** (manual import only), for example a module your entry imports throws while it loads. Start the runtime from the first module your entry imports, or remove `hidden` in your own error handling.

## Manual import

```bash
npm install @stet-css/runtime
```

The build integrations (`@stet-css/vite`, `@stet-css/webpack`, `@stet-css/next`) provide two virtual modules for the runtime: `virtual:stet-css-manifest`, the manifest built from your CSS entry, and `virtual:stet-css-emitted-globals`, the variables and keyframes that entry already emitted.

```js
import CSSRuntime from '@stet-css/runtime'
import manifest from 'virtual:stet-css-manifest'
import emittedGlobals from 'virtual:stet-css-emitted-globals'

CSSRuntime.create({ manifest, emittedGlobals }).observe()
```

For their types, add `/// <reference types="@stet-css/integration/client" />` to a declaration file and install `@stet-css/integration`. Keep your CSS entry as it is (`@import '@stet-css/core';`) and link it in the HTML `<head>`, so it loads before the runtime starts.

To style a shadow root, pass it as `root`, or decorate a custom element with `cssRuntime`, which starts a runtime for the element's shadow root when the element connects:

```ts
import { LitElement } from 'lit'
import { cssRuntime } from '@stet-css/runtime'
import manifest from 'virtual:stet-css-manifest'
import emittedGlobals from 'virtual:stet-css-emitted-globals'

@cssRuntime({ manifest, emittedGlobals })
class MyElement extends LitElement { /* … */ }
```

In a shadow root the runtime puts theme variables on `:host`, because `:root` never matches inside a shadow tree. That pins each variable it writes to the host element: a value the page sets on `:root`, by hand or through a runtime for the document, no longer reaches the shadow tree for that variable. To override a theme variable for a component, target its host element from the page, for example `my-element { --color-primary: #0af }`; the page's rule beats the shadow root's `:host` rule.

With `mode-trigger: class`, the default mode covers the whole shadow tree and another mode applies only below an element inside it that carries the mode class; a class outside the shadow root, such as `<html class="dark">`, does not reach it. With `mode-trigger: host`, put the mode class on the host element. Both hold for variables your build already emitted: the page's mode rules never match inside a shadow tree, so the runtime writes mode variables there again.

[`examples/lit`](../../examples/lit) uses both modules this way. A project without a build integration can pass the default preset's manifest instead, as [`examples/angular`](../../examples/angular) does; it then knows only the default preset, like the CDN:

```ts
import CSSRuntime, { type StetCSSManifest } from '@stet-css/runtime'
import defaultManifest from '@stet-css/preset/default-manifest.json'

CSSRuntime.create({ manifest: defaultManifest as unknown as StetCSSManifest }).observe()
```

Such a project loads `@stet-css/core/base.css` itself, before the runtime starts.

### Rules generated twice

The build still emits static CSS for every class it finds in your sources. The runtime does not read that CSS: it generates a rule for every class on the page into its own `style#stet-css` at the end of `<head>`. A class the build already saw therefore has the same rule twice. The page looks the same: both copies sit in the same cascade layer with the same selector and declarations, the order between layers comes from the `@layer` statement in `base.css` rather than from which sheet comes later, and your own normal declarations outside layers still outrank both (`!important` ones in a layer beat unlayered ones, as in plain CSS). The cost is the extra rules in the CSSOM and the time spent generating them.

### Layer order

`base.css` starts with:

```css
@layer theme, base, defaults, components, utilities;
```

The runtime's sheet does not repeat this statement. Load `base.css`, or the CSS entry that includes it, before the runtime starts. Otherwise layers rank by where they first appear: the layers `base.css` adds later, such as `base` and `defaults` with its preflight, outrank the runtime's `components` and `utilities`.

The runtime keeps its own layer blocks in this order in every root. That is what orders them in a shadow root, which does not see the page's CSS.

## API

### `CSSRuntime`

```ts
import CSSRuntime from '@stet-css/runtime'
import manifest from 'virtual:stet-css-manifest'

const cssRuntime = CSSRuntime.create({ manifest })
cssRuntime.observe()
```

`CSSRuntime` runs in the browser and extends the manifest-driven `StetCSS` engine. Use `CSSRuntime.create({ manifest })` when the runtime should reuse an existing runtime for the same root.

| API | Type | Description |
| --- | --- | --- |
| `CSSRuntime.instances` | `WeakMap<Document \| ShadowRoot, CSSRuntime>` | Runtime instances keyed by root. |
| `CSSRuntime.create(options)` | `CSSRuntime` | Creates or reuses a registered runtime for `options.root`. |
| `cssRuntime.root` | `Document \| ShadowRoot` | Observed root. |
| `cssRuntime.host` | `Element` | Root host, usually `root.host` or `document.documentElement`. |
| `cssRuntime.container` | `HTMLElement \| ShadowRoot` | Container for `style#stet-css`. |
| `cssRuntime.observing` | `boolean` | `true` after `observe()`, `false` after `disconnect()`. |
| `cssRuntime.classCounts` | `Map<string, number>` | Active DOM class usage counts. This is the source of truth for observed DOM usage. |
| `cssRuntime.classUtilities` | `Map<string, Utility[]>` | Generated rule cache. It can include retained mutation rules that are no longer active in the DOM. |
| `cssRuntime.retainedClassNames` | `Set<string>` | Mutation-removed class names whose generated rules are temporarily retained in CSSOM. |
| `register()` | `this` | Registers this runtime in `CSSRuntime.instances`. |
| `unregister()` | `this` | Removes this runtime from `CSSRuntime.instances`. |
| `observe()` | `this` | Creates the runtime's own `style#stet-css`, generates rules for the classes already in the root, and observes class attribute changes. It never reads or removes a `style#stet-css` that is already on the page. |
| `ensureClassRules(...classNames)` | `this` | Synchronously ensures generated rules exist for class names. Use this to warm rules before DOM insertion. |
| `deleteClassRules(...classNames)` | `void` | Synchronously deletes generated rules for class names. |
| `flushRetainedClassRules()` | `number` | Synchronously removes retained mutation rules that are no longer active and returns the removed class count. |
| `disconnect()` | `this \| undefined` | Cancels observation. |
| `refresh(manifest?)` | `this` | Refreshes with a complete `StetCSSManifest`. |
| `reset()` | `this` | Clears rules and styles. |
| `destroy()` | `this` | Removes this runtime from `CSSRuntime.instances`. |

MutationObserver additions update `classCounts` immediately. Existing and retained generated rules are reused immediately, while first-time rules discovered by the observer are batched into the next pre-paint flush. MutationObserver removals also update `classCounts` immediately, but generated CSS rules may be retained briefly to avoid CSSOM deletion during interaction-heavy updates. Re-adding a retained class reuses the existing generated rule. Direct `cssRuntime.ensureClassRules(...)`, `cssRuntime.deleteClassRules(...)`, `refresh()`, `disconnect()`, and `destroy()` stay synchronous.

Remove any runtime `<style>` element an older build left in your HTML, such as the `style#master-css` that upstream Master CSS builds render. The runtime never reads or removes it and renders into its own `style#stet-css` instead; on a page that does not load `base.css` first, an `@layer` statement inside the old sheet can fix a different layer order before the runtime's own sheet loads.

### Emitted Globals

```ts
import CSSRuntime from '@stet-css/runtime'
import manifest from 'virtual:stet-css-manifest'
import emittedGlobals from 'virtual:stet-css-emitted-globals'

CSSRuntime.create({ manifest, emittedGlobals }).observe()
```

`emittedGlobals` tells the runtime which variables and keyframes were already emitted by the project CSS entry, so future dynamic classes can reuse them without inserting duplicate global CSS.
