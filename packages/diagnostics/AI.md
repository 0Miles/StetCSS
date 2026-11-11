# @stet-css/diagnostics

Owns the adapter-neutral **inspection report** shared by the CLI `inspect` command and the MCP scan tool: source pattern resolution, per-file scanner class state, managed stylesheet entries, generated CSS size, and missing-CSS classification for explicit class checks.

## Boundaries

- Class lint policy, class-list edits, and source-content linting → `@stet-css/lint`.
- Output formatting, exit codes, and watch lifecycle → `@stet-css/cli`; tool registration, workspace write safety, and preview tokens → `@stet-css/mcp`. Pulling lint policy or adapter behaviour in here risks package-boundary cycles.
- Class semantics, scanner extraction, and stylesheet compilation belong to the packages the report reads; fix them there.

## Risks

- **Report shape**: the CLI and MCP both read the top-level shape and its `version` (`MASTER_CSS_INSPECTION_REPORT_VERSION`); keep both stable for both consumers.
- **Stylesheet entry errors** stay in `diagnostics` alongside scanner diagnostics.
- **CLI exit code**: source discovery and missing-CSS classification feed `summary.errors` and `summary.warnings`, which set the CLI exit code, so broadening either changes CLI behaviour.
