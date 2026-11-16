import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const projectFiles: Record<string, string> = {
  'svelte.config.js': 'export default {}\n',
  // SvelteKit runs its client build from this file, so the plugins cannot be passed inline.
  'vite.config.js': `
import { sveltekit } from '@sveltejs/kit/vite'
import masterCSS from ${JSON.stringify(join(packageDir, 'src/lib/vite.ts'))}

export default { plugins: [sveltekit(), masterCSS()] }
`,
  'src/app.html': `
<!doctype html>
<html lang="en">
<head>%sveltekit.head%</head>
<body><div style="display: contents">%sveltekit.body%</div></body>
</html>
`,
  'src/routes/styles.css': `@import '@stet-css/core';\n`,
  'src/routes/+layout.svelte': `
<script>
  import './styles.css'
  let { children } = $props()
</script>

{@render children()}
`,
  // A class that exists only in server load data: no client module spells it out in markup.
  'src/routes/+page.server.js': `export const load = () => ({ cls: 'pt:77px' })\n`,
  'src/routes/+page.svelte': `
<script>
  let { data } = $props()
</script>

<h1 class="mx:auto max-w:50%">Hello</h1>
<p class={data.cls}>From the server</p>
`,
  // A component only the server renders: its route ships no client JavaScript.
  'src/lib/ServerOnly.svelte': '<p class="ml:55px">Server only</p>\n',
  'src/routes/server-only/+page.js': 'export const csr = false\nexport const prerender = true\n',
  'src/routes/server-only/+page.svelte': `
<script>
  import ServerOnly from '$lib/ServerOnly.svelte'
</script>

<ServerOnly />
`
}
const UTILITY_RULES = [
  '.mx\\:auto{margin-inline:auto}',
  '.max-w\\:50\\%{max-width:50%}',
  '.pt\\:77px{padding-top:77px}',
  '.ml\\:55px{margin-left:55px}'
]

const previousCwd = process.cwd()
let root: string

/**
 * A SvelteKit project set up as the README describes: `sveltekit()` and `masterCSS()` with no
 * options, a stylesheet that imports `@stet-css/core`, and no `hooks.server`. Besides classes in
 * a page's markup it has the two cases only the server renders, which the removed hook used to
 * cover: a class that arrives in server load data, and a component on a route without client
 * JavaScript. SvelteKit reads its config from the working directory when
 * `@sveltejs/kit/vite` is first imported, so the tests run from the project root.
 */
beforeAll(() => {
  root = mkdtempSync(join(packageDir, 'tests', '.tmp-sveltekit-'))
  for (const [file, content] of Object.entries(projectFiles)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content.trimStart())
  }
  process.chdir(root)
})

afterAll(() => {
  process.chdir(previousCwd)
  if (root) rmSync(root, { recursive: true, force: true })
})

describe('SvelteKit project with masterCSS() and no hooks.server', () => {
  /**
   * Guards: `vite build` writes the rules for the project's classes into the stylesheet a built
   * page links, without a server hook. If the wrapper went back to a mode that leaves rule
   * generation to a server hook or the runtime, the linked stylesheet would ship without them,
   * and the server-only page, which runs no script, would stay unstyled.
   *
   * Reverse check: returning `[]` from `src/lib/vite.ts` fails both tests in this file.
   */
  test('build writes the utilities into the stylesheet the built page links', async () => {
    await build({ root, logLevel: 'silent' })
    const outputDir = join(root, '.svelte-kit/output')
    const html = readFileSync(join(outputDir, 'prerendered/pages/server-only.html'), 'utf-8')
    const css = [...html.matchAll(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*\brel="stylesheet"/g)]
      .map(([, href]) => readFileSync(join(outputDir, 'client', href), 'utf-8'))
      .join('\n')

    expect(html).not.toMatch(/<script\b/)
    for (const rule of UTILITY_RULES) expect(css).toContain(rule)
  }, 60000)

  /**
   * Guards: the dev server's first response carries the utilities in the CSS SvelteKit inlines
   * into the page, so the page is styled before any script runs, on the page that reads its class
   * from server load data and on the page only the server renders.
   *
   * Reverse check: returning `[]` from `src/lib/vite.ts` fails both tests in this file.
   */
  test('dev serves the utilities in the server-rendered pages', async () => {
    const server = await createServer({
      root,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 }
    })
    try {
      await server.listen()
      const origin = server.resolvedUrls!.local[0]

      for (const path of ['', 'server-only']) {
        const html = await (await fetch(origin + path)).text()
        for (const rule of UTILITY_RULES) expect(html, `/${path}`).toContain(rule)
      }
    } finally {
      await server.close()
    }
  }, 60000)
})
