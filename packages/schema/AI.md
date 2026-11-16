# @stet-css/schema

Owns the **wire formats** every layer shares: the `MasterCSSManifest` ABI and its JSON codec, CSS directive results, and syntax IR types. It holds types, serializable constants, and pure codec helpers; the behaviour that uses them lives in the consuming package.

## Boundaries

- CSS directives: schema defines the result types; `@stet-css/lexer` scans directive ranges and `@stet-css/compiler` parses and lowers them.

## Risks

- **Wire formats** (manifest ABI, `manifest-json` codec, directive schema, syntax IR) change only together with their consumers, validated in the same change. A codec change also shows up as a diff in preset's generated `default-manifest.json`.
- **Dependency-light**: schema imports only `csstype` types. It sits in the runtime surface, so it stays free of `node:*` and framework code.
