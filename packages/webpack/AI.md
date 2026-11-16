# @stet-css/webpack

Owns the Webpack plugin. It only builds static CSS: before each compilation it generates the CSS from the project's class set (`@stet-css/stylesheet`) and the discovered stylesheet entries, writes it to the generated CSS **virtual module** (`webpack-virtual-modules`), runs the style CSS loader that points entries at that module, and serves the manifest and emittedGlobals virtual modules.

## Boundaries

- Which classes static CSS contains is the stylesheet class set's rule; this package never scans compiled modules, and renders with the project manifest its manifest module last loaded. Entries come from `@stet-css/project` entry discovery with `STYLE_ENTRY_EXTENSIONS` (`.css`, `.scss`, `.sass`), plus entries the style loader reports (`src/utils/hosts.ts`), such as ones outside the project root.
- Manifest discovery and loading live in `@stet-css/project`.
- No runtime injection: no runtime entry, no HTML asset rewriting, no `mode` or `injectRuntime` option.

## Risks

- **Generation before the compilation**: `beforeRun` and `watchRun` (`src/plugins/scanner-lifecycle.ts`) write the CSS before webpack builds the virtual module, so `style-loader` bundles and extracted CSS assets both carry it. CSS generated later would miss the module. While watching, only changed paths in the last generation's dependencies, or source files by `isStylesheetSourceFile`, regenerate it.
- **Watched files**: `src/plugins/static-css-dependencies.ts` adds the class set's source files and the entries' import graphs to each compilation, so editing a file no module imports rebuilds. A new file only joins after the next rebuild. The compiler's output directory inside the project root goes to the class set's `ignorePaths`, so emitted bundles never feed classes back or trigger a rebuild loop.
- **Virtual modules**: paths come from `@stet-css/integration/node` (under `node_modules/.master-css`); keep id behaviour stable. Once the virtual file is written, the disk file is only a seed dated in the past: a fresh disk write while watching would look newer than the compilation start and rebuild once more. Without `webpack-virtual-modules` support (Rspack), the disk file carries the content.
- **Late entries**: an entry the style loader reports after the generated CSS module was built gets that module rebuilt in `finishModules` (`src/plugins/static-css-dependencies.ts`); generations are serialized through `MasterCSSPlugin.generation`.
- **Cross-integration parity**: audit static-output and cascade-layer changes against Vite, Next, Nuxt and Astro so integration behaviour does not drift.

## Validation

Build `examples/webpack` when plugin behaviour changes. `tests/static-e2e.test.ts` builds it with `style-loader`, builds native CSS (extracted) fixtures, including a Sass entry and an entry outside the root, and runs watch mode with real webpack against `dist`.
