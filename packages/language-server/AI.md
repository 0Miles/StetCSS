# @stet-css/language-server

Wraps `@stet-css/language-service` in **LSP**: server lifecycle, one language service per workspace (built from that workspace's manifest and installed StetCSS runtime, falling back to the bundled one), closest-workspace routing, restarts, the completion, hover, color, formatting, and semantic token handlers, and manifest-loading and CSS directive diagnostics.

## Boundaries

- Workspace discovery behind `workspaces: 'auto'`, manifest entry files, manifest loading, and workspace package resolution → `@stet-css/project`.
- Feature behaviour → `@stet-css/language-service`; class scanning and semantic token primitives → `@stet-css/language`.
- CSS directive highlighting is TextMate-first, from the grammar in `@stet-css/language`.

## Risks

- **Workspace routing**: each document goes to the deepest workspace that contains it, and external documents go to the global workspace; keep monorepo packages on their own workspace.
- **Manifest source**: each workspace loads its manifest from its own directory through `@stet-css/project`.
- **File watching** (#248): while a workspace has an open document, the server polls its manifest files every 500 ms by stamp (inode, times, size): the entries, every file they import (package CSS in node_modules included), and the workspace preset's `default-manifest.json`. Each file is stamped before it is read: the load passes `onDependency` (from `@stet-css/project`), which also names the missing import and the `@reference` targets of a load that fails, so the fix reloads too. A watched file that goes missing stays watched until it returns. Once a check finds nothing new after a change, the server rebuilds that workspace's language service once and republishes its diagnostics. Closing the last document stops the polling. The workspace runtime's JavaScript stays as first imported; only a restart reloads it.
- **Restarts**: saving a `.css` file (manifest entries are CSS) or changing `stetCSS` settings sends `stetCSS/restart` to the client and refreshes semantic tokens; keep both triggers.
- **Build parity**: every runtime the server builds (workspace or bundled) takes its native declaration matcher and rule generator from `@stet-css/validator`, so hover and semantic tokens show what the build emits: nothing for a class the build drops, and a group without its invalid declarations. Keep both runtimes on the same pair.
- **Capabilities**: advertise only handlers that are implemented and tested. `onInitialize` drops semantic tokens unless `embeddedSyntaxHighlighting` is `'always'`, and formatting unless `formatDirectives` is on.

## Validation

Workspace and manifest changes extend `tests/monorepo.test.ts`, `tests/custom-workspace.test.ts`, or `tests/manifest.test.ts`, with a fixture under `tests/fixtures/`. File watching changes extend `tests/file-watch.test.ts`, which writes its projects to a temporary directory.
