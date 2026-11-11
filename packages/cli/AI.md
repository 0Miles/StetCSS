# @stet-css/cli

The command-line entry. The root command scans sources and writes extracted CSS, restarting under `--watch` when a manifest dependency changes; the `lint` and `inspect` subcommands front `@stet-css/lint` and `@stet-css/diagnostics`.

## Boundaries

- Extraction and validation → `@stet-css/scanner`; CSS composition (`createExtractedCSS`) → `@stet-css/stylesheet`; manifest entries → `@stet-css/project`.
- Lint rules → `@stet-css/lint`; inspection reports → `@stet-css/diagnostics`.

## Risks

- **Command surface**: one package-name binary (string `bin`), the root command, `lint` and `inspect`. `extract`, `render` and `scan` are removed and exit with an error. Add commands or aliases only when the task asks.
- **`--no-export`** prints CSS to stdout and writes no file, even with an output path set.
- **Default output** `master.css` (`src/constants.ts`) is user-facing; change it only on request.
- **Watch**: a `resetDependencies` change closes every watcher, resets the scanner, rewrites output, and restarts watching.
- **Globs**: patterns are normalised to `/` before fast-glob so Windows paths match.

## Validation

Tests spawn the CLI from source: extend `tests/extract/` for scan, export and watch behaviour, and `tests/core.test.ts` for root options, `lint` and `inspect`.
