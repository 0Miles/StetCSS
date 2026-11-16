import { it, expect } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { loadNuxt } from '@nuxt/kit'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, './fixtures/spa/')

/**
 * Guards that a module option written for the removed config, or with a typo, fails as soon
 * as Nuxt installs the module, `nuxi prepare` (postinstall) included, and names the module
 * and the one allowed key, instead of building without what it asked for. The key comes
 * through `stetcss` in the Nuxt config, the module's config key.
 * Reverse check: dropping the `stetCSS(options, { name })` check before the `_prepare`
 * return in `src/module.ts` turns only this test red.
 */
it('rejects unknown keys and names "adapters", also under nuxi prepare', async () => {
  const buildDir = mkdtempSync(join(tmpdir(), 'master-css-nuxt-options-'))
  try {
    await expect(loadNuxt({
      cwd: rootDir,
      dev: false,
      overrides: { buildDir, _prepare: true, stetcss: { adapter: [] } } as never
    }))
      .rejects
      .toThrow('Unknown @stet-css/nuxt option "adapter"; the only option is "adapters".')
  } finally {
    rmSync(buildDir, { recursive: true, force: true })
  }
}, 120_000)
