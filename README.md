# StetCSS

StetCSS is a fork of [Master CSS](https://github.com/master-co/css), branched from `v2.0.0-rc.88`. It follows three principles:

- **Stable syntax**: the class syntax does not change without a clear reason, so markup written today keeps working.
- **Simplicity**: a smaller surface, with fewer features, options and moving parts to learn and maintain.
- **Static first**: CSS is generated ahead of time by default, and the browser runtime is the exception, not the starting point.

> [!NOTE]
> Packages live under the `@stet-css` scope (the main entry is `@stet-css/core`). Nothing has been published to npm yet.

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/` | Engine, preset, compiler, runtime, build integrations, language tooling, ESLint plugin and VS Code extension |
| `examples/` | Framework examples (Vite, Next.js, Nuxt, Svelte, Astro, Angular, Laravel, and more) |
| `benchmarks/` | Build, runtime and CSS output benchmarks |
| `shared/` | Shared Vitest, ESLint and tsdown configuration |
| `scripts/` | TypeScript tooling compatibility wrappers used by the root scripts |

### Core packages

| Package | Directory | Role |
| --- | --- | --- |
| `@stet-css/schema` | `packages/schema` | Schema and wire-format contracts |
| `@stet-css/lexer` | `packages/lexer` | Dependency-free lexical scanners |
| `@stet-css/source` | `packages/source` | Class candidate extraction from source |
| `@stet-css/engine` | `packages/engine` | Manifest-driven engine |
| `@stet-css/preset` | `packages/preset` | Default preset and compiled manifest |
| `@stet-css/compiler` | `packages/compiler` | Stylesheet directive compiler |
| `@stet-css/stylesheet` | `packages/stylesheet` | Stylesheet entry pipeline for static rendering |
| `@stet-css/scanner` | `packages/scanner` | Source scanner for static rendering |
| `@stet-css/server` | `packages/server` | Server-side HTML renderer |
| `@stet-css/runtime` | `packages/runtime` | Browser runtime |
| `@stet-css/core` | `packages/core` | Public facade over engine and preset |

Build integrations live in `packages/vite`, `webpack`, `next`, `nuxt`, `svelte`, `astro` and `cli`. Editor and lint tooling lives in `packages/language*`, `eslint-*`, `lint`, `validator`, `diagnostics`, `mcp` and `vscode`.

## Development

Requirements: Node.js 24 and pnpm 11.9 (pinned in `package.json`; `corepack enable` picks it up).

```bash
pnpm install
pnpm build
```

| Command | What it runs |
| --- | --- |
| `pnpm build` | Builds every package under `packages/` |
| `pnpm test` | Unit tests for every package |
| `pnpm lint` | ESLint for every package |
| `pnpm type-check` | Type checking for every package |
| `pnpm check` | `test`, `lint` and `type-check` together |
| `pnpm e2e` | Playwright end-to-end tests |
| `pnpm build:examples` | Builds every example |

To work on a single package, filter by name, for example `pnpm --filter @stet-css/engine test`.

## License

[MIT](LICENSE). Includes code from Master CSS, © Aoyue Design LLC.
