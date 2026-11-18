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

/**
 * Guards #189 through Vue's real scoped style compiler: a `<style scoped>` block that
 * `@reference`s the entry and reads a theme variable carries that variable's `:root` rules,
 * and Vue must leave them global; as `[data-v-…]:root` they match no element.
 * Reverse check: making the stylesheet's `isScopedVueStyleRequest` return false (then
 * `bun run build`) turns only this test red.
 */
it('keeps theme variables a scoped Vue style references on :root', async () => {
  const html = await $fetch<string>('/')
  const css = (await Promise.all(expectStaticFixtureHTML(html).map((href) => $fetch<string>(href)))).join('\n')
  expect(css).toMatch(/\.probe\[data-v-[^\]]+\]\s*\{[^}]*color:\s*var\(--color-probe\)/)
  expect(css).toMatch(/prefers-color-scheme:\s*light\)\s*\{\s*:root\s*\{[^}]*--color-probe:\s*#123456/)
  expect(css).toMatch(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{[^}]*--color-probe:\s*#abcdef/)
  expect(css).not.toMatch(/\[data-v-[^\]]+\]:root/)
})
