# StetCSS

StetCSS is a fork of [Master CSS](https://github.com/master-co/css), branched from `v2.0.0-rc.88`: a markup-driven CSS engine where classes such as `fg:red:hover@sm` compile to CSS rules. It follows three principles:

- **Stable syntax**: the class syntax does not change without a clear reason, so markup written today keeps working.
- **Simplicity**: a smaller surface, with fewer features, options and moving parts to learn and maintain.
- **Static first**: CSS is generated ahead of time by default, and the browser runtime is the exception, not the starting point.

> [!NOTE]
> Packages are published to npm under the `@stet-css` scope (the main entry is `@stet-css/core`), still at `0.x`. Each package is versioned and released on its own. The VS Code extension is not on the Marketplace or Open VSX yet; [`packages/vscode`](packages/vscode/README.md) explains how to build and install a VSIX.

## Getting started

Install the build integration for your framework, for example Vite:

```bash
npm install @stet-css/core
npm install -D @stet-css/vite
```

```js
// vite.config.js
import { defineConfig } from 'vite'
import stetCSS from '@stet-css/vite'

export default defineConfig({
  plugins: [stetCSS()]
})
```

Import `@stet-css/core` from the CSS entry your app already loads:

```css
@import '@stet-css/core';
```

The build scans your source files and writes the rules for the classes it finds into that stylesheet. Each integration's README covers its setup, and [`examples/`](examples) has a working project for each framework.

## Packages

### Build integrations

| Package | Use it for |
| --- | --- |
| [`@stet-css/vite`](packages/vite) | Vite |
| [`@stet-css/webpack`](packages/webpack) | webpack |
| [`@stet-css/next`](packages/next) | Next.js |
| [`@stet-css/nuxt`](packages/nuxt) | Nuxt |
| [`@stet-css/svelte`](packages/svelte) | Svelte and SvelteKit |
| [`@stet-css/astro`](packages/astro) | Astro |
| [`@stet-css/cli`](packages/cli) | Any project: the `stet-css` command scans sources and writes the CSS file |
| [`@stet-css/runtime`](packages/runtime) | Generating CSS in the browser: a CDN script for pages with no build step, or classes the build cannot see |

### Editor and lint tooling

| Package | Role |
| --- | --- |
| [`stet-css-vscode`](packages/vscode) | VS Code extension (not published yet) |
| [`@stet-css/language-server`](packages/language-server) | Language server the extension runs |
| [`@stet-css/language-service`](packages/language-service) | Completion, hover, colors and diagnostics behind the language server |
| [`@stet-css/language`](packages/language) | Language primitives |
| [`@stet-css/eslint-plugin`](packages/eslint-plugin) | ESLint rules such as `sort-classes` and `no-conflicting-classes` |
| [`@stet-css/eslint-config`](packages/eslint-config) | Shared ESLint configuration |
| [`@stet-css/lint`](packages/lint) | Framework-neutral lint policy helpers |
| [`@stet-css/validator`](packages/validator) | Validation of generated classes and rules |
| [`@stet-css/diagnostics`](packages/diagnostics) | Project inspection diagnostics |

### Core packages

| Package | Role |
| --- | --- |
| [`@stet-css/core`](packages/core) | Public facade over engine and preset |
| [`@stet-css/schema`](packages/schema) | Schema and wire-format contracts |
| [`@stet-css/lexer`](packages/lexer) | Dependency-free lexical scanners |
| [`@stet-css/source`](packages/source) | Class candidate extraction from source |
| [`@stet-css/engine`](packages/engine) | Manifest-driven engine |
| [`@stet-css/preset`](packages/preset) | Default preset and compiled manifest |
| [`@stet-css/integration`](packages/integration) | Integration contracts, virtual module protocols and build helpers |
| [`@stet-css/compiler`](packages/compiler) | Stylesheet directive compiler |
| [`@stet-css/project`](packages/project) | Project entry discovery and manifest loading |
| [`@stet-css/stylesheet`](packages/stylesheet) | Stylesheet entry pipeline for static rendering |
| [`@stet-css/scanner`](packages/scanner) | Source scanner for static rendering |

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/` | Every package listed above |
| `examples/` | Framework examples (Vite, React, Next.js, Nuxt, Svelte, Astro, Angular, Lit, Laravel, webpack, CDN, ESLint, and more) |
| `benchmarks/` | Build, runtime and CSS output benchmarks |
| `shared/` | Shared Vitest, ESLint and tsdown configuration |
| `scripts/` | TypeScript tooling compatibility wrapper, release, naming and package-content checks, and the publish script |
| `docs/` | Maintainer and agent workflow docs (`docs/agents/`) and ADRs (`docs/adr/`) |

## Development

Requirements: Node.js 24 (`.nvmrc`) and Bun 1.4.4 (`packageManager` in `package.json`). Bun installs dependencies and runs scripts; the tools they call run on Node.

```bash
bun install --frozen-lockfile
bun run build
```

| Command | What it runs |
| --- | --- |
| `bun run build` | Builds every package under `packages/` |
| `bun run test` | Unit tests for every package |
| `bun run lint` | ESLint for every package |
| `bun run type-check` | Type checking for every package |
| `bun run check` | Root script tests (`node --test`), then `test`, `lint` and `type-check` together |
| `bun run check:release` | Release-please config and manifest list every published package at its `package.json` version |
| `bun run check:release-tags` | Every package has its tag and GitHub release for the current version (reads GitHub through `gh`) |
| `bun run check:naming` | No upstream product name left in file names or contents |
| `bun run check:packages` | Builds, packs every published package, and checks the tarball contents |
| `bun run e2e` | Playwright end-to-end tests |
| `bun run build:examples` | Builds every example |

To work on a single package, filter by name, for example `bun run --filter @stet-css/engine test`. The full pre-PR checklist, branch naming and CI notes are in [`docs/agents/dev-workflow.md`](docs/agents/dev-workflow.md).

## License

[MIT](LICENSE). Includes code from Master CSS, © Aoyue Design LLC.
