import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils/e2e'
import { dirname, resolve } from 'node:path'
import { setupNuxtTest } from './setup-test'
import { expectStaticFixtureCSS, findStylesheetHrefs } from './static-css'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/static/')

setupNuxtTest({ rootDir })

/**
 * Guards `nuxt build` with no module options: the CSS holds the classes of a server
 * component and of a `layers/` component, which sit outside Vite's root (`app/`).
 * Reverse check: scanning from Vite's root instead of the Nuxt root drops the layer class.
 */
it('builds static CSS that covers server components and layers', async () => {
  const html = await $fetch<string>('/')
  expect(html).toContain('server component')
  expect(html).toContain('layer component')
  expect(html).not.toContain('_master-css')
  const hrefs = findStylesheetHrefs(html)
  expect(hrefs.length).toBeGreaterThan(0)
  for (const href of hrefs) expect(href).toMatch(/\/_nuxt\/.*\.css/)
  const css = (await Promise.all(hrefs.map((href) => $fetch<string>(href)))).join('\n')
  expectStaticFixtureCSS(css)
})
