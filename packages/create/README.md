# @stet-css/create

Add Master CSS to an existing project.

## Usage

```bash
npm create @stet-css@rc -- --yes
```

or run the package directly:

```bash
npx @stet-css/create@rc add --yes
```

The recommended workflow adds Master CSS to the detected framework and includes the development guardrails Master CSS expects by default:

- `@stet-css/eslint-config` and `eslint.config.js`
- `@stet-css/mcp` with the stdio registration command in the summary
- Master CSS guidance in `AGENTS.md`

With `--yes`, recommended defaults are accepted and dependency installation runs with the detected package manager unless `--no-install` is passed.

Without `--yes`, TTY sessions ask about ESLint, MCP, AI guidance, and dependency installation. Each prompt defaults to yes. Non-TTY sessions apply recommended defaults without installing dependencies unless `--install <package-manager>` is passed.

Use `--minimal` for core framework setup only, or disable individual recommended integrations with `--no-eslint`, `--no-mcp`, or `--no-ai`.

Use `--mode <mode>` when the framework integration should be configured for a specific rendering mode during setup:

```bash
npm create @stet-css@rc -- --framework nextjs --mode static --yes
```

Supported `--mode` values are `runtime`, `static`, `progressive`, and `pre-render`. Mode setup is supported for `vite`, `react`, `react-router`, `tanstack-start`, `vue`, `nextjs`, `nuxt`, `astro`, `webpack`, `rspack`, `rsbuild`, `laravel`, and `lit`; Laravel supports `static` only.

If you do not have a project yet, create one first:

```bash
npm create vite@latest my-app
cd my-app
npm create @stet-css@rc -- --yes
```

## Examples

```bash
npx @stet-css/create@rc add --yes
```

```bash
npx @stet-css/create@rc add --minimal
```

```bash
npx @stet-css/create@rc add --no-mcp --no-ai
```

```bash
npx @stet-css/create@rc add --json --minimal --eslint
```

```bash
npx @stet-css/create@rc add --framework nextjs --mode runtime --yes
```

```bash
npx @stet-css/create@rc add --framework webpack --mode static --yes
```

Supported `--framework` values:

```txt
auto, vite, react, react-router, tanstack-start, vue, nextjs, svelte, nuxt, astro, webpack, rspack, rsbuild, laravel, lit, angular, none
```

SvelteKit setup is delegated to the Svelte CLI add-on:

```bash
npx sv add @stet-css/sv
```
