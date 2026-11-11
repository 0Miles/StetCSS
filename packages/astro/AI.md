# @stet-css/astro

Owns the Astro integration: it runs `@stet-css/vite` underneath, injects the runtime through Astro's `injectScript` for `runtime` and `progressive`, and registers `pre`-order **middleware** (`./middleware`) that renders CSS into server HTML for `pre-render` and `progressive`. After build it adds runtime manifest preloads (`src/runtime-preload.ts`) and externalizes hydration manifests.

## Boundaries

- Mode semantics and option defaults live in `@stet-css/vite`; this package overrides only the mode default (`progressive`).
- HTML rendering lives in `@stet-css/server`; Astro source extraction in `@stet-css/source`.

## Risks

- **Single runtime injection**: in `runtime` mode Astro injects the runtime itself and passes `injectRuntime: false` to the Vite plugin, so only one copy loads.
- **Single pre-render path**: `pre-render` and `progressive` pass `mode: null` to the Vite plugin and render through middleware. Re-enabling Vite's HTML pre-render plugin for them needs duplicate-style handling first.
- **Middleware timing**: both modes depend on the middleware seeing HTML before Astro sends or writes it.

## Validation

Build `examples/astro` when Astro rendering behaviour changes.
