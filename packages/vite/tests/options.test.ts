import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import stetCSS, { type PluginOptions } from '../src'
import { buildProject } from './plugin-test-helper'

/** Finds a class no built-in adapter can: the class is in the adapter, not in the file. */
const probeAdapter: NonNullable<PluginOptions['adapters']>[number] = {
  name: 'probe',
  test: /adapter-probe\.md$/,
  async extract() {
    return ['m:13px']
  }
}

describe('stetCSS options', () => {
  /** Guards the plugin names Vite prints in build errors and plugin timings (#92). */
  test('names every plugin under stet-css:', () => {
    const names = stetCSS().map((plugin) => plugin.name)

    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name).toMatch(/^stet-css:/)
  })

  /**
   * Guards that a config written for the removed rendering modes, or with a typo, fails when
   * Vite loads it instead of building without what the developer asked for.
   * Reverse check: dropping the `validatePluginOptions` call in `src/core.ts` turns only this
   * test red in this package; after a build, the astro, svelte and nuxt unknown-key tests too.
   */
  test('rejects removed and unknown keys when the config loads', () => {
    expect(() => stetCSS({ mode: 'runtime' } as never))
      .toThrow('@stet-css/vite option "mode" was removed; static CSS is the only output')
    expect(() => stetCSS({ scanner: { adapters: [] } } as never))
      .toThrow('@stet-css/vite option "scanner" was removed; pass "adapters" directly.')
    expect(() => stetCSS({ adapter: [] } as never))
      .toThrow('Unknown @stet-css/vite option "adapter"; the only option is "adapters".')
  })

  /**
   * Guards that custom `adapters` reach the class set of a real build: a project whose
   * templates only its adapter can read would otherwise ship without those rules.
   * Reverse check: creating the scanner with `{}` in `src/plugins/scanner.ts` turns only this
   * test red in this package; after a build, the astro, svelte and nuxt adapter tests too.
   */
  test('builds the classes custom adapters find', async () => {
    const { css } = await buildProject({
      plugins: [stetCSS({ adapters: [probeAdapter] })],
      prefix: 'master-css-vite-adapters-',
      styleCSS: '@import "@stet-css/core";\n',
      setup: (root) => writeFileSync(join(root, 'adapter-probe.md'), 'probe\n')
    })

    expect(css).toContain('.m\\:13px{margin:13px}')
  }, 60000)
})
