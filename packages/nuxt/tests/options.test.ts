import { it, expect } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { buildNuxt, loadNuxt } from '@nuxt/kit'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/spa/')

/**
 * Guards that a module option written for the removed config, or with a typo, fails the
 * build and names the module and the one allowed key, instead of building without what it
 * asked for. The key comes through `mastercss` in the Nuxt config, the module's config key.
 * Reverse check: dropping the `validatePluginOptions` call in `@stet-css/vite`'s
 * `src/core.ts` turns this test red.
 */
it('rejects unknown keys and names "adapters"', async () => {
  const buildDir = mkdtempSync(join(tmpdir(), 'master-css-nuxt-options-'))
  const nuxt = await loadNuxt({
    cwd: rootDir,
    dev: false,
    overrides: { buildDir, mastercss: { adapter: [] } } as never
  })
  try {
    await expect(buildNuxt(nuxt))
      .rejects
      .toThrow('Unknown @stet-css/nuxt option "adapter"; the only option is "adapters".')
  } finally {
    await nuxt.close()
    rmSync(buildDir, { recursive: true, force: true })
  }
}, 120_000)
