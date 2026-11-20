import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as core from '../src/core'
import { compileCSSManifestFile } from '../src'

const hooks = vi.hoisted(() => ({ beforeCompile: undefined as ((from: string | undefined) => void) | undefined }))

vi.mock('../src/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/core')>()
  return {
    ...original,
    compileCSS: vi.fn((source: string, options?: Parameters<typeof original.compileCSS>[1]) => {
      hooks.beforeCompile?.(options?.from)
      return original.compileCSS(source, options)
    })
  }
})

/** How many times the stylesheet at `file` was compiled. */
function countCompiles(file: string) {
  return vi.mocked(core.compileCSS).mock.calls.filter(([, options]) => options?.from === file).length
}

/**
 * Dates the files' last modification ten seconds back, as for files saved before the build
 * starts, and waits until their change time lies in the past.
 */
function settle(...files: string[]) {
  const past = new Date(Date.now() - 10_000)
  for (const file of files) utimesSync(file, past, past)
  const newest = Math.max(...files.map((file) => statSync(file).ctimeMs))
  while (Date.now() <= newest) { /* a millisecond at most */ }
}

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'stet-css-reference-cache-'))
  mkdirSync(join(root, 'src'), { recursive: true })
  vi.mocked(core.compileCSS).mockClear()
  hooks.beforeCompile = undefined
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('CSS @reference compile cache', () => {
  /**
   * Guards: every CSS module that references the same stylesheet compiles it again, so a build
   * with N modules pays N full compiles of the referenced entry (#202).
   * Trade-off (testing.md 6): counts calls of the compiler's own `compileCSS` through a module mock
   * instead of output alone, because a repeated compile produces the same CSS.
   * Reverse check: making `compileCSSReferences` always call `compileCSSReferencesUncached` turns only this test red.
   */
  test('compiles a referenced stylesheet once for every stylesheet that references it', () => {
    const tokensPath = join(root, 'tokens.css')
    writeFileSync(tokensPath, '@components { brand { color: #123456; } }')
    const modulePaths = [0, 1, 2].map((index) => {
      const modulePath = join(root, `src/m${index}.module.css`)
      writeFileSync(modulePath, `@reference "../tokens.css"; .m${index} { @compose brand; }`)
      return modulePath
    })
    settle(tokensPath, ...modulePaths)

    for (const [index, modulePath] of modulePaths.entries()) {
      expect(compileCSSManifestFile(modulePath).css).toContain(`.m${index}{color:#123456}`)
    }

    expect(countCompiles(tokensPath)).toBe(1)
  })

  /**
   * Guards: a cached reference outliving an edit of the referenced stylesheet or of a file it
   * imports, so a dev server keeps composing the old definitions.
   * Reverse check: making the file-stamp cache's `get` skip the stamp comparison turns only this test red.
   */
  test('recompiles the reference once the referenced stylesheet or its imports change', () => {
    const tokensPath = join(root, 'tokens.css')
    const colorsPath = join(root, 'colors.css')
    const modulePath = join(root, 'src/button.module.css')
    writeFileSync(colorsPath, '@components { accent { border-color: #111111; } }')
    writeFileSync(tokensPath, '@import "./colors.css"; @components { brand { color: #123456; } }')
    writeFileSync(modulePath, '@reference "../tokens.css"; .button { @compose brand accent; }')
    settle(tokensPath, colorsPath, modulePath)
    expect(compileCSSManifestFile(modulePath).css).toContain('border-color:#111')

    writeFileSync(tokensPath, '@import "./colors.css"; @components { brand { background-color: #654321; } }')
    settle(tokensPath)
    expect(compileCSSManifestFile(modulePath).css).toContain('background-color:#654321')

    writeFileSync(colorsPath, '@components { accent { border-color: #222222; } }')
    settle(colorsPath)
    expect(compileCSSManifestFile(modulePath).css).toContain('border-color:#222')
  })

  /**
   * Guards: caching a reference compiled from text read before a file changed. The entry and its
   * reference share one import graph reader, which keeps the text it read first, so a file the
   * entry imports and edited while the entry compiles reaches the reference compile unchanged;
   * stored under the new stamp, that stale compile would serve every later stylesheet.
   * Reverse check: taking the reference tree's `startedAt` after the entry graph is read
   * (`Date.now()` at the `resolveCSSReferenceTree` call in `compileCSSManifestEntry`) turns only this test red.
   */
  test('does not keep a reference compiled while a file it read changed', () => {
    const tokensPath = join(root, 'tokens.css')
    const themePath = join(root, 'theme.css')
    const entryPath = join(root, 'entry.css')
    const modulePath = join(root, 'src/m.module.css')
    writeFileSync(tokensPath, '@components { brand { color: #111111; } }')
    writeFileSync(themePath, '@import "./tokens.css";')
    writeFileSync(entryPath, '@import "./tokens.css"; @reference "./theme.css"; .e { @compose brand; }')
    writeFileSync(modulePath, '@reference "../theme.css"; .m { @compose brand; }')
    settle(tokensPath, themePath, entryPath, modulePath)
    hooks.beforeCompile = (from) => {
      if (from !== entryPath) return
      hooks.beforeCompile = undefined
      // The editor saves while the entry compiles; only the change time tells. The file system
      // dates changes by its own clock, which can trail `Date.now()` by a tick (Linux's coarse
      // clock), so save until the change time lies after the compile began.
      const compiling = Date.now()
      do {
        writeFileSync(tokensPath, '@components { brand { color: #222222; } }')
        settle(tokensPath)
      } while (statSync(tokensPath).ctimeMs <= compiling)
    }

    compileCSSManifestFile(entryPath)

    expect(compileCSSManifestFile(modulePath).css).toContain('.m{color:#222}')
  })
})
