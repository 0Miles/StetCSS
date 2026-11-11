# @stet-css/create

The **add-first** installer behind `npm create @stet-css`: it detects the framework in an existing project, then plans and applies setup edits and dependency changes, optionally adding ESLint config, the MCP package and AGENTS.md guidance. New projects come from the framework's own scaffolder.

## Boundaries

- What the setup snippets configure → the framework packages (`@stet-css/vite`, `next`, `nuxt`, `astro`, `svelte`, `webpack`).
- SvelteKit file edits → `@stet-css/sv`; create prints the `sv add @stet-css/sv` command.
- ESLint rule behaviour → `@stet-css/lint` and `@stet-css/eslint-plugin`.

## Risks

- **Existing files** are edited in place through `src/transforms.ts` (planned as `create` / `update` / `skip`), never replaced wholesale.
- **Installs** run only on `--install <package-manager>`, `-y`, or an interactive yes.
- **ESLint config**: `CANONICAL_ESLINT_CONFIG` and `addMasterCSSEslintConfig` track the current `@stet-css/eslint-config` flat-config usage.
