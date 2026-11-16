import { afterAll, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'astro'
import { cleanFixture, readFiles } from './fixture-helpers'
import masterCSS, { type IntegrationOptions } from '../src'

const root = fileURLToPath(new URL('./fixtures/adapters/', import.meta.url))
const outDir = join(root, 'dist')

/** Finds a class no built-in adapter can: the class is in the adapter, not in the file. */
const probeAdapter: NonNullable<IntegrationOptions['adapters']>[number] = {
  name: 'probe',
  test: /adapter-probe\.md$/,
  async extract() {
    return ['m:13px']
  }
}


afterAll(() => cleanFixture(root, outDir))

describe('masterCSS options', () => {
  /**
   * Guards that an Astro config with a removed or misspelled key fails the build and names
   * the integration and the one allowed key, instead of building without what it asked for.
   * Reverse check: dropping the `validatePluginOptions` call in `@stet-css/vite`'s
   * `src/core.ts` turns this test red.
   */
  it('rejects unknown keys and names "adapters"', async () => {
    await expect(build({
      root,
      outDir,
      logLevel: 'silent',
      telemetry: false,
      integrations: [masterCSS({ adapter: [] } as never)]
    } as Parameters<typeof build>[0]))
      .rejects
      .toThrow('Unknown @stet-css/astro option "adapter"; the only option is "adapters".')
  }, 60_000)

  /**
   * Guards that custom `adapters` reach the class set of an Astro build: a project whose
   * templates only its adapter can read would otherwise ship without those rules.
   * Reverse check: passing `{}` instead of `options` to the Vite plugin in `src/core.ts`
   * turns both tests here red.
   */
  it('builds the classes custom adapters find', async () => {
    rmSync(outDir, { recursive: true, force: true })
    await build({
      root,
      outDir,
      logLevel: 'error',
      telemetry: false,
      build: { inlineStylesheets: 'never' },
      integrations: [masterCSS({ adapters: [probeAdapter] })]
    } as Parameters<typeof build>[0])

    const css = readFiles(outDir, '.css').join('\n')
    expect(css).toContain('.m\\:13px{margin:13px}')
    expect(css).toContain('.fg\\:crimson{')
  }, 180_000)
})
