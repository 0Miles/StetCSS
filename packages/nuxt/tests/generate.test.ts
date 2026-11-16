import { it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { useTestContext, type TestOptions } from '@nuxt/test-utils/e2e'
import { setupNuxtTest } from './setup-test'
import { expectStaticFixtureCSS, findStylesheetHrefs } from './static-css'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/static/')

// The overrides `nuxi generate` passes to prerender every crawled route into static files;
// `_generate` is internal to Nuxt's config type.
const generateConfig = { _generate: true, nitro: { static: true } } as TestOptions['nuxtConfig']

setupNuxtTest({ rootDir, server: false, nuxtConfig: generateConfig })

/**
 * Guards `nuxt generate`: the prerendered page links CSS that holds the server component's
 * and both layers' classes, and the output has no `_master-css/` assets.
 */
it('generates static CSS that covers server components and layers', () => {
  // @nuxt/test-utils writes Nitro's output to `<buildDir>/output`.
  const publicDir = join(useTestContext().nuxt!.options.buildDir, 'output', 'public')
  expect(existsSync(join(publicDir, '_master-css'))).toBe(false)
  const html = readFileSync(join(publicDir, 'index.html'), 'utf8')
  expect(html).toContain('server component')
  expect(html).toContain('layer component')
  expect(html).toContain('extended base card')
  const hrefs = findStylesheetHrefs(html)
  expect(hrefs.length).toBeGreaterThan(0)
  const css = hrefs.map((href) => readFileSync(join(publicDir, href), 'utf8')).join('\n')
  expectStaticFixtureCSS(css)
})
