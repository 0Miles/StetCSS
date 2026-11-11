# master-css-vscode

Owns the VS Code extension: activation, language server startup (`./server`), the restart command, active semantic token highlighting, and target-specific **VSIX** packaging.

## Boundaries

- Language features and setting defaults live in `@stet-css/language-server` (`src/settings.ts`).
- The TextMate grammar source lives in `@stet-css/language` (`syntaxes/master-css.tmLanguage.json`).

## Risks

- **Generated contributions**: the `generate` script (run by `build`) rewrites `package.json` `contributes` (configuration, grammars, semantic tokens, configuration defaults) and `files`, and copies css-tree data into `data/`. Edit `generate.ts` or the language-server settings, then regenerate.
- **Stable APIs**: contributions use stable VS Code APIs; `contributes.css` and CSS custom-data need proposed APIs, so `generate.ts` removes them.
- **Language scope**: the extension serves existing CSS-family and markup languages; add `.mcss` language ids, file associations or replacement CSS language modes only on explicit request.
- **Native externals**: OXC and Lightning CSS packages (and `.node` files) stay external in `tsdown.config.ts`. Target-specific VSIX builds stage them under `dist/node_modules`; a generic VSIX without them fails at startup because the server imports them.
- **Published identity**: publisher, package name, activation, exports and native externalization define the published extension; change them only as a stated change.

## Validation

- Packaging changes: `pnpm --filter master-css-vscode vscode:package -- --target darwin-arm64`. `tests/server-bundle.test.js` covers native externals and staged VSIX contents.
- Release flow: `RELEASE.md` (the `release` script).
