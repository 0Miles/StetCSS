import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const projectFiles: Record<string, string> = {
  'svelte.config.js': 'export default {}\n',
  // SvelteKit runs its client build from this file, so the plugins cannot be passed inline.
  'vite.config.js': [
    'import { sveltekit } from \'@sveltejs/kit/vite\'',
    `import masterCSS from ${JSON.stringify(join(packageDir, 'src/lib/vite.ts'))}`,
    '',
    'export default { plugins: [sveltekit(), masterCSS()] }'
  ].join('\n'),
  'src/app.html': [
    '<!doctype html>',
    '<html lang="en">',
    '<head>%sveltekit.head%</head>',
    '<body><div style="display: contents">%sveltekit.body%</div></body>',
    '</html>'
  ].join('\n'),
  'src/routes/styles.css': '@import \'@stet-css/core\';\n',
  'src/routes/+layout.svelte': [
    '<script>',
    '  import \'./styles.css\'',
    '  let { children } = $props()',
    '</script>',
    '',
    '{@render children()}'
  ].join('\n'),
  'src/routes/+page.svelte': '<h1 class="mx:auto max-w:50%">Hello</h1>\n'
}
const UTILITY_RULES = ['.mx\\:auto{margin-inline:auto}', '.max-w\\:50\\%{max-width:50%}']

let root: string
let previousCwd: string

/**
 * A SvelteKit project set up as the README describes: `sveltekit()` and `masterCSS()` with no
 * options, a stylesheet that imports `@stet-css/core`, classes only in `.svelte` files, and no
 * `hooks.server`. SvelteKit reads its config from the working directory when
 * `@sveltejs/kit/vite` is first imported, so the tests run from the project root.
 */
beforeAll(() => {
  root = mkdtempSync(join(packageDir, 'tests', '.tmp-sveltekit-'))
  for (const [file, content] of Object.entries(projectFiles)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content)
  }
  previousCwd = process.cwd()
  process.chdir(root)
})

afterAll(() => {
  if (previousCwd) process.chdir(previousCwd)
  if (root) rmSync(root, { recursive: true, force: true })
})

describe('SvelteKit project with masterCSS() and no hooks.server', () => {
  /**
   * Guards: `vite build` writes the rules for the classes in `.svelte` files into the client CSS
   * without a server hook. If the wrapper went back to a mode that leaves rule generation to a
   * server hook or the runtime, the built stylesheet would ship without them.
   *
   * Reverse check: passing `mode: 'progressive'` from `src/lib/vite.ts` fails this test.
   */
  test('build writes the utilities into the client CSS', async () => {
    await build({ root, logLevel: 'silent' })
    const assetsDir = join(root, '.svelte-kit/output/client/_app/immutable/assets')
    const css = readdirSync(assetsDir)
      .filter((file) => file.endsWith('.css'))
      .map((file) => readFileSync(join(assetsDir, file), 'utf-8'))
      .join('\n')

    for (const rule of UTILITY_RULES) expect(css).toContain(rule)
  }, 60000)

  /**
   * Guards: the dev server's first response carries the utilities in the CSS SvelteKit inlines
   * into the page, so the page is styled before any script runs.
   *
   * Reverse check: passing `mode: 'progressive'` from `src/lib/vite.ts` fails this test.
   */
  test('dev serves the utilities in the server-rendered page', async () => {
    const server = await createServer({
      root,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 }
    })
    try {
      await server.listen()
      const html = await (await fetch(server.resolvedUrls!.local[0])).text()

      for (const rule of UTILITY_RULES) expect(html).toContain(rule)
    } finally {
      await server.close()
    }
  }, 60000)
})
