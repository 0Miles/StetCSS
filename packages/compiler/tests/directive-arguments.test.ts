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
 * and name the statement with each argument quoted as written, which applies the class, pattern or
 * glob the developer meant; the `/**\/` of a glob stays in it.
 * Reverse check: skipping the unquoted-argument check in `collectStandaloneCSSDirectiveExtractionPolicy`
 * (`src/lexer/standalone-directives.ts`) turns every row red; dropping the `/**\/` alternative from
 * `ECHOED_DIRECTIVE_ARGUMENT_RE` turns the two glob rows red; ending the range at the first argument
 * turns the `fg:blue bg:red` row and the multi-item rows of the fixed-example test red.
 */
test.concurrent.each([
  ['@safelist fg:blue;', "@safelist 'fg:blue';", 'fg:blue', policy({ safelist: ['fg:blue'] })],
  ['@blocklist debug-*;', "@blocklist 'debug-*';", 'debug-*', policy({ blocklist: [/^debug-.*$/] })],
  ['@source ./pages;', "@source './pages';", './pages', policy({ include: ['./pages'] })],
  ['@source not ./legacy;', "@source not './legacy';", './legacy', policy({ exclude: ['./legacy'] })],
  ["@safelist 'p:2' fg:blue;", "@safelist 'p:2' 'fg:blue';", 'fg:blue', policy({ safelist: ['p:2', 'fg:blue'] })],
  ["@safelist 'p:2', fg:blue;", "@safelist 'p:2', 'fg:blue';", 'fg:blue', policy({ safelist: ['p:2', 'fg:blue'] })],
  ['@safelist fg:blue bg:red;', "@safelist 'fg:blue' 'bg:red';", 'fg:blue bg:red', policy({ safelist: ['fg:blue', 'bg:red'] })],
  ['@safelist fg:blue /* note */;', "@safelist 'fg:blue' /* note */;", 'fg:blue', policy({ safelist: ['fg:blue'] })],
  ["@safelist 'p:2'\tfg:blue;", "@safelist 'p:2' 'fg:blue';", 'fg:blue', policy({ safelist: ['p:2', 'fg:blue'] })],
  ['@source ./src/**/*.vue;', "@source './src/**/*.vue';", './src/**/*.vue', policy({ include: ['./src/**/*.vue'] })],
  [
    '@source not ../ui/**/*.stories.tsx;',
    "@source not '../ui/**/*.stories.tsx';",
    '../ui/**/*.stories.tsx',
    policy({ exclude: ['../ui/**/*.stories.tsx'] })
  ]
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
  expect(error.message).toContain(`so write ${quoted}`)
  expect(compileCSS(quoted).extractionPolicy).toEqual(intended)
})

/**
 * Guards against a quoted form that reads back as something else (#239 review F2-F4, F13, F14):
 * an argument holding a quote, an escape, a comma, a bracket or a comment other than a glob's
 * `/**\/` could change meaning inside quotes (`'bg:rgb(0' '0' '0)'`, `"content:'a\'b'"`), so the
 * error shows a fixed example instead, still failing and underlining the argument.
 * Reverse check: removing any one of `'`, `"`, `\`, `,`, `)`, `]` from `ECHOED_DIRECTIVE_ARGUMENT_RE`'s
 * class turns red only the rows whose argument relies on that character; letting `/` match before
 * `*` turns the `/*x*\/` row red; dropping ` not` from the example turns the `@source not` row red;
 * leaving an escape out of an item's text turns the `\,` row red.
 * The `n,ot` / `n'x'ot` rows guard #239 review F15: a comma or string splits `not` into words the
 * compile drops; taking `not` from the item's text without commas and strings alone compiled them
 * silently to an include and turns those rows red, as does deciding the example's ` not` that way.
 */
test.concurrent.each([
  ["@safelist content:'x';", "content:'x'", "@safelist 'fg:blue';"],
  ['@safelist content:"x";', 'content:"x"', "@safelist 'fg:blue';"],
  [String.raw`@safelist fg\:blue;`, String.raw`fg\:blue`, "@safelist 'fg:blue';"],
  [String.raw`@safelist 'p:2' \,;`, String.raw`\,`, "@safelist 'fg:blue';"],
  ['@safelist fg:blue,bg:red;', 'fg:blue,bg:red', "@safelist 'fg:blue';"],
  ['@safelist fg:blue, bg:red;', 'fg:blue, bg:red', "@safelist 'fg:blue';"],
  ['@safelist ,fg:blue;', ',fg:blue', "@safelist 'fg:blue';"],
  ['@safelist a) b;', 'a) b', "@safelist 'fg:blue';"],
  ['@safelist a] b;', 'a] b', "@safelist 'fg:blue';"],
  ['@safelist bg:rgb(0,0,0);', 'bg:rgb(0,0,0)', "@safelist 'fg:blue';"],
  ['@safelist bg:rgb(0 0 0);', 'bg:rgb(0 0 0)', "@safelist 'fg:blue';"],
  ['@safelist fg:blue/*x*/;', 'fg:blue/*x*/', "@safelist 'fg:blue';"],
  ["@safelist 'p:2',fg:blue;", "'p:2',fg:blue", "@safelist 'fg:blue';"],
  ["@safelist content:'a\"b';", "content:'a\"b'", "@safelist 'fg:blue';"],
  [String.raw`@safelist content:'a\'b';`, String.raw`content:'a\'b'`, "@safelist 'fg:blue';"],
  ['@blocklist debug-*,x;', 'debug-*,x', "@blocklist 'debug-*';"],
  ['@source ./a,b;', './a,b', "@source './src';"],
  ['@source not ./a,b;', './a,b', "@source not './src';"],
  ["@source n,ot './a';", 'n,ot', "@source './src';"],
  ["@source n'x'ot;", "n'x'ot", "@source './src';"],
  ["@source n'./a'ot './b';", "n'./a'ot", "@source './src';"]
])('shows a fixed quoted example for %s', (statement, argument, example) => {
  const error = catchError(() => compileCSS(statement, { from: '/app/entry.css' }))

  expect(error).toMatchObject({
    code: 'unquoted-directive-argument',
    source: { range: { start: statement.indexOf(argument), end: statement.indexOf(argument) + argument.length } }
  })
  expect(error.message).toContain(`quote each argument, as in ${example}`)
})

/**
 * Guards the quoted spellings the directives already accept: commas between strings, comments,
 * and the `not` keyword of `@source` must not count as unquoted arguments, or valid entries fail.
 * Reverse check: counting a comma as argument text turns this test, the `'p:2', fg:blue` row and
 * the `not,'./legacy'` row red.
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
 * Guards #239 review F9: `not` written right against a string, comment or comma is still the
 * keyword, so these quoted forms keep excluding `./legacy` as they did before the check existed.
 * The line-broken row guards review 4 F3: a newline or tab separates arguments like a space.
 * Reverse check: recognising `not` by the item's whole text instead of its text outside strings
 * and comments turns every row red; splitting the prelude only at spaces turns the line-broken row
 * red.
 */
test.concurrent.each([
  "@source not\n  './legacy';",
  "@source not'./legacy';",
  "@source not/* legacy */ './legacy';",
  "@source not,'./legacy';",
  "@source ,not './legacy';",
  "@source no/**/t './legacy';"
])('keeps %s an exclusion', (statement) => {
  expect(compileCSS(statement).extractionPolicy).toEqual(policy({ exclude: ['./legacy'] }))
})

/**
 * Guards #239 review 4 F1: an unquoted glob holding `/*` opens a comment that swallows the `;` and
 * the rest of the file, so the statement never ended, was never checked, and the rules after it
 * vanished with no error. A statement that runs to the end of the file is checked too, underlined
 * from its first unquoted argument to the end; a quoted one still compiles as before.
 * Reverse check: scanning only `;`-terminated statements in the check turns every throwing row red.
 */
test.concurrent.each([
  ['@source ./src/*.vue;\n.card { color: red; }', './src', "quote each argument, as in @source './src';"],
  ['@source not ./src/*.vue;', './src', "quote each argument, as in @source not './src';"],
  ['@safelist fg:blue/*', 'fg:blue', "quote each argument, as in @safelist 'fg:blue';"],
  ['.card { color: red; }\n@safelist fg:blue', 'fg:blue', "so write @safelist 'fg:blue';"]
])('rejects the unquoted argument of %j, which runs to the end of the file', (source, argument, advice) => {
  const error = catchError(() => compileCSS(source, { from: '/app/entry.css' }))

  expect(error).toMatchObject({
    code: 'unquoted-directive-argument',
    source: { file: '/app/entry.css', range: { start: source.indexOf(argument), end: source.length } }
  })
  expect(error.message).toContain(advice)
})

test.concurrent.each([
  "@source './src' /* note",
  "@safelist 'fg:blue'"
])('leaves the quoted %j that runs to the end of the file as before', (source) => {
  expect(compileCSS(source).extractionPolicy).toEqual(policy({}))
})

/**
 * Guards the opt-out the language server uses for a document outside every StetCSS import graph:
 * a Tailwind stylesheet's `@source inline(...)` must compile as it did before the check existed.
 * Reverse check: ignoring `checkDirectiveArguments` in `compileCSS` turns this test red.
 */
test.concurrent('skips the unquoted-argument check when checkDirectiveArguments is false', () => {
  const result = compileCSS('@source inline("underline");\n@safelist fg:blue;\n@source ./src/*.vue;', {
    checkDirectiveArguments: false
  })

  // The policy before the check existed: the string inside `inline(...)` read as an include.
  expect(result.extractionPolicy).toEqual(policy({ include: ['underline'] }))
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
