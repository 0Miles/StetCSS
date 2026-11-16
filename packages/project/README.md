# @stet-css/project

Utilities for loading and serializing StetCSS manifest CSS resources.

## Installation

```bash
npm install @stet-css/project
```

`@stet-css/project` is the shared project manifest boundary for CLI commands, ESLint, language tooling, and build integrations such as Vite, Next.js, Webpack, and Nuxt.

It discovers project CSS entries and StetCSS workspace roots, then delegates CSS parsing, import graph resolution, and manifest compilation to `@stet-css/compiler`. JavaScript and TypeScript config files are intentionally unsupported.

Project entry discovery only treats CSS files with a top-level `@import '@stet-css/core'` as entries. Imported `@settings`, `@theme`, and `@custom-variant` directives participate in the entry graph, but they are not independent project entries.

## Load project manifest

Use `loadProjectManifest()` when a tool should load the canonical project-level manifest for a directory.

```ts
import { loadProjectManifest, loadProjectManifestJSON } from '@stet-css/project/manifest'

const result = await loadProjectManifest('/project')
const jsonResult = await loadProjectManifestJSON('/project')
```

`loadProjectManifest()` discovers project CSS entries unless explicit `entries` are passed. It returns the compiled manifest and dependency list. `loadProjectManifestJSON()` returns JSON source for virtual JSON modules and loader output.

```ts
import { loadProjectManifestSync, loadProjectManifestJSONSync } from '@stet-css/project/manifest-sync'

const result = loadProjectManifestSync('/project')
const jsonResult = loadProjectManifestJSONSync('/project')
```

## Load explicit CSS resources

Use `loadManifest()` when the CSS resource path is already known and should be compiled directly.

```ts
import { loadManifest, loadManifestJSON } from '@stet-css/project/manifest'

const result = await loadManifest('/project/src/index.css')
const jsonResult = await loadManifestJSON('/project/src/index.css')
```

`loadManifest()` and `loadManifestJSON()` only accept CSS resources. They do not search the workspace and do not load JavaScript or TypeScript config files.

```ts
import { loadManifestSync, loadManifestJSONSync } from '@stet-css/project/manifest-sync'

const result = loadManifestSync('/project/src/index.css')
const jsonResult = loadManifestJSONSync('/project/src/index.css')
```

## Discover entries and workspaces

Use `@stet-css/project/entries` when tooling needs the same project entry and workspace discovery rules without loading a manifest.

```ts
import {
  findCSSManifestEntryFiles,
  findStetCSSWorkspaceDirectories,
  hasStetCSSManifestEntrypoint,
} from '@stet-css/project/entries'
```

`findCSSManifestEntryFiles(projectDir, { extensions })` searches CSS files for entry markers; pass `extensions: STYLE_ENTRY_EXTENSIONS` to include `.scss` and `.sass` stylesheet entries. `findStetCSSWorkspaceDirectories(rootDir)` creates workspace roots from discovered CSS entries and `package.json` files that declare StetCSS package dependencies.

## Discover project source files

Use `@stet-css/project/sources` for the project's own source files, the base of the static class set.

```ts
import {
  findProjectSourceFiles,
  isProjectSourceFile,
} from '@stet-css/project/sources'
```

`findProjectSourceFiles(projectDir)` lists files with a source extension (`PROJECT_SOURCE_EXTENSIONS`) outside the ignored directories (`PROJECT_IGNORED_DIRECTORIES`: dependencies such as `node_modules` and `vendor`, version control, build output and tool caches, matched by name at any depth), skipping `*.d.ts`, `*.test.*` and `README.md` files. Symlinked files and directories are followed, except a link back to a directory it is already inside. `isProjectSourceFile(file, projectDir)` answers the same rule for one path. Entry and workspace discovery skip the same directories. `.gitignore` is not read.

## Manifest modules

The module utilities define the manifest import contract used by official integrations. They live in `@stet-css/integration`; `@stet-css/project` owns loading and discovery.

| API | Purpose |
| --- | --- |
| `VIRTUAL_MANIFEST_ID` | Default manifest JS facade module id, `virtual:stet-css-manifest`. |
| `VIRTUAL_EMITTED_GLOBALS_ID` | Default emittedGlobals module id, `virtual:stet-css-emitted-globals`. |
| `STET_CSS_MANIFEST_QUERY` | Query suffix, `?stet-css-manifest`, used to compile one explicit CSS resource. |
| `toManifestJSON(manifest)` | Serializes a manifest object into normalized JSON source. |
| `toEmittedGlobalsModule(emittedGlobals)` | Serializes emittedGlobals variable and animation counts into an ESM default export. |
| `toVirtualDefaultManifestModulePath(context)` | Creates the virtual path for the default manifest module. |
| `toVirtualCSSManifestModulePath(context, file)` | Creates a virtual path for one explicit queried CSS resource. |

Use `virtual:stet-css-manifest` and `virtual:stet-css-emitted-globals` when application code should receive an integration's canonical project-level runtime inputs. Use `./index.css?stet-css-manifest` only when the code intentionally compiles one explicit CSS resource through the active integration.
