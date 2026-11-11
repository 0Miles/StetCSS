# AI Notes For `@stet-css/language-server`

## Responsibility

`@stet-css/language-server` wraps the language service in LSP.

## Owns

- LSP server lifecycle.
- Workspace folder initialization and closest-workspace selection.
- Manifest entry loading and restart behavior.
- Completion, hover, document color, color presentation, and semantic token request handlers.

## Does Not Own

- Editor-neutral class scanning or semantic token primitives; use `@stet-css/language`.
- Stateful feature implementation; use `@stet-css/language-service`.
- VS Code extension activation or packaging.
- CSS directive lexical highlighting, which is TextMate-first.

## Public Surface

- `CSSLanguageServer`
- `settings`
- `Workspace` type

## Key Files

- `src/core.ts`
- `src/settings.ts`
- `src/utils/create-document.ts`
- `tests/fixtures/**`

## Risk Areas

- `workspaces: 'auto'` discovery from manifest entry files and package dependencies.
- Closest workspace selection for monorepos.
- Manifest loading through `@stet-css/project`.
- Restart behavior after manifest or settings saves.
- Advertising LSP capabilities that are not implemented and tested.

## Safe Changes

- Workspace detection fixes with monorepo fixtures.
- Manifest reload/restart fixes.
- Request handler and semantic token mode fixes with tests.

## Dangerous Changes

- Treating external documents as belonging to the wrong workspace.
- Loading a manifest from an unintended directory.
- Adding diagnostics without client/server capability updates.
- Depending on editor-specific extension code.

## Validation

```sh
pnpm --filter @stet-css/language-server test
pnpm --filter @stet-css/language-server lint
pnpm --filter @stet-css/language-server type-check
pnpm --filter @stet-css/language-server build
```

Use or extend `tests/custom-workspace.test.ts`, `tests/monorepo.test.ts`, and `tests/fixtures`.
