# @stet-css/sv

The `sv add @stet-css/sv` add-on: one-time **project setup** for SvelteKit apps. It adds `@stet-css/core` and `@stet-css/svelte` to the target app, then edits its `vite.config`, stylesheet, root `+layout.svelte` and `hooks.server`.

## Boundaries

- What the installed code does at build or request time (Vite modes, SSR rendering, hydration manifest, extraction, CSS output) lives in `@stet-css/svelte` and the packages it wraps; this add-on only edits project files.

## Risks

- **Idempotent edits**: a second run leaves files unchanged, and existing Vite configs, stylesheets and server hooks are extended in place.
- **Handle order**: the Master CSS handle stays first in `sequence()`, so its `transformPageChunk` runs after downstream transforms.

## Validation

`tests/sv.testing.test.ts` runs the add-on on kit-js and kit-ts workspaces for each project shape (empty, existing Vite config, hook, `sequence()`, stylesheet, idempotent rerun); add a shape there when the transforms handle a new case.
