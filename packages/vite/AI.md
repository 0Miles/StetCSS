# @stet-css/vite

Owns the Vite plugin chain that builds static CSS: the style entry pipeline, the manifest and emittedGlobals virtual modules, and dev HMR. It injects no runtime and does not touch HTML; a project that runs the runtime imports `@stet-css/runtime` with the two virtual modules itself (`examples/lit`). `@stet-css/nuxt`, `@stet-css/svelte` and `@stet-css/astro` wrap it.

## Boundaries

- Manifest entry discovery and loading live in `@stet-css/project` (`findCSSManifestEntryFiles`, `loadProjectManifest`); this package consumes them rather than scanning the workspace itself.
- The class set (project files, `@source`, `@safelist`, `@blocklist`) lives in `@stet-css/stylesheet`; the plugin scans no modules. The browser runtime lives in `@stet-css/runtime`.
- Framework lifecycle beyond Vite belongs to the wrapping integrations.
- **Integration host** (`PluginHost`, the internal second argument of `masterCSS()`): first-party wrappers name the project root (`projectDir`, read through `utils/project-dir.ts` instead of `config.root`), extra project directories and ignored paths. It is not a user option and stays undocumented in the README; users add directories with `@source`.

## Risks

- **Scanner lifecycle**: the plugin scans no modules with it; the stylesheet reads its `adapters`, `cwd` and default manifest, and the plugin uses its slot placeholder.
- **Dev updates**: `style-entry-hmr.ts` reloads the managed CSS when the watcher reports a file that `isStylesheetSourceFile` accepts and the extracted CSS changed.
- **Splice warning** is tracked per Vite environment (`this.environment.name`); Astro bundles prerender, server and client separately.
- **No-entry warning**: a build where no environment registered a managed CSS entry warns once; the check spans environments so Astro's client build after its server build stays quiet.
- **Dev HMR across environments**: on a class change the CSS entry is invalidated in every non-client `server.environments[*].moduleGraph`, because frameworks inline the server environment's copy into dev HTML; `server.moduleGraph` alone returns the client module.
- **`handleHotUpdate` results replace Vite's update list**: a hook that returns modules (the manifest modules) includes the changed file's own `modules`, or the edited stylesheet never reaches the page; local compose reloads its modules and returns nothing.
- **`virtual:master-css-manifest`** is the project-level manifest API; keep stylesheet output and scanner usage out of it. **`virtual:master-css-emitted-globals`** describes only the generated variables and keyframes the runtime treats as already present.
- **Virtual module IDs** are defined in `@stet-css/integration` and imported across integrations; keep them stable.
- **Options**: `PluginOptions` holds only `scanner`, whose only key is `adapters` (the scanner throws on any other); the defaults in `src/options.ts` are empty; #66 flattens it.
- **One plugin per file**: each `src/plugins/*.ts` defines one plugin and default-exports it.

## Validation

For integration-level changes, build the affected apps under `examples/` when practical.

The manual runtime path is `examples/lit`: `@stet-css/runtime` with both virtual modules.
