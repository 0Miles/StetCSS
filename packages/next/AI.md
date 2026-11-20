# @stet-css/next

Owns the Next.js integration behind `withStetCSS`: static CSS only, for Turbopack and `next build --webpack`. `withStetCSS` returns the config synchronously so other `withX` wrappers compose on either side.

## Boundaries

- The class set (project files, `@source`, `@source not`, `@safelist`, `@blocklist`) and CSS rendering live in `@stet-css/stylesheet`; this package only wires loaders. Entry discovery lives in `@stet-css/project`.
- Webpack-specific extraction lives in `@stet-css/webpack`, which this package does not use.
- `virtual:stet-css-manifest` and `virtual:stet-css-emitted-globals` stay for a runtime the user imports by hand; the integration injects no runtime.

## Risks

- **Generated module**: stylesheet entries are rewritten (`src/style-css-loader.ts`) to `@import` `.stet/next.css`; `src/generated-css-loader.ts` fills that module from the files on disk and registers every file it read as a dependency, which is what makes dev update. `withStetCSS` writes a placeholder so bundlers can resolve the file.
- **webpack**: css-loader requests `@import`ed files with `-!`, which skips configured loaders, so under webpack the entry loader also writes the generated CSS to `.stet/next.css` (atomically; client and server compilers write it in parallel). Use `resource`, not `test`/`include`, for CSS rules: Next disables its built-in CSS when a user rule's `test` or `include` matches `.css`.
- **Options**: only `adapters`, checked by `validatePluginOptions` when the config loads. Turbopack loader options are serialized to JSON for its workers, which drops adapter functions, so only the webpack loaders get `adapters`, and `withStetCSS` throws when custom adapters meet Turbopack (`process.env.TURBOPACK`, which `next dev`/`next build` set before loading the config). next-rspack sets `NEXT_RSPACK` after that, so an rspack build with custom adapters also hits this error; rspack is not a supported target.
- **CSS Modules**: Turbopack compiles a loader's output by the rule's `as` name, so `*.module.(css|scss|sass)` files get their own style loader rule renamed `*.module.css`; renamed `*.css`, they ship global and export no class names. The style loader passes `cssModule` for the same files so the generated theme rules stay global and pass webpack's pure mode, also for Sass modules after the production `compressed` Sass pass (#244).
- **Turbopack JS loader rules** stay guarded by the `?stet-css-manifest` content pattern and limited to manifest-import handling; broader rules break Next client component classification for linked workspace packages.
- **Cross-integration parity**: audit class-set, output-path and cascade-layer changes against Vite, Webpack, Nuxt and Astro so integration behaviour does not drift.

## Validation

When integration behaviour changes, also run `bun run --filter @stet-css/next e2e` (the `tests/*-e2e.test.ts` files, excluded from `test`; Vitest selects them only under `--mode e2e`, which the `e2e` script passes; they build Turbopack, `--webpack`, `output: 'export'`, CSS Module (`e2e/css-module-compose`) and custom-adapter (`e2e/adapters`) fixtures and run `next dev`) and `bun run --filter @stet-css/next dev:build` (builds `playground/`).

`bun run --filter @stet-css/next bench` (`tests/style-css-loader.bench.ts`) measures what one CSS Module and one `@reference` stylesheet cost the style loader once the project is compiled (#202); its numbers are evidence, not a gate.
