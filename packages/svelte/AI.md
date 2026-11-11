# @stet-css/svelte

Owns the SvelteKit integration: a Vite wrapper (`./vite`) that runs `@stet-css/vite` in `progressive` mode with `@stet-css/server` kept SSR-external, and a `hooks.server` **handle** that injects CSS early into the streamed response through `transformPageChunk`.

## Boundaries

- Class collection and server CSS rendering live in `@stet-css/server`, the runtime in `@stet-css/runtime`, and mode semantics in `@stet-css/vite`; this package wires them without duplicating their logic.
- Svelte source extraction lives in `@stet-css/source`.

## Risks

- **Subpath surface**: `./vite` and `./hooks.server` are the only entry points, and `@stet-css/sv` writes both specifiers into user projects. Keep the package root without an entry or default export.
- **Streaming injection**: the chunk renderer in `src/lib/server.ts` holds back each chunk's tail until it finds `</head>`, injects once, then passes chunks through. Cover changes in `tests/server.test.ts`.
- **Package output**: only `src/lib` ships, through `svelte-package` and `publint` in `build`; `src/routes` and `src/hooks.server.ts` are the local dev app.

## Validation

Type-check with `pnpm --filter @stet-css/svelte check` (svelte-check). The package has no `type-check` script, so root `pnpm check` skips its types.
