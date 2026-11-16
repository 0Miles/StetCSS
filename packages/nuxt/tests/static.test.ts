import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils/e2e'
import { dirname, resolve } from 'node:path'
import { setupNuxtTest } from './setup-test'
import { expectStaticFixtureCSS, expectStaticFixtureHTML } from './static-css'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/static/')

setupNuxtTest({ rootDir })

/**
 * Guards `nuxt build` with no module options: the CSS holds the classes of a server
 * component, of `layers/` and `extends` layers (Nuxt lists both in `_layers`), and of
 * `server/`, which sits beside Vite's root (`app/`) in no layer.
 * Reverse check: without the host's `projectDir` the `server/` class is missing; without
 * its `extraProjectDirs` the extended layer's class is.
 */
it('builds static CSS that covers server components and layers', async () => {
  const html = await $fetch<string>('/')
  const hrefs = expectStaticFixtureHTML(html)
  for (const href of hrefs) expect(href).toMatch(/\/_nuxt\/.*\.css/)
  const css = (await Promise.all(hrefs.map((href) => $fetch<string>(href)))).join('\n')
  expectStaticFixtureCSS(css)
})
