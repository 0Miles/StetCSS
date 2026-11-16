# @stet-css/language-server

Wraps `@stet-css/language-service` in **LSP**: server lifecycle, one language service per workspace (built from that workspace's manifest and installed StetCSS runtime, falling back to the bundled one), closest-workspace routing, restarts, the completion, hover, color, formatting, and semantic token handlers, and manifest-loading and CSS directive diagnostics.

## Boundaries

- Workspace discovery behind `workspaces: 'auto'`, manifest entry files, manifest loading, and workspace package resolution → `@stet-css/project`.
- Feature behaviour → `@stet-css/language-service`; class scanning and semantic token primitives → `@stet-css/language`.
- CSS directive highlighting is TextMate-first, from the grammar in `@stet-css/language`.

## Risks

- **Workspace routing**: each document goes to the deepest workspace that contains it, and external documents go to the global workspace; keep monorepo packages on their own workspace.
- **Manifest source**: each workspace loads its manifest from its own directory through `@stet-css/project`.
- **Restarts**: saving a `.css` file (manifest entries are CSS) or changing `stetCSS` settings sends `stetCSS/restart` to the client and refreshes semantic tokens; keep both triggers.
- **Build parity**: every runtime the server builds (workspace or bundled) takes its native declaration matcher and rule generator from `@stet-css/validator`, so hover and semantic tokens show what the build emits: nothing for a class the build drops, and a group without its invalid declarations. Keep both runtimes on the same pair.
- **Capabilities**: advertise only handlers that are implemented and tested. `onInitialize` drops semantic tokens unless `embeddedSyntaxHighlighting` is `'always'`, and formatting unless `formatDirectives` is on.

## Validation

Workspace and manifest changes extend `tests/monorepo.test.ts`, `tests/custom-workspace.test.ts`, or `tests/manifest.test.ts`, with a fixture under `tests/fixtures/`.
