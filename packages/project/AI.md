# @stet-css/project

Resolves a project's manifest: discovers **entry** CSS files, finds workspace roots and packages, and loads manifests by delegating to `@stet-css/compiler`, reporting dependency paths for watch and HMR.

## Boundaries

- Entry discovery belongs here alone: scanner, ESLint, the language server, and individual integrations rely on this package instead of discovering entries themselves.
- Which files are the project's own sources (`./sources`: source extensions and ignored directories) belongs here too; entry discovery skips the same directories. `@stet-css/stylesheet` builds the static class set on top of it.
- CSS import graphs and directive parsing: `@stet-css/compiler`.
- Virtual module ids and `?master-css-manifest` request helpers: `@stet-css/integration`.

## Risks

- **Ignored directories** (`PROJECT_IGNORED_DIRECTORIES`) decide both which CSS files can be entries and which files feed static CSS; adding or removing one changes CSS output.
- **Entry markers**: discovery checks only top-level `@master entry;` and `@import "@stet-css/core"`; imported files and package CSS files are never independent entries.
- **Dependencies** come from compiler results, never from hardcoded package CSS filenames.
- **CSS only**: manifests load from `.css` files; JavaScript/TypeScript manifest loading is intentionally unsupported.
- **Load results**: `loadManifest()` and `loadProjectManifest()` return the compile result (`manifest` plus `dependencies`); read `.manifest` when that is all a call site needs.
- **Manifest loading** feeds the CLI, ESLint, language server, VS Code, diagnostics, and the Vite, Webpack, Next, and Nuxt integrations, so a behaviour change here crosses packages.
