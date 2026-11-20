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

function policy(values: { include?: string[], exclude?: string[], safelist?: string[], blocklist?: (string | RegExp)[] }) {
  return { include: [], exclude: [], safelist: [], blocklist: [], ...values }
}

/**
 * Guards #239: an unquoted argument (`@safelist fg:blue;`) was read as a keyword, so the
 * statement left the output while the class, pattern or glob never reached the extraction policy,
 * with no error. Each form must fail the compile, underline the unquoted arguments for the editor,
 * and name a quoted form that, written as shown, applies the class, pattern or glob the developer
 * meant: a glob keeps its `/**\/`, a class keeps its commas, string and escapes.
 * Reverse check: skipping the unquoted-argument check in `collectStandaloneCSSDirectiveExtractionPolicy`
 * (`src/lexer/standalone-directives.ts`) turns every row red. Ending an argument at a comment turns
 * the two `/**\/` rows red, at a string the `content:'x'` row, at every comma the `rgb(0,0,0)` row;
 * dropping the escape branch turns the `\,` row red; ending the range at the first argument turns
 * the two two-argument rows red.
 */
test.concurrent.each([
  ['@safelist fg:blue;', "@safelist 'fg:blue';", 'fg:blue', policy({ safelist: ['fg:blue'] })],
  ['@blocklist debug-*;', "@blocklist 'debug-*';", 'debug-*', policy({ blocklist: [/^debug-.*$/] })],
  ['@source ./pages;', "@source './pages';", './pages', policy({ include: ['./pages'] })],
  ['@source not ./legacy;', "@source not './legacy';", './legacy', policy({ exclude: ['./legacy'] })],
  ["@safelist 'p:2' fg:blue;", "@safelist 'p:2' 'fg:blue';", 'fg:blue', policy({ safelist: ['p:2', 'fg:blue'] })],
  ['@safelist fg:blue bg:red;', "@safelist 'fg:blue' 'bg:red';", 'fg:blue bg:red', policy({ safelist: ['fg:blue', 'bg:red'] })],
  ['@safelist fg:blue, bg:red;', "@safelist 'fg:blue', 'bg:red';", 'fg:blue, bg:red', policy({ safelist: ['fg:blue', 'bg:red'] })],
  ['@source ./src/**/*.vue;', "@source './src/**/*.vue';", './src/**/*.vue', policy({ include: ['./src/**/*.vue'] })],
  [
    '@source not ../ui/**/*.stories.tsx;',
    "@source not '../ui/**/*.stories.tsx';",
    '../ui/**/*.stories.tsx',
    policy({ exclude: ['../ui/**/*.stories.tsx'] })
  ],
  ['@safelist bg:rgb(0,0,0);', "@safelist 'bg:rgb(0,0,0)';", 'bg:rgb(0,0,0)', policy({ safelist: ['bg:rgb(0,0,0)'] })],
  ["@safelist content:'x';", "@safelist \"content:'x'\";", "content:'x'", policy({ safelist: ["content:'x'"] })],
  [String.raw`@safelist fg\:blue;`, String.raw`@safelist 'fg\:blue';`, String.raw`fg\:blue`, policy({ safelist: ['fg:blue'] })],
  [String.raw`@safelist 'p:2' \,;`, String.raw`@safelist 'p:2' '\,';`, String.raw`\,`, policy({ safelist: ['p:2', ','] })]
])('rejects the unquoted argument of %s and names the quoted form', (statement, quoted, argument, intended) => {
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
  expect(compileCSS(quoted).extractionPolicy).toEqual(intended)
})

/**
 * Guards against a quoted form that reads back as something else: spaces inside parentheses or
 * brackets, and a string joined to a class by a comma, have no quoted spelling that keeps their
 * meaning, so the error shows a fixed example rather than splitting the argument.
 * Reverse check: no longer tracking parentheses and brackets turns the three rows with spaces
 * inside them red.
 */
test.concurrent.each([
  ['@safelist bg:rgb(0, 0, 0);', 'bg:rgb(0, 0, 0)', "@safelist 'fg:blue';"],
  ['@safelist a[b, c];', 'a[b, c]', "@safelist 'fg:blue';"],
  ["@safelist 'p:2',fg:blue;", "'p:2',fg:blue", "@safelist 'fg:blue';"],
  ['@source not ./src/(a b).ts;', './src/(a b).ts', "@source not './src';"]
])('shows a fixed quoted example for %s', (statement, argument, example) => {
  const error = catchError(() => compileCSS(statement, { from: '/app/entry.css' }))

  expect(error).toMatchObject({
    code: 'unquoted-directive-argument',
    source: { range: { start: statement.indexOf(argument), end: statement.indexOf(argument) + argument.length } }
  })
  expect(error.message).toContain(`as in ${example}`)
})

/**
 * Guards the quoted spellings the directives already accept: commas between strings, comments,
 * and the `not` keyword of `@source` must not count as unquoted arguments, or valid entries fail.
 * Reverse check: treating a top-level comma as argument text turns this test and the
 * `fg:blue, bg:red` row red.
 */
test.concurrent('keeps the extraction policy of quoted arguments', () => {
  const result = compileCSS([
    "@source './pages', \"./lib\" /* shared */;",
    "@source not './legacy';",
    "@safelist 'fg:blue bg:red', \"p:2\",'m:1';",
    "@blocklist 'debug-*' 'legacy';"
  ].join('\n'))

  expect(result.extractionPolicy).toEqual({
    include: ['./pages', './lib'],
    exclude: ['./legacy'],
    safelist: ['fg:blue', 'bg:red', 'p:2', 'm:1'],
    blocklist: [/^debug-.*$/, 'legacy']
  })
  expect(result.nativeCSS).toBe('')
})

/**
 * Guards the editor location of an unquoted argument in an imported stylesheet, for each
 * directive: the error must point into the file that holds it, not at the same offset in the
 * entry, where the expanded import graph would place it.
 * Reverse check: dropping the unquoted-argument check from `createCSSImportGraphReader`
 * (`src/css-import-graph-reader.ts`) turns every row red; skipping files whose only directive is
 * `@blocklist` turns the `@blocklist` row red.
 */
test.each([
  ['@safelist fg:blue;', 'fg:blue'],
  ['@blocklist debug-*;', 'debug-*'],
  ['@source ./pages;', './pages']
])('locates the unquoted argument of %s in the imported stylesheet that holds it', (statement, argument) => {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-directive-arguments-'))
  try {
    const imported = `.local { color: red; }\n${statement}`
    writeFileSync(join(root, 'entry.css'), '@import "./local.css";\n.entry { color: red; }')
    writeFileSync(join(root, 'local.css'), imported)
    const error = catchError(() => compileCSSFile(join(root, 'entry.css')))

    expect(error).toMatchObject({
      code: 'unquoted-directive-argument',
      source: {
        file: join(root, 'local.css'),
        range: { start: imported.indexOf(argument), end: imported.indexOf(argument) + argument.length }
      }
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
