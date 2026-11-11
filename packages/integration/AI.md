# @stet-css/integration

Owns the **adapter-neutral** protocol every build and framework integration shares: virtual module ids, the `?master-css-manifest` query, generated manifest and `emittedGlobals` module source, manifest facade modules, and the ambient module types in `client.d.ts`.

## Boundaries

- Adapter lifecycle (Vite, Webpack, Next, Nuxt, Astro, Svelte): the adapter's own package.
- Manifest discovery and CSS import graphs: `@stet-css/project` and `@stet-css/compiler`; integration only turns a loaded manifest into module source and ids.
- Browser runtime boot: `@stet-css/runtime`; the facade modules here only load the manifest JSON.

## Risks

- **Browser-safe subpaths** (all except `./node`) stay free of `node:*` imports, `Buffer`, and `process`; path, hash, resolved-id, and file-writing helpers go under `./node`. `tests/browser-safe.test.ts` enforces this for the files in `BROWSER_SAFE_SOURCES`, so add each new browser-safe source there.
- **Virtual ids** (`virtual:master-css-manifest`, `virtual:master-utilities.css`, `virtual:master-css-emitted-globals`, `?master-css-manifest`) are imported by user code and typed in `client.d.ts`; keep them and the generated import specifiers stable.
- **Protocol changes** reach every adapter plus `@stet-css/project` and `@stet-css/stylesheet`, so they cross packages.
