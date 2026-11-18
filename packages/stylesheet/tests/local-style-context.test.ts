import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as compiler from '@stet-css/compiler'
import { loadLocalStyleContext, transformLocalStyleCSS } from '../src'

vi.mock('@stet-css/compiler', async (importOriginal) => {
  const original = await importOriginal<typeof import('@stet-css/compiler')>()
  return {
    ...original,
    compileCSS: vi.fn(original.compileCSS),
    compileProjectManifest: vi.fn(original.compileProjectManifest)
  }
})

/** Waits until the files' last change lies in the past, as for files saved before the build starts. */
function settle(...files: string[]) {
  const newest = Math.max(...files.map((file) => statSync(file).ctimeMs))
  while (Date.now() <= newest) { /* a millisecond at most */ }
}

/** Transforms a CSS module the way the Next and webpack style loaders do. */
async function transformModule(root: string, id: string, source: string) {
  const context = await loadLocalStyleContext(root)
  return transformLocalStyleCSS(id, source, {
    baseManifest: context.manifest,
    projectDir: root,
    emittedGlobals: context.emittedGlobals
  })
}

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'stet-css-local-style-context-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  vi.mocked(compiler.compileCSS).mockClear()
  vi.mocked(compiler.compileProjectManifest).mockClear()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('local style context', () => {
  /**
   * Guards: every CSS module compiling the project manifest and the entries' emitted globals
   * again, which made each module of a cold Next or webpack build cost about 270 ms (#202).
   * Trade-off (testing.md 6): counts compiler calls through a module mock, because a repeated
   * compile produces the same CSS.
   * Reverse check: skipping the emitted-globals cache in `loadLocalStyleContext` turns only this test red.
   */
  test('compiles the project and its entries once for every CSS module', async () => {
    const globalsPath = join(root, 'app/globals.css')
    writeFileSync(globalsPath, [
      '@import "@stet-css/core";',
      '@components { brand { background-color: #123456; } }',
      '.global-section { padding-block: var(--spacing-5xl); }'
    ].join('\n'))
    settle(globalsPath)

    for (const index of [0, 1, 2]) {
      const result = await transformModule(root, join(root, `app/m${index}.module.css`), `.m${index} { @compose brand py:5xl; }`)
      expect(result.code).toContain(`.m${index}{background-color:#123456;padding-block:var(--spacing-5xl)}`)
      // globals.css already emits the variable, so the module leaves it out
      expect(result.code).not.toContain('--spacing-5xl:')
    }

    expect(compiler.compileProjectManifest).toHaveBeenCalledTimes(1)
    expect(vi.mocked(compiler.compileCSS).mock.calls.filter(([, options]) => options?.from === globalsPath)).toHaveLength(1)
  })

  /**
   * Guards: a cached context outliving an edit of an entry, so a dev server keeps composing a
   * removed definition and keeps skipping a variable the entry no longer emits.
   * Reverse check: stamping no files in both the project manifest and the emitted-globals caches turns
   * only this test red; either cache alone is covered, since emitted globals are keyed by the manifest.
   */
  test('uses the edited entry for the next CSS module', async () => {
    const globalsPath = join(root, 'app/globals.css')
    const modulePath = join(root, 'app/m.module.css')
    writeFileSync(globalsPath, [
      '@import "@stet-css/core";',
      '.global-section { padding-block: var(--spacing-5xl); }'
    ].join('\n'))
    settle(globalsPath)
    expect((await transformModule(root, modulePath, '.m { @compose py:5xl; }')).code).not.toContain('--spacing-5xl:')

    writeFileSync(globalsPath, [
      '@import "@stet-css/core";',
      '@components { brand { background-color: #123456; } }'
    ].join('\n'))
    settle(globalsPath)
    const result = await transformModule(root, modulePath, '.m { @compose brand py:5xl; }')

    expect(result.code).toContain('.m{background-color:#123456;padding-block:var(--spacing-5xl)}')
    expect(result.code).toContain('--spacing-5xl:')
  })
})
