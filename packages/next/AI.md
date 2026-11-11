# @stet-css/next

Owns the Next.js integration behind `withMasterCSS`: `pre-render` through the Next **Adapter API** (`createAdapter`, `./adapter`), `runtime` through the client instrumentation hook, `progressive` as both, and `static` through generated CSS and Turbopack loaders.

## Boundaries

- Static extraction lives in `@stet-css/scanner`; `CSSScanner` stays the source of static behaviour, driven incrementally by the Turbopack loaders.
- Webpack-specific extraction lives in `@stet-css/webpack`, which this package does not use.

## Risks

- **Build-time only**: `pre-render` rewrites HTML in build outputs. Dynamic SSR responses and App Router request-time class collection stay out of scope; state that limitation instead of masking it with build-time behaviour.
- **Adapter outputs**: process HTML outputs only, and write each fallback HTML once even when several output groups list it. Adapter API types shift across Next major versions.
- **Runtime injection** goes through the instrumentation client that `src/index.ts` generates into `node_modules/.master-css/master-css-next-instrumentation-client.js`; edit the generator. It keeps the user's `instrumentation-client` reachable through the secondary alias `private-next-master-css-user-instrumentation-client` before overriding `private-next-instrumentation-client`. Keep injection out of the React tree (no wrapper components).
- **Turbopack JS loader rules** stay guarded by the `?master-css-manifest` content pattern and limited to manifest-import handling; broader rules break Next client component classification for linked workspace packages.
- **Static mode** runs on Turbopack loaders alone, without `nextConfig.webpack` or `@stet-css/webpack`.
- **Cross-integration parity**: audit runtime, preload, mode-default and cascade-layer changes against Vite, Webpack, Nuxt and Astro so integration behaviour does not drift.

## Validation

When integration behaviour changes, also run `pnpm --filter @stet-css/next e2e` (the `tests/*-e2e.test.ts` files, excluded from `test`) and `pnpm --filter @stet-css/next dev:build` (builds `playground/`).
