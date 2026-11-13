# @stet-css/eslint-plugin

Adapts `@stet-css/lint` to **ESLint**: rule definitions under the `@stet-css` namespace, the `base`, `recommended`, `stylesheet`, and `legacy` configs, AST visitors that locate class lists across supported syntaxes, a stylesheet parser for CSS, SCSS, and Less, settings resolution, and a per-workspace manifest cache.

## Boundaries

- Class lint policy and class-list replacement text → `@stet-css/lint`; class-list token and range parsing → `@stet-css/lexer`. This package orchestrates AST visits, reports, and fixers around them.
- Workspace and manifest discovery → `@stet-css/project`.

## Risks

- **AST shapes** differ across React, Vue, Svelte, Angular, MDX, and template syntaxes. Treat only string literals as classes, recursing through class-bearing expressions to reach them and never into arbitrary expressions.
- **Ranges**: map raw rather than cooked string offsets, and keep user whitespace and quotes intact in every autofix, including removal of conflicting classes.
- **Manifest cache** is keyed by workspace directory, so files in unrelated workspaces never share a manifest. The manifest comes only from the workspace's CSS entry; a `manifest` setting is rejected rather than ignored.
- **Public contract**: rule IDs (`@stet-css/sort-classes` and the rest in `src/plugin.ts`), the recommended config, and rule defaults are what user configs depend on; change them only as an intended public change.
- **Adapter drift**: rule behaviour follows the `@stet-css/lint` helpers; fix policy there rather than in a rule.

## Validation

Visitor and autofix fixes need input/output cases in the matching `tests/<rule>.test.ts` or `tests/<framework>.test.ts`. Regressions from a reported issue go in `tests/issues/<n>.test.ts` with fixtures under `tests/fixtures/issues/<n>/`.
