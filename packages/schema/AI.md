# @stet-css/schema

Owns the **wire formats** every layer shares: the `MasterCSSManifest` ABI and its JSON codec, the hydration manifest shape and constants, CSS directive results, and syntax IR types. It holds types, serializable constants, and pure codec helpers; the behaviour that uses them lives in the consuming package.

## Boundaries

- CSS directives: schema defines the result types; `@stet-css/lexer` scans directive ranges and `@stet-css/compiler` parses and lowers them.
- Hydration manifest: schema defines the shape and the `MASTER_CSS_HYDRATION_MANIFEST_*` constants; `@stet-css/engine` generates it (`createHydrationManifest`), server and framework adapters write it into pages, and `@stet-css/runtime` reads it back.

## Risks

- **Wire formats** (manifest ABI, `manifest-json` codec, hydration manifest shape and constants, directive schema, syntax IR) change only together with their consumers, validated in the same change. A codec change also shows up as a diff in preset's generated `default-manifest.json`.
- **Dependency-light**: schema imports only `csstype` types. It sits in the runtime surface, so it stays free of `node:*` and framework code.
