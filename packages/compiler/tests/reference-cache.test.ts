import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as core from '../src/core'
import { compileCSSManifestFile } from '../src'

vi.mock('../src/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/core')>()
  return { ...original, compileCSS: vi.fn(original.compileCSS) }
})

/** How many times the stylesheet at `file` was compiled. */
function countCompiles(file: string) {
  return vi.mocked(core.compileCSS).mock.calls.filter(([, options]) => options?.from === file).length
}

/** Waits until the files' last change lies in the past, as for files saved before the build starts. */
function settle(...files: string[]) {
  const newest = Math.max(...files.map((file) => statSync(file).ctimeMs))
  while (Date.now() <= newest) { /* a millisecond at most */ }
}

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'stet-css-reference-cache-'))
  mkdirSync(join(root, 'src'), { recursive: true })
  vi.mocked(core.compileCSS).mockClear()
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
})
