# @stet-css/figma

The Figma plugin that exports variable collections and modes as Master CSS variables and imports them back. `src/plugin.min.ts` runs in Figma's **sandbox**; the import and export UIs are Preact bundles built into `out/`, as `manifest.json` expects.

## Boundaries

- Master CSS variable semantics live in `@stet-css/core`; this plugin only maps them to and from Figma collections and modes.

## Risks

- **Round trip**: import and export preserve every variable and the variable data structure (`src/types/variable-data.ts`); nothing drops silently.
- **Aliases**: export writes aliases as `var(--…)`; import does not support them yet and warns through `notify`. Report unsupported aliases as skipped, not as round-tripped.
- **Color conversion** goes through `colorjs.io` into sRGB with gamut mapping; precision and color-space changes come with tests.
- **Figma API** calls are async; their shape follows `@figma/plugin-typings`.

## Validation

Add conversion and import/export tests in `tests/`, stubbing the `figma` global with `tests/__mocks__/figma.ts`.
