# AI Notes For `@stet-css/svelte`

## Responsibility

`@stet-css/svelte` provides a SvelteKit Vite wrapper and a SvelteKit server hook that injects early streamed CSS through `@stet-css/server`.

## Owns

- SvelteKit Vite wrapper.
- SvelteKit `hooks.server` integration.

## Does Not Own

- Runtime core behavior.
- Server rendering internals.
- Vite mode semantics beyond the wrapper.
- Generated CSS semantics.
- Svelte source extraction implementation; `@stet-css/source` owns it.

## Public Surface

- `./vite`
- `./hooks.server`

## Key Files

- `src/lib/server.ts`
- `src/lib/hooks.server.ts`
- `src/lib/vite.ts`

## Risk Areas

- Svelte package output behavior.
- Server hook streaming behavior and early CSS injection.

## Safe Changes

- Focused adapter, Vite wrapper, or hook fixes with tests or example validation.
- Packaging fixes that preserve public subpaths.

## Dangerous Changes

- Duplicating server or runtime logic here.
- Adding a default export to the root entry.
- Changing streaming behavior without validation.

## Validation

```sh
pnpm --filter @stet-css/svelte test
pnpm --filter @stet-css/svelte lint
pnpm --filter @stet-css/svelte check
pnpm --filter @stet-css/svelte build
```
