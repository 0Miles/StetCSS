# @stet-css/cli

The command-line entry. The root command scans sources and writes extracted CSS, restarting under `--watch` when a manifest dependency changes; the `lint` and `inspect` subcommands front `@stet-css/lint` and `@stet-css/diagnostics`.

## Boundaries

- Which files and classes the root command reads, and CSS composition (`createExtractedCSS`, `resolveStylesheetSourceFiles`) → `@stet-css/stylesheet`; the root command does not glob or scan sources itself, and passes source path arguments as `sources`. Manifest entries → `@stet-css/project`.
- Lint rules → `@stet-css/lint`; inspection reports → `@stet-css/diagnostics`.

## Risks

- **Command surface**: one package-name binary (string `bin`), the root command, `lint` and `inspect`. `extract`, `render` and `scan` are removed and exit with an error. Add commands or aliases only when the task asks.
- **`--no-export`** prints CSS to stdout and writes no file, even with an output path set.
- **Default output** `master.css` (`src/constants.ts`) is user-facing; change it only on request.
- **Watch**: a `resetDependencies` change closes every watcher, resets the scanner, rewrites output, and restarts watching. Source files are watched as the list `resolveStylesheetSourceFiles` returned at start; a new file is picked up after the next restart.
- **Stylesheet errors**: an entry its author must fix (a `CSSDirectiveError`, a missing import, an unreadable file) becomes `StylesheetEntryError` and is reported as its one-line message: exit 1 on a run, a logged error under `--watch`, which keeps watching the entry so saving the fix restarts. Any other error keeps its stack.
- **Globs**: source path arguments are normalised to `/` so Windows paths match.

## Validation

Tests spawn the CLI from source: extend `tests/extract/` for scan, export and watch behaviour, and `tests/core.test.ts` for root options, `lint` and `inspect`.
