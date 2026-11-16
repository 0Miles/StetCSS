import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import {
  compileCSS,
  compileProjectManifest,
  resolveStetCSSPackageEntryFile
} from '../src'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

/**
 * Prevents: a stylesheet still marked with the removed `@master entry;` compiling as if the marker
 * did something. Only `@import '@stet-css/core'` makes an entry now, so the build must fail and
 * name that import, and say which entry graph holds the marker.
 * Reverse check: making `assertNoMasterAtRules` return early turns only this test, the next one
 * and the located-error test red.
 */
test.concurrent('rejects @master entry and names the @stet-css/core import that replaces it', () => {
  expect(() => compileCSS('@master entry;\n.card { color: red; }'))
    .toThrow(`@master entry; was removed; mark stylesheet entries with @import '@stet-css/core'; instead`)
  expect(() => compileCSS('.card { color: red; }\n@master entry;', { from: '/app/entry.css' }))
    .toThrow('(in /app/entry.css or a stylesheet it imports)')
})

/**
 * Prevents: `@master { … }` blocks and other `@master` at-rules reaching the output unchanged,
 * where they do nothing. Settings such as `mode-trigger` belong in `@settings`.
 * Reverse check: as above, making `assertNoMasterAtRules` return early.
 */
test.concurrent('rejects every other @master at-rule and points settings at @settings', () => {
  expect(() => compileCSS('@import "@stet-css/core";\n@master { mode-trigger: media; }'))
    .toThrow(`@master at-rules were removed; mark stylesheet entries with @import '@stet-css/core'; and put settings in @settings, so delete "@master { … }"`)
  expect(() => compileCSS('@master shake;')).toThrow('so delete "@master shake;"')
  expect(() => compileCSS('@master;')).toThrow('so delete "@master;"')
})

function catchError(run: () => unknown) {
  try {
    run()
  } catch (error) {
    return error as { name?: string, code?: string, source?: { file?: string, range: { start: number, end: number } } }
  }
  throw new Error('expected an error')
}

/**
 * Prevents: the editor dropping the removed-directive errors of an open stylesheet. The language
 * server shows only `CSSDirectiveError`s, underlining their source range, so `@master` and
 * `@preserve` must fail as located directive errors on the source as given, even after an
 * `@reference` statement that compiling cuts out.
 * Reverse check: building these errors as plain `Error`s, or without a source reference, turns
 * only this test red in this package (and the language-server `@master` diagnostic test).
 */
test.concurrent('locates removed @master and @preserve at-rules for the editor', () => {
  const masterSource = '@reference "./tokens.css";\n.card { color: red; }\n@master entry;'
  const masterError = catchError(() => compileCSS(masterSource, { from: '/app/entry.css' }))
  const preserveSource = '.card { color: red; }\n@preserve native;'
  const preserveError = catchError(() => compileCSS(preserveSource, { from: '/app/entry.css' }))

  expect(masterError).toMatchObject({
    name: 'CSSDirectiveError',
    code: 'removed-master-at-rule',
    source: { file: '/app/entry.css', range: { start: masterSource.indexOf('@master'), end: masterSource.length } }
  })
  expect(preserveError).toMatchObject({
    name: 'CSSDirectiveError',
    code: 'removed-preserve-directive',
    source: { file: '/app/entry.css', range: { start: preserveSource.indexOf('@preserve'), end: preserveSource.length } }
  })
})

/**
 * Prevents: an error for a source compiled without `from` (editor buffers, API callers)
 * pointing at `master.css`, a file the user never had; the placeholder is `stet.css`, the
 * CLI's default output file.
 * Reverse check: `options.from || 'stet.css'` in `compileCSS` (`src/core.ts`) changed to
 * `'master.css'` turns only this test red.
 */
test.concurrent('names stet.css in errors for a source compiled without a file name', () => {
  const source = '.a {'.repeat(65) + '}'.repeat(65)

  expect(() => compileCSS(source)).toThrow(/levels at line 1: stet\.css$/)
})

/**
 * Prevents: native CSS that merely contains the text `@master` failing the build, such as an
 * image named `logo@master.png` or a comment. Only an at-rule that starts a statement is rejected.
 * Reverse check: ignoring the lexer's statement-start flag for `@master` turns this test red, plus
 * the lexer range test.
 */
test.concurrent('keeps @master text that is not an at-rule', () => {
  const result = compileCSS('/* @master entry; */\n.logo { background: url(logo@master.png); }')

  expect(result.nativeCSS).toContain('logo@master.png')
})

/**
 * Prevents: an entry that still says `@preserve native;` compiling as if the directive did
 * something. Entries no longer prune native CSS, so the directive must fail and tell the
 * developer which line can go and which entry graph holds it.
 */
test.concurrent('rejects the removed @preserve native directive with a delete hint', () => {
  expect(() => compileCSS('@import "@stet-css/core";\n@preserve native;\n.card { color: red; }'))
    .toThrow('@preserve was removed; stylesheet entries keep all native CSS, so delete "@preserve native;"')
  expect(() => compileCSS('@preserve other;', { from: '/app/entry.css' }))
    .toThrow('delete "@preserve other;" (in /app/entry.css or a stylesheet it imports)')
})

test('resolves CSS-only preset package root to stylesheet entry', () => {
  const presetPackageJSONFile = resolve(repoRoot, 'packages/preset/package.json')
  const presetPackageJSON = JSON.parse(readFileSync(presetPackageJSONFile, 'utf8')) as {
    exports?: Record<string, unknown>
  }

  expect(presetPackageJSON.exports?.['.']).toEqual({
    style: './src/index.css',
    default: './src/index.css'
  })

  const entry = resolveStetCSSPackageEntryFile(
    '@stet-css/preset',
    fileURLToPath(import.meta.url),
    repoRoot
  )
  const expectedEntry = resolve(repoRoot, 'packages/preset/src/index.css')

  expect(entry).toBe(expectedEntry)
  expect(entry ? existsSync(entry) : false).toBe(true)
})

test('resolves package stylesheet entry before requiring the package JavaScript entry', () => {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-package-entry-'))
  try {
    const packageRoot = join(root, 'node_modules/@stet-css/core')
    const entryFile = join(root, 'src/app.css')
    mkdirSync(join(packageRoot, 'src'), { recursive: true })
    mkdirSync(dirname(entryFile), { recursive: true })
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({
      name: '@stet-css/core',
      style: './src/index.css',
      exports: {
        '.': {
          style: './src/index.css',
          import: './dist/index.js',
          default: './dist/index.js'
        }
      }
    }))
    writeFileSync(join(packageRoot, 'src/index.css'), '@theme { --color-primary: #123456; }')
    writeFileSync(entryFile, '@import "@stet-css/core";')

    const packageStyleEntry = join(realpathSync(packageRoot), 'src/index.css')
    const entry = resolveStetCSSPackageEntryFile('@stet-css/core', entryFile, root)
    const result = compileProjectManifest([entryFile], { root })

    expect(entry).toBe(packageStyleEntry)
    expect(result.dependencies).toContain(packageStyleEntry)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
