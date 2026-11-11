# @stet-css/sv

Svelte CLI add-on for one-command Master CSS setup in SvelteKit projects.

## Usage

```bash
npx sv add @stet-css/sv
```

The add-on installs `@stet-css/core` and `@stet-css/svelte`, wires the SvelteKit Vite plugin, creates or updates the project stylesheet entry, imports that stylesheet from the root layout, and composes the SvelteKit server hook.

`@stet-css/sv` is an installer only. User apps keep `@stet-css/svelte` as the runtime and build integration package.

## Support

Only SvelteKit projects are supported.
