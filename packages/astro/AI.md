# @stet-css/astro

Owns the Astro integration: it registers `@stet-css/vite` in static mode through `astro:config:setup` and nothing else. It injects no runtime, registers no middleware and rewrites no built HTML.

## Boundaries

- Static CSS generation, dev updates and the project class set live in `@stet-css/vite`; this package only forces `mode: 'static'` and drops `mode`, `injectRuntime` and `avoidFOUC` from its options type.
- Astro source extraction lives in `@stet-css/source`.

## Risks

- **Split builds**: Astro builds the prerender, server and client environments separately; classes reach the CSS from the project's files, not from the modules a given environment compiles.
- **Inline `@import`**: Astro inlines `@import` in `.astro` `<style>` blocks before Vite plugins run, so `@import '@stet-css/core'` there ships raw preset source; the Vite plugin's no-entry build warning names the supported pattern (import a `.css` file).

- **Silent unstyled build**: when no stylesheet imports Master CSS, `@stet-css/vite` warns at build end; keep that warning reachable from Astro builds.

## Validation

`tests/static-build.test.ts` builds `tests/fixtures/static-build` (prerendered page, `prerender = false` page, server island) with a stub adapter. Also build `examples/astro` when Astro behaviour changes, and check that every class in its `.astro` files that generates a rule appears in `dist/_astro/*.css`.
