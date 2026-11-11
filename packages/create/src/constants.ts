export const MASTER_CSS_VERSION = 'rc'

export const MASTER_CSS_PACKAGES = {
  css: '@stet-css/core',
  runtime: '@stet-css/runtime',
  preset: '@stet-css/preset',
  cli: '@stet-css/cli',
  vite: '@stet-css/vite',
  next: '@stet-css/next',
  nuxt: '@stet-css/nuxt',
  astro: '@stet-css/astro',
  svelte: '@stet-css/svelte',
  svelteAddon: '@stet-css/sv',
  webpack: '@stet-css/webpack',
  eslintConfig: '@stet-css/eslint-config',
  mcp: '@stet-css/mcp'
} as const

export const CANONICAL_ESLINT_CONFIG = `import { defineConfig } from 'eslint/config'
import css from '@stet-css/eslint-config'

export default defineConfig([
  ...css
])
`

export const AGENT_RULES_BLOCK = `## Master CSS

- Use https://rc.css.master.co as the source of truth.
- Inspect the framework, package manager, CSS entry, rendering mode, theme tokens, component classes, utilities, custom variants, and validation commands before editing styles.
- Prefer existing @theme tokens, @components, @utilities, and @custom-variant definitions.
- Use the Master CSS MCP server when available.
- Use ESLint for class policy diagnostics and the Master CSS Language Service for completion, hover, colors, highlighting, and directive formatting.
- Do not invent Master CSS APIs, directives, package names, or Tailwind-style syntax.
- Preserve semantic HTML, accessibility attributes, and behavior.
`
