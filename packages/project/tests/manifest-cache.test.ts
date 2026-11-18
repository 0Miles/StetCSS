import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as compiler from '@stet-css/compiler'
import { loadProjectManifest } from '../src/manifest'
import { loadProjectManifestSync } from '../src/manifest-sync'
import { findCSSManifestEntryFiles, findCSSManifestEntryFilesSync } from '../src/entries'

vi.mock('@stet-css/compiler', async (importOriginal) => {
  const original = await importOriginal<typeof import('@stet-css/compiler')>()
  return { ...original, compileProjectManifest: vi.fn(original.compileProjectManifest) }
})

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

function hasUtility(result: Awaited<ReturnType<typeof loadProjectManifest>>, name: string) {
  return result.manifest.utilities?.some((utility) => utility.name === name) ?? false
}

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'stet-css-project-manifest-cache-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  vi.mocked(compiler.compileProjectManifest).mockClear()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('cached project manifest', () => {
  /**
   * Guards: every CSS module transform compiling the whole project manifest again (#202).
   * Trade-off (testing.md 6): counts `compileProjectManifest` calls through a module mock, because a
   * repeated compile returns an equal manifest.
   * Reverse check: ignoring `options.cache` in `loadCachedProjectManifest` turns only this test red.
   */
  test('compiles the project once while its files keep their stamps', async () => {
    const entryPath = join(root, 'app/globals.css')
    writeFileSync(entryPath, '@import "@stet-css/core";\n@components { brand { color: #123456; } }')
    settle(entryPath)

    const results = [
      await loadProjectManifest(root, { cache: true }),
      await loadProjectManifest(root, { cache: true }),
      loadProjectManifestSync(root, { cache: true })
    ]

    expect(results.every((result) => hasUtility(result, 'brand'))).toBe(true)
    expect(compiler.compileProjectManifest).toHaveBeenCalledTimes(1)
  })

  /**
   * Guards: a cached manifest outliving an edit of an entry or of a file it imports, so a CSS
   * module keeps composing removed or renamed definitions.
   * Reverse check: leaving out `result.dependencies` from the stamped files turns only the imported-file step red.
   */
  test('loads the edited manifest once an entry or a file it imports changes', async () => {
    const entryPath = join(root, 'app/globals.css')
    const tokensPath = join(root, 'app/tokens.css')
    writeFileSync(tokensPath, '@components { brand { color: #123456; } }')
    writeFileSync(entryPath, '@import "@stet-css/core";\n@import "./tokens.css";')
    settle(entryPath, tokensPath)
    expect(hasUtility(await loadProjectManifest(root, { cache: true }), 'brand')).toBe(true)

    writeFileSync(tokensPath, '@components { accent { color: #123456; } }')
    settle(tokensPath)
    const afterImportEdit = await loadProjectManifest(root, { cache: true })
    expect(hasUtility(afterImportEdit, 'brand')).toBe(false)
    expect(hasUtility(afterImportEdit, 'accent')).toBe(true)

    writeFileSync(entryPath, '@import "@stet-css/core";\n@components { card { display: block; } }')
    settle(entryPath)
    const afterEntryEdit = loadProjectManifestSync(root, { cache: true })
    expect(hasUtility(afterEntryEdit, 'accent')).toBe(false)
    expect(hasUtility(afterEntryEdit, 'card')).toBe(true)
  })
})

describe('entry discovery', () => {
  /**
   * Guards: discovery reusing what it read about a file after the file gained or lost its
   * `@import "@stet-css/core"`, or after a new entry appeared.
   * Reverse check: storing a discovery answer without its file (`[file]` to `[]`) turns only this test red.
   */
  test('finds entries that were added or edited since the last discovery', async () => {
    const globalsPath = join(root, 'app/globals.css')
    const adminPath = join(root, 'app/admin.css')
    writeFileSync(globalsPath, '.plain { color: red; }')
    settle(globalsPath)
    await expect(findCSSManifestEntryFiles(root)).resolves.toStrictEqual([])

    writeFileSync(globalsPath, '@import "@stet-css/core";')
    settle(globalsPath)
    await expect(findCSSManifestEntryFiles(root)).resolves.toStrictEqual([globalsPath])

    writeFileSync(adminPath, '@import "@stet-css/core";')
    settle(adminPath)
    expect(findCSSManifestEntryFilesSync(root)).toStrictEqual([adminPath, globalsPath])

    writeFileSync(globalsPath, '.plain { color: blue; }')
    settle(globalsPath)
    expect(findCSSManifestEntryFilesSync(root)).toStrictEqual([adminPath])
  })
})
