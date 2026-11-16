import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import type { PluginOptions } from '@stet-css/vite'
import { describe, expect, test } from 'vitest'
import stetCSS from '../src/lib/vite.js'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))

/** Finds a class no built-in adapter can: the class is in the adapter, not in the file. */
const probeAdapter: NonNullable<PluginOptions['adapters']>[number] = {
  name: 'probe',
  test: /adapter-probe\.md$/,
  async extract() {
    return ['m:13px']
  }
}

describe('stetCSS options', () => {
  /**
   * Guards that a config with a removed or misspelled key fails when Vite loads it and names
   * this package and the one allowed key, instead of building without what it asked for.
   * Reverse check: dropping the `validatePluginOptions` call in `@stet-css/vite`'s
   * `src/core.ts` turns this test red.
   */
  test('rejects unknown keys and names "adapters"', () => {
    expect(() => stetCSS({ adapter: [] } as never))
      .toThrow('Unknown @stet-css/svelte option "adapter"; the only option is "adapters".')
  })

  /**
   * Guards that custom `adapters` reach the class set of a real Vite build: a project whose
   * templates only its adapter can read would otherwise ship without those rules. A plain Vite
   * project instead of SvelteKit keeps it to one build; the wrapper adds nothing for SvelteKit
   * (testing.md rule 6: covers the option, gives up the SvelteKit pipeline already covered by
   * `sveltekit-static.test.ts`).
   * Reverse check: calling `baseVite()` without `options` in `src/lib/vite.ts` turns both tests
   * here red.
   */
  test('builds the classes custom adapters find', async () => {
    const root = mkdtempSync(join(packageDir, 'tests', '.tmp-adapters-'))
    try {
      writeFileSync(join(root, 'index.html'), '<link rel="stylesheet" href="./style.css">\n<h1 class="fg:crimson">Adapters</h1>\n')
      writeFileSync(join(root, 'style.css'), '@import "@stet-css/core";\n')
      writeFileSync(join(root, 'adapter-probe.md'), 'Read only by the custom adapter.\n')

      await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [stetCSS({ adapters: [probeAdapter] })]
      })

      const assetsDir = join(root, 'dist/assets')
      const css = readdirSync(assetsDir)
        .filter((file) => file.endsWith('.css'))
        .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
        .join('\n')
      expect(css).toContain('.m\\:13px{margin:13px}')
      expect(css).toContain('.fg\\:crimson{')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 60000)
})
