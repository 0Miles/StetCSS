# @stet-css/stylesheet

Owns the **stylesheet entry** pipeline for static rendering: detecting StetCSS entries, expanding their CSS import graph through compiler results, lowering CSS-first and local directives, and composing the generated CSS with its emittedGlobals.

## Boundaries

- Scanner state arrives as the structural `ScannerState` interface (`cwd`, `options.adapters`, `css`). `@stet-css/scanner` sits on the same tier, so it stays a dev dependency.
- Candidate extraction and source adapters → `@stet-css/source`; which files are the project's own sources, and manifest discovery → `@stet-css/project`; CSS output semantics → `@stet-css/engine`.

## Risks

- **Class set**: `src/sources.ts` is the one rule for static classes: the project's own source files and those of the caller's `extraProjectDirs`, each read with itself as the root (or the caller's `sources` patterns instead), plus every entry's `@source` files, minus every entry's `@source not` files and the caller's `ignorePaths` (a build's output directory), extracted through source adapters, plus `@safelist`, minus `@blocklist`. `isStylesheetSourceFile` answers the same rule per path for dev watchers. It is the only source of generated classes: classes a caller ran through the scanner never join it. `resolveStylesheetSourcePaths` and `mergeStylesheetSourceOptions` predate this rule and no longer decide output. All entries share one generated CSS, so every entry's directives apply to the one class set. Entries keep their native CSS as written; the class set decides generated rules only. A pattern without glob characters that names a directory covers everything under it.
- **CSS output** hot spots: generated CSS ordering, emittedGlobals counts, and local `@compose` / `@reference` lowering.
- **Vue scoped styles** (`src/vue-scoped-style.ts`, request parsing in `src/style-request.ts`): Vue's scoped compiler runs after `transformLocalStyleCSS`, binds every selector to the component and renames the block's `@keyframes` to `<name>-<id>`, rewriting only `animation` declarations. For a `?vue&type=style&scoped` request the generated rule selectors (referenced theme variables) are wrapped in `:global()`, and generated keyframes are emitted as `<name>-<id>` (which Vue leaves alone) with the generated variables and native `animation` declarations that name them renamed to match (#189). Two scoped blocks that emit the same variable each set it on `:root` with their own keyframe name; the last loaded wins, and the keyframes it names ship in that same stylesheet. Svelte and Astro scope a component style before Vite's transforms reach it, so they need neither.
- **Sass entries**: directives of `.scss` and `.sass` entries are read from the project's `sass` output, since Sass passes unknown at-rules through.
- **Entry detection and import graph**: the dependencies they collect become the integrations' reset watch lists.

## Validation

- `tests/fixtures/manifest-examples/<name>/` holds documented manifest examples: an optional `manifest.css`, a `template.html`, and the `generated.css` that `renderCompiledManifestCSS` must produce for its classes (`tests/manifest-examples.test.ts`). Add a fixture for a new documented output case; any diff in a `generated.css` is a CSS output change.
