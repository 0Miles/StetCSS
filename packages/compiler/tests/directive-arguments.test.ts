import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileCSS, compileCSSFile } from '../src'

interface CaughtDirectiveError {
  name?: string
  code?: string
  message: string
  source?: { file?: string, range: { start: number, end: number } }
}

function catchError(run: () => unknown) {
  try {
    run()
  } catch (error) {
    return error as CaughtDirectiveError
  }
  throw new Error('expected an error')
}

/**
 * Guards #239: an unquoted argument (`@safelist fg:blue;`) was read as a keyword, so the
 * statement left the output while the class, pattern or glob never reached the extraction policy,
 * with no error. Each form must fail the compile, name the quoted spelling, and underline the
 * unquoted argument for the editor, also when quoted arguments stand beside it.
 * Reverse check: skipping the unquoted-argument check in `collectStandaloneCSSDirectiveExtractionPolicy`
 * (`src/lexer/standalone-directives.ts`) turns every row of this test red.
 */
test.concurrent.each([
  ['@safelist fg:blue;', "@safelist 'fg:blue';", 'fg:blue'],
  ['@blocklist debug-*;', "@blocklist 'debug-*';", 'debug-*'],
  ['@source ./pages;', "@source './pages';", './pages'],
  ['@source not ./legacy;', "@source not './legacy';", './legacy'],
  ["@safelist 'p:2' fg:blue;", "@safelist 'p:2' 'fg:blue';", 'fg:blue']
])('rejects the unquoted argument of %s and names the quoted form', (statement, quoted, argument) => {
  const source = `.card { color: red; }\n${statement}`
  const error = catchError(() => compileCSS(source, { from: '/app/entry.css' }))

  expect(error).toMatchObject({
    name: 'CSSDirectiveError',
    code: 'unquoted-directive-argument',
    source: {
      file: '/app/entry.css',
      range: { start: source.indexOf(argument), end: source.indexOf(argument) + argument.length }
    }
  })
  expect(error.message).toContain(quoted)
})

/**
 * Guards the quoted spellings the directives already accept: commas between strings, comments,
 * and the `not` keyword of `@source` must not count as unquoted arguments, or valid entries fail.
 * Reverse check: treating a comma as an unquoted argument turns only this test red in this file.
 */
test.concurrent('keeps the extraction policy of quoted arguments', () => {
  const result = compileCSS([
    "@source './pages', \"./lib\" /* shared */;",
    "@source not './legacy';",
    "@safelist 'fg:blue bg:red', \"p:2\";",
    "@blocklist 'debug-*' 'legacy';"
  ].join('\n'))

  expect(result.extractionPolicy).toEqual({
    include: ['./pages', './lib'],
    exclude: ['./legacy'],
    safelist: ['fg:blue', 'bg:red', 'p:2'],
    blocklist: [/^debug-.*$/, 'legacy']
  })
  expect(result.nativeCSS).toBe('')
})

/**
 * Guards the editor location of an unquoted argument in an imported stylesheet: the error must
 * point into the file that holds it, not at the same offset in the entry, where the expanded import
 * graph would place it.
 * Reverse check: dropping the unquoted-argument check from `createCSSImportGraphReader`
 * (`src/css-import-graph-reader.ts`) turns only this test red in this file.
 */
test('locates an unquoted argument in the imported stylesheet that holds it', () => {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-directive-arguments-'))
  try {
    const imported = '.local { color: red; }\n@safelist fg:blue;'
    writeFileSync(join(root, 'entry.css'), '@import "./local.css";\n.entry { color: red; }')
    writeFileSync(join(root, 'local.css'), imported)
    const error = catchError(() => compileCSSFile(join(root, 'entry.css')))

    expect(error).toMatchObject({
      code: 'unquoted-directive-argument',
      source: {
        file: join(root, 'local.css'),
        range: { start: imported.indexOf('fg:blue'), end: imported.length - 1 }
      }
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
