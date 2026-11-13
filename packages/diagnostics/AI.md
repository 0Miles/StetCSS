# @stet-css/diagnostics

Owns the adapter-neutral **inspection report** behind the CLI `inspect` command: per-file scanner class state for the files `@stet-css/stylesheet` resolves (the same files the root command reads), managed stylesheet entries, generated CSS size, and missing-CSS classification for explicit class checks.

## Boundaries

- Class lint policy, class-list edits, and source-content linting → `@stet-css/lint`.
- Output formatting, exit codes, and watch lifecycle → `@stet-css/cli`. Pulling lint policy or adapter behaviour in here risks package-boundary cycles.
- Class semantics, scanner extraction, and stylesheet compilation belong to the packages the report reads; fix them there.

## Risks

- **Report shape**: the CLI reads the top-level shape and its `version` (`MASTER_CSS_INSPECTION_REPORT_VERSION`); keep both stable.
- **Stylesheet entry errors** stay in `diagnostics` alongside scanner diagnostics.
- **CLI exit code**: source discovery and missing-CSS classification feed `summary.errors` and `summary.warnings`, which set the CLI exit code, so broadening either changes CLI behaviour.
