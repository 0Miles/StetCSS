# AI Notes For `@stet-css/cli`

## Responsibility

`@stet-css/cli` exposes the package-name binary for command-line scan and extraction workflows.

## Owns

- CLI argument handling.
- Watch command lifecycle.
- CLI logging and generated CSS stdout/file output orchestration.

## Does Not Own

- Scanner extraction semantics.
- Server rendering behavior.
- CSS generation, validation, or manifest compilation.
- Additional command aliases or subcommands unless explicitly requested.

## Public Surface

- Binary: `@stet-css/cli`.
- Internal command runner from `src/core.ts`.
- No public `extract`, `scan`, `render`, `mcss`, or `mastercss` aliases.

## Key Files

- `src/core.ts`
- `src/bin/index.ts`
- `src/scan.ts`

## Risk Areas

- Root `--watch` event lifecycle.
- Manifest path loading.
- Cross-platform glob behavior.
- Respecting `--no-export` when output paths are configured.

## Safe Changes

- CLI option fixes with command tests.
- Watch behavior fixes.
- Logging fixes that do not alter generated output.

## Dangerous Changes

- Duplicating scanner logic in the CLI.
- Writing generated CSS when `--no-export` is set.
- Changing default output paths casually.
- Adding command aliases or subcommands without explicit request.

## Validation

```sh
pnpm --filter @stet-css/cli test
pnpm --filter @stet-css/cli lint
pnpm --filter @stet-css/cli type-check
pnpm --filter @stet-css/cli build
```

Use or extend `tests/extract` and root command tests for command behavior changes.
