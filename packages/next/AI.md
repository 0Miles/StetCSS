# @stet-css/next

Owns the Next.js integration behind `withMasterCSS`: static CSS only, for Turbopack and `next build --webpack`. `withMasterCSS` returns the config synchronously so other `withX` wrappers compose on either side.

## Boundaries

- The class set (project files, `@source`, `@source not`, `@safelist`, `@blocklist`) and CSS rendering live in `@stet-css/stylesheet`; this package only wires loaders. Entry discovery lives in `@stet-css/project`.
- Webpack-specific extraction lives in `@stet-css/webpack`, which this package does not use.
- `virtual:master-css-manifest` and `virtual:master-css-emitted-globals` stay for a runtime the user imports by hand; the integration injects no runtime.

## Risks

- **Generated module**: stylesheet entries are rewritten (`src/style-css-loader.ts`) to `@import` `.master/next.css`; `src/generated-css-loader.ts` fills that module from the files on disk and registers every file it read as a dependency, which is what makes dev update. `withMasterCSS` writes a placeholder so bundlers can resolve the file.
- **webpack**: css-loader requests `@import`ed files with `-!`, which skips configured loaders, so under webpack the entry loader also writes the generated CSS to `.master/next.css` (atomically; client and server compilers write it in parallel). Use `resource`, not `test`/`include`, for CSS rules: Next disables its built-in CSS when a user rule's `test` or `include` matches `.css`.
- **Turbopack loader options** are serialized to JSON for its workers; anything in `scannerOptions` that is not plain data is lost.
- **Turbopack JS loader rules** stay guarded by the `?master-css-manifest` content pattern and limited to manifest-import handling; broader rules break Next client component classification for linked workspace packages.
- **Cross-integration parity**: audit mode-default, class-set and cascade-layer changes against Vite, Webpack, Nuxt and Astro so integration behaviour does not drift.

## Validation

When integration behaviour changes, also run `bun run --filter @stet-css/next e2e` (the `tests/*-e2e.test.ts` files, excluded from `test`; Vitest selects them only under `--mode e2e`, which the `e2e` script passes; they build Turbopack, `--webpack` and `output: 'export'` fixtures and run `next dev`) and `bun run --filter @stet-css/next dev:build` (builds `playground/`).
