# @stet-css/svelte

Owns the SvelteKit integration: a Vite wrapper (`./vite`) that registers `@stet-css/vite` with the options it is given, so a project with no options gets static CSS built from its class set, `.svelte` files included. There is no server hook: SvelteKit inlines or links the built CSS itself.

## Boundaries

- Mode semantics, the style entry pipeline and the project class set live in `@stet-css/vite`; this package wires them without duplicating their logic.
- Svelte source extraction lives in `@stet-css/source`.

## Risks

- **Subpath surface**: `./vite` is the only entry point. Keep the package root without an entry or default export.
- **Static output**: `tests/sveltekit-static.test.ts` builds and serves a temp SvelteKit project under `tests/.tmp-*` and checks the utilities reach the client CSS and the dev page. SvelteKit reads its config from the working directory, so the test `chdir`s into the project.
- **Package output**: only `src/lib` ships, through `svelte-package` and `publint` in `build`; `src/routes` is the local dev app.

## Validation

Type-check with `bun run --filter @stet-css/svelte check` (svelte-check). The package has no `type-check` script, so root `bun run check` skips its types.
