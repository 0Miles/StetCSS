import { it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { useTestContext, type TestOptions } from '@nuxt/test-utils/e2e'
import { setupNuxtTest } from './setup-test'
import { expectStaticFixtureCSS, expectStaticFixtureHTML } from './static-css'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/static/')

// The overrides `nuxi generate` passes to prerender every crawled route into static files;
// `_generate` is internal to Nuxt's config type.
const generateConfig = { _generate: true, nitro: { static: true } } as TestOptions['nuxtConfig']

setupNuxtTest({ rootDir, server: false, nuxtConfig: generateConfig })

/**
 * Guards `nuxt generate`: the prerendered page links CSS that holds the server component's
 * and both layers' classes, and the output has no `_stet-css/` assets.
 */
it('generates static CSS that covers server components and layers', () => {
  // @nuxt/test-utils writes Nitro's output to `<buildDir>/output`.
  const publicDir = join(useTestContext().nuxt!.options.buildDir, 'output', 'public')
  expect(existsSync(join(publicDir, '_stet-css'))).toBe(false)
  const html = readFileSync(join(publicDir, 'index.html'), 'utf8')
  const hrefs = expectStaticFixtureHTML(html)
  const css = hrefs.map((href) => readFileSync(join(publicDir, href), 'utf8')).join('\n')
  expectStaticFixtureCSS(css)
})
