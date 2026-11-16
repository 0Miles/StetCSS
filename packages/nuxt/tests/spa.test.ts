import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils/e2e'
import { dirname, resolve } from 'node:path'
import { setupNuxtTest } from './setup-test'
import { findStylesheetHrefs } from './static-css'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/spa/')

setupNuxtTest({ rootDir })

/**
 * Guards `ssr: false`: the module used to return early, so an SPA shipped no CSS.
 * Reverse check: restoring the early return on `!nuxt.options.ssr` turns this test red.
 */
it('builds static CSS for an SPA', async () => {
  const html = await $fetch<string>('/')
  const hrefs = findStylesheetHrefs(html)
  expect(hrefs.length).toBeGreaterThan(0)
  const css = (await Promise.all(hrefs.map((href) => $fetch<string>(href)))).join('\n')
  expect(css).toMatch(/padding-left:\s*45px/)
})

/**
 * Guards that the module's `adapters` reach the class set: a project whose templates only its
 * adapter can read would otherwise ship without those rules. It reuses the SPA build instead
 * of a fixture of its own (testing.md rule 6: one Nuxt build less; options pass through the
 * same way for every Nuxt build kind, which `static.test.ts` covers without options).
 * Reverse check: passing `{}` instead of `options` to `masterCSS` in `src/module.ts` turns
 * this test and the unknown-key one in `options.test.ts` red.
 */
it('builds the classes custom adapters find', async () => {
  const html = await $fetch<string>('/')
  const css = (await Promise.all(findStylesheetHrefs(html).map((href) => $fetch<string>(href)))).join('\n')
  expect(css).toMatch(/\.m\\:13px\s*{\s*margin:\s*13px/)
})
