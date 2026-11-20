# @stet-css/eslint-plugin

Adapts `@stet-css/lint` to **ESLint**: rule definitions under the `@stet-css` namespace, the `base`, `recommended`, `stylesheet`, and `legacy` configs, AST visitors that locate class lists across supported syntaxes, a stylesheet parser for CSS, SCSS, and Less, settings resolution, and a per-workspace manifest cache.

## Boundaries

- Class lint policy and class-list replacement text → `@stet-css/lint`; class-list token and range parsing → `@stet-css/lexer`. This package orchestrates AST visits, reports, and fixers around them.
- Workspace and manifest discovery → `@stet-css/project`.

## Risks

- **AST shapes** differ across React, Vue, Svelte, Angular, MDX, and template syntaxes. Treat only string literals as classes, recursing through class-bearing expressions to reach them and never into arbitrary expressions.
- **Ranges**: map raw rather than cooked string offsets, and keep user whitespace and quotes intact in every autofix, including removal of conflicting classes. `resolve-class-node` decodes each list the way its host does (JavaScript escapes, JSX or HTML character references, or HTML references then escapes inside a Vue `:class` binding; other Vue template expressions, which the build reads as written, are not decoded) through `@stet-css/lexer`, and a list is fixable only when that decode equals the parser's value; otherwise it is reported over its whole range without a fix.
- **Manifest cache**: each file loads its workspace's manifest through `loadProjectManifestSync(dir, { cache: true })` and keys the derived CSS on the returned result, so files in unrelated workspaces never share a manifest and an edit to a CSS entry or a file it imports reaches the next lint without a restart (#199). All rules on one file share one resolution (keyed on `context.sourceCode`), which bounds recompiles to one per file in the seconds after an edit when the project cache keeps nothing. Entry discovery walks the whole workspace, so each workspace's entry files are remembered for `ENTRY_DISCOVERY_TTL_MS` (5 s) and passed as `entries`: a CSS entry added during the session reaches the lint after at most that long, and a remembered entry that was deleted triggers rediscovery on the failed load. The project cache keeps at most 16 results per base manifest (least recently used first out), so linting across more than 16 workspaces in one process recompiles (about 90 ms) on each switch back to an evicted one. Workspace directories are still discovered once per `cwd`. A file on disk gets its workspace's CSS entry manifest; text without a file on disk gets the default preset and stays out of that cache, so it cannot pin a workspace to the default. A `manifest` setting is rejected rather than ignored.
- **Public contract**: rule IDs (`@stet-css/sort-classes` and the rest in `src/plugin.ts`), the recommended config, and rule defaults are what user configs depend on; change them only as an intended public change.
- **Adapter drift**: rule behaviour follows the `@stet-css/lint` helpers; fix policy there rather than in a rule.

## Validation

Visitor and autofix fixes need input/output cases in the matching `tests/<rule>.test.ts` or `tests/<framework>.test.ts`. Regressions from a reported issue go in `tests/issues/<n>.test.ts` with fixtures under `tests/fixtures/issues/<n>/`.
