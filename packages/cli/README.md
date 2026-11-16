# @stet-css/cli

StetCSS CLI.

## Installation

```bash
npm install -D @stet-css/cli
```

Run the package binary directly with `npx @stet-css/cli`. The package does not expose alias binaries such as `mcss`.

## Commands

### `npx @stet-css/cli [source paths]`

Scan source files, detect StetCSS classes, generate CSS rules, and write the generated CSS file.

```bash
npx @stet-css/cli index.html main.js
```

When no source paths are passed, the CLI reads the project's own source files: files under the current directory with a source extension (`.html`, `.js`, `.ts`, `.tsx`, `.vue`, `.svelte`, `.astro`, `.md`, and similar), outside dependency (`node_modules`, `vendor`), version control, build output (`build`, `dist`, `out`, `.next`, `.nuxt`, `.output`, `.svelte-kit`, `.astro`, ...) and cache directories at any depth, and excluding `*.d.ts`, `*.test.*` and `README.md` files. Symlinked files and directories are followed. A CSS entry's `@source` adds files, including files in those directories, and `@source not` removes them; a path without glob characters that names a directory covers everything under it. Source path arguments replace the project's own source files; `@source` and `@source not` still apply.

```bash
npx @stet-css/cli
```

Options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `-o, --output <path>` | `string` | `stet.css` | Generated CSS output path. |
| `-v, --verbose <level>` | `number` | `1` | Logging level: `0` is silent, `1` reports the written file and watched config changes, `2` also lists each file read. With `--no-export` the log goes to stderr, so stdout is only CSS. |
| `-w, --watch` | `boolean` | `false` | Watch files and rebuild continuously. |

### `npx @stet-css/cli lint [source paths]`

Run machine-readable StetCSS diagnostics for agents, MCP servers, editor tools, and native CI checks. JavaScript and VS Code projects should still use ESLint as the main human lint workflow; this command is a native preflight surface that shares the same class policy engine.

```bash
npx @stet-css/cli lint index.html main.js
```

Use JSON output for tools:

```bash
cat src/App.tsx | npx @stet-css/cli lint --exit-code never --stdin --stdin-filepath src/App.tsx
```

Options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--stdin` | `boolean` | `false` | Read one source buffer from stdin. |
| `--stdin-filepath <path>` | `string` | `stdin.html` | File path used to infer the stdin language. |
| `--fix` | `boolean` | `false` | Apply safe class-list fixes to files. |
| `--fix-dry-run` | `boolean` | `false` | Return fix proposals without writing files. |
| `--fix-directives` | `boolean` | `false` | Allow structural directive fixes when `--fix` writes files. |
| `--format <format>` | `json` or `stylish` | `json` | Print machine-readable diagnostics or human-readable output. |
| `--rules <rules>` | comma list | recommended | Select lint rules, `recommended`, or `all`. |
| `--exit-code <mode>` | `diagnostics` or `never` | `diagnostics` | Control whether diagnostics set a non-zero exit code. |
| `--max-warnings <number>` | `number` | none | Exit with a non-zero status when warnings exceed this count. |

The JSON report uses `version: 1`. Tooling can rely on the top-level `version`, `cwd`, `manifest`, `files`, and `summary` fields. Diagnostic `data` objects may gain additional fields as StetCSS reports become more precise.

### `npx @stet-css/cli inspect [source paths]`

Inspect scanner state, managed stylesheet entries, generated CSS size, and explicit missing CSS checks. This command is for MCP servers, AI agents, build diagnostics, and support tooling that need machine-readable extraction state, not class policy linting.

```bash
npx @stet-css/cli inspect --classes "btn card" --format json --exit-code never
```

Use `--classes` to ask whether specific class names are present in the generated CSS path. The report explains each checked class as `generated`, `native-css` (an entry's native CSS has a rule for it), `safelist`, `invalid`, `blocklisted`, or `not-detected`.

The JSON report includes:

| Field | Description |
| --- | --- |
| `inputs` | Source patterns, resolved files, and explicit classes checked by this run. |
| `scanner` | Global scanner class sets, counts, safelist/blocklist counts, and reset dependencies. |
| `stylesheets` | Managed CSS entries, dependency metadata, warnings, and entry loading errors. |
| `css` | Generated CSS byte size, emitted global counts, and optional CSS text. |
| `missingCSS` | Present and missing results for `--classes`. |
| `files` | Per-file scanner discoveries for latent, valid, and invalid classes. |
| `diagnostics` | Machine-readable `scanner`, `stylesheet`, and `missing-css` diagnostics. |
| `summary` | File, stylesheet, diagnostic, error, warning, missing CSS, and invalid class totals. |

The JSON report uses `version: 1`. Tooling can rely on the top-level `version`, `cwd`, `inputs`, `scanner`, `stylesheets`, `css`, `missingCSS`, `files`, `diagnostics`, and `summary` fields. Nested diagnostic `data` and stylesheet details may evolve unless documented for a specific diagnostic code.

Options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--classes <classes>` | whitespace list | none | Class names to verify against scanner state and generated CSS. |
| `--include-css` | `boolean` | `false` | Include generated CSS text in the JSON report. |
| `--format <format>` | `json` or `stylish` | `json` | Print machine-readable diagnostics or human-readable output. |
| `--exit-code <mode>` | `diagnostics` or `never` | `diagnostics` | Control whether diagnostics set a non-zero exit code. |
| `--max-warnings <number>` | `number` | none | Exit with a non-zero status when warnings exceed this count. |

## Related docs

- [Scanner package](../scanner)
