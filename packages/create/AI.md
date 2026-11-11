# AI Notes For `@stet-css/create`

## Responsibility

`@stet-css/create` is the add-first installer for adding Master CSS to existing projects.

## Owns

- CLI setup planning and command-line option handling.
- Framework detection for setup routing.
- Safe project file edits for generated setup files and config snippets.
- Package dependency planning for Master CSS, ESLint config, MCP, and optional AI helper files.

## Does Not Own

- Runtime, server, scanner, engine, compiler, or CSS output behavior.
- Framework integration internals owned by `@stet-css/vite`, `@stet-css/next`, `@stet-css/nuxt`, `@stet-css/astro`, `@stet-css/svelte`, or `@stet-css/webpack`.
- SvelteKit file mutation internals owned by `@stet-css/sv`.
- ESLint rule behavior owned by `@stet-css/lint` and `@stet-css/eslint-plugin`.

## Public Surface

- Binary: `create-css`.
- Root export for setup planning and application helpers.
- `npm create @stet-css` and equivalent package-manager create/dlx flows resolve to this package.

## Key Files

- `src/index.ts`
- `src/core.ts`
- `src/transforms.ts`
- `src/bin/index.ts`

## Risk Areas

- Overwriting existing project config files.
- Running package manager installs unexpectedly.
- Producing stale ESLint flat config examples.
- Treating SvelteKit setup as generic Vite setup instead of delegating to `@stet-css/sv`.

## Validation

```sh
pnpm --filter @stet-css/create test
pnpm --filter @stet-css/create lint
pnpm --filter @stet-css/create build
```
