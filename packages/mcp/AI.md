# @stet-css/mcp

A stdio MCP server that exposes Master CSS tooling to AI clients as tools, resources and prompts by orchestrating lower packages. It owns **workspace containment** and the two-step **preview → confirm** flow for every file it writes.

## Boundaries

- Class semantics and CSS output → `@stet-css/engine`; completion, hover and formatting → `@stet-css/language-service`; lint rules → `@stet-css/lint`.
- Candidate extraction → `@stet-css/source`; validation → `@stet-css/validator`; CLI behaviour and output contracts → `@stet-css/cli`.

## Risks

- **Writes**: `createPreview` returns a `confirmToken`; `applyPreview` checks expiry, file hashes and containment before touching disk.
- **Containment**: every path and glob resolves inside the configured workspace roots; patterns that escape are rejected.
- **stdout** carries the protocol in stdio mode; diagnostics go to stderr.
- **Public APIs**: orchestrate through lower packages' exports (e.g. `@stet-css/engine/inspect`, `@stet-css/project/*`); CLI implementation files stay private.
