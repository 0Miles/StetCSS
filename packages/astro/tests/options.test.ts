import { afterAll, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'astro'
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

function readCSS(dir: string) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'))
    .join('\n')
}

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true })
  rmSync(join(root, '.astro'), { recursive: true, force: true })
  rmSync(join(root, 'node_modules'), { recursive: true, force: true })
})

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

    const css = readCSS(outDir)
    expect(css).toContain('.m\\:13px{margin:13px}')
    expect(css).toContain('.fg\\:crimson{')
  }, 180_000)
})
