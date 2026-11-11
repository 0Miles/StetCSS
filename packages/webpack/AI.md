# @stet-css/webpack

Owns the Webpack plugin: it feeds compiled module sources to `CSSScanner`, keeps generated CSS, manifest and emittedGlobals in **virtual modules** (`webpack-virtual-modules`), runs the style CSS loader, and injects runtime and manifest preloads into HTML assets emitted by the compilation.

## Boundaries

- Class extraction lives in `@stet-css/scanner`; `CSSScanner` stays the single source of extraction behaviour, and this package reuses it rather than duplicating scanner logic.
- Manifest discovery and loading live in `@stet-css/project`.

## Risks

- **Module source detection** depends on Webpack internals (`_source`, `originalSource()` in `src/plugins/usage-graph.ts`).
- **Virtual modules** drive static CSS output. Their paths come from `@stet-css/integration/node` (under `node_modules/.master-css`) and stay compatible with configured scanner options; keep id behaviour stable.
- **Runtime injection** goes through Webpack asset and entry orchestration (`src/plugins/runtime-entry.ts`, `src/plugins/runtime-html-assets.ts`), never app source rewrites. It mutates only HTML assets in the compilation; devServer static files are out of reach.
- **Script and preload tags** match the output type: `modulepreload` for module output, `preload as="script"` for classic output.
- **Cross-integration parity**: audit runtime, preload, mode-default and cascade-layer changes against Vite, Next, Nuxt and Astro so integration behaviour does not drift.

## Validation

Build `examples/webpack` when plugin behaviour changes.
