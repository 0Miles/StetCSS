# @stet-css/vite

Owns the Vite plugin chain behind the `runtime`, `static`, `pre-render` and `progressive` **modes**: the shared scanner usage graph, the style entry pipeline, the manifest and emittedGlobals virtual modules, runtime injection, FOUC handling, HMR and HTML pre-rendering. `@stet-css/nuxt`, `@stet-css/astro` and `@stet-css/svelte` wrap it.

## Boundaries

- Manifest entry discovery and loading live in `@stet-css/project` (`findCSSManifestEntryFiles`, `loadProjectManifest`); this package consumes them rather than scanning the workspace itself.
- Class extraction lives in `@stet-css/scanner`; the browser runtime in `@stet-css/runtime`.
- Framework lifecycle beyond Vite belongs to the wrapping integrations.

## Risks

- **Scanner lifecycle** is shared by every mode; a change there reaches all four.
- **Style entry pipeline** runs in every mode; `static` differs only by `includeGeneratedCSS` on the plugin context.
- **`virtual:master-css-manifest`** is the project-level manifest API; keep stylesheet output and scanner usage out of it. **`virtual:master-css-emitted-globals`** describes only the generated variables and keyframes the runtime treats as already present.
- **Virtual module IDs** are defined in `@stet-css/integration` and imported across integrations; keep them stable.
- **Option defaults** in `src/options.ts` are spread by every wrapper; change them only as a stated behaviour change.
- **Injected runtime code** (`src/runtime.ts`, published as `@stet-css/vite/runtime` and imported by `@stet-css/astro`) changes together with runtime and integration validation.
- **HTML handling**: FOUC transforms find HTML entries through `HTML_ENTRIES` in `src/common.ts`; runtime injection depends on Vite's HTML transform order; the pre-render plugin disables itself when `vite-plugin-svelte` is present so SvelteKit's server hook renders instead.
- **One plugin per file**: each `src/plugins/*.ts` defines one plugin and default-exports it.

## Validation

For integration-level changes, build the affected apps under `examples/` when practical.
