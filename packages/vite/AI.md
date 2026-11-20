# @stet-css/vite

Owns the Vite plugin chain that builds static CSS: the style entry pipeline, the manifest and emittedGlobals virtual modules, and dev HMR. It injects no runtime and does not touch HTML; a project that runs the runtime imports `@stet-css/runtime` with the two virtual modules itself (`examples/lit`). `@stet-css/nuxt`, `@stet-css/svelte` and `@stet-css/astro` wrap it.

## Boundaries

- Manifest entry discovery and loading live in `@stet-css/project` (`findCSSManifestEntryFiles`, `loadProjectManifest`); this package consumes them rather than scanning the workspace itself.
- The class set (project files, `@source`, `@safelist`, `@blocklist`) lives in `@stet-css/stylesheet`; the plugin scans no modules. The browser runtime lives in `@stet-css/runtime`.
- Framework lifecycle beyond Vite belongs to the wrapping integrations.
- **Integration host** (`PluginHost`, the internal second argument of `stetCSS()`): first-party wrappers name their package (`name`, for option errors), the project root (`projectDir`, read through `utils/project-dir.ts` instead of `config.root`), extra project directories and ignored paths. It is not a user option and stays undocumented in the README; users add directories with `@source`.

## Risks

- **Scanner lifecycle**: the plugin scans no modules with it; the stylesheet reads its `adapters`, `cwd` and default manifest, and the plugin uses its slot placeholder.
- **Dev updates**: `style-entry-hmr.ts` reloads the managed CSS when the watcher reports a file that `isStylesheetSourceFile` accepts and the extracted CSS changed.
- **Dev emittedGlobals**: `virtual:stet-css-emitted-globals` is invalidated in every environment, without an HMR update, so the next page load extracts again:
  - when the watcher reports a file `isStylesheetSourceFile` accepts, before the queued extraction, since the reload an HTML edit triggers can request the module first. This runs on every such save, changed classes or not, because only an extraction can tell; the first module load after a save then pays for one;
  - when a registered entry, or a stylesheet it imports, is edited: `handleHotUpdate` registers the entry again from disk (`registerEditedStyleEntries`) before Vite sends its update, which is a full reload when the page imports the manifest module and requests this module before the entry's transform reruns. Entries registered under a non-stylesheet file (Vue style blocks) wait for their transform;
  - when a style entry's transform changes its registration, which covers its first registration after a module load that came too early.

  The module's load extracts with `extractCSSResult`, which records nothing: a load that reads a save before its watcher event must not become the baseline that save's update compares against. A page left open keeps the list its runtime started with until it reloads.
- **CSS asset names**: Vite hashes a CSS asset while it still holds the build placeholder, before `generateBundle` splices the generated CSS in, so the placeholder carries the build digest (`utils/build-digest.ts`): the generated CSS and source of every entry discovery finds, read from disk, plus registered entries discovery misses, with project-relative paths. It must not depend on transform order (a lazily loaded chunk's stylesheet registers after the main one is transformed) or on the checkout path, and must never be constant, or the file name stops following the CSS and long-lived caches serve old rules. Only an entry discovery misses that registers after another asset was transformed leaves a stale digest; the build then warns and names the asset. Not verified: `vite build --watch` on Vite 6/7, whose watch cache may reuse a stylesheet's transform (and its digest) when only a source file changed.
- **Layer order of kept imports** (`utils/layer-order.ts`): a build host source leads its kept `@import` statements with the `@layer` statements written before them (#183), and Vite's CSS finalizer then hoists every `@import` past them. The build transform records those statements and `generateBundle` moves them back ahead of the hoisted imports, but only when they directly follow the imports at the start of the asset: when another stylesheet's CSS precedes the entry in the same asset, the imports' layers still come first. Dev serves the host source as written.
- **Placeholder match** (`utils/slot.ts`) accepts the minified rule and the multi-line form an unminified build prints (`build.cssMinify: false` with the lightningcss transformer).
- **Splice warning** is tracked per Vite environment (`this.environment.name`); Astro bundles prerender, server and client separately.
- **No-entry warning**: a build where no environment registered a managed CSS entry warns once; the check spans environments so Astro's client build after its server build stays quiet.
- **Dev HMR across environments**: on a class change the CSS entry is invalidated in every non-client `server.environments[*].moduleGraph`, because frameworks inline the server environment's copy into dev HTML; `server.moduleGraph` alone returns the client module.
- **`handleHotUpdate` results replace Vite's update list**: a hook that returns modules (the manifest modules) includes the changed file's own `modules`, or the edited stylesheet never reaches the page; local compose reloads its modules and returns nothing.
- **`virtual:stet-css-manifest`** is the project-level manifest API; keep stylesheet output and scanner usage out of it. **`virtual:stet-css-emitted-globals`** describes only the generated variables and keyframes the runtime treats as already present.
- **Virtual module IDs** are defined in `@stet-css/integration` and imported across integrations; keep them stable.
- **Options**: `PluginOptions` is `ScannerOptions`, only `adapters`. `stetCSS()` checks it with `@stet-css/scanner`'s `validatePluginOptions` before creating any plugin, naming `PluginHost.name` (the wrapper's package: astro, svelte, nuxt) in errors; the removed keys and their replacements live in the scanner's `src/options/index.ts`.
- **One plugin per file**: each `src/plugins/*.ts` defines one plugin and default-exports it.

## Validation

For integration-level changes, build the affected apps under `examples/` when practical.

The manual runtime path is `examples/lit`: `@stet-css/runtime` with both virtual modules.
