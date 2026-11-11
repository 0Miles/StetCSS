# @stet-css/core

The public **facade**: `src/index.ts` re-exports `@stet-css/engine`, and each `src/*.css` entrypoint is a one-line `@import` of `@stet-css/preset`.

## Boundaries

- Stylesheet source: tokens, variants, and utilities live in `@stet-css/preset`; the CSS entrypoints here only import them.
- Inspection: core re-exports inspection types only; inspection value helpers stay in `@stet-css/engine/inspect`.
- Configuration is CSS: `@stet-css/compiler` lowers it into a manifest and `@stet-css/project` loads it.

## Risks

- **Public API**: every facade export is public API, so widen it deliberately; an export change crosses packages.
- **Legacy config API** stays retired: export manifest-driven APIs only, never `Config`, `UtilityDefinition`, `extendConfig`, old utility classes, or `./config` / `./utils` subpaths.
- **Facade tests** prove that entrypoints resolve; CSS output coverage belongs in engine, compiler, or preset tests.
