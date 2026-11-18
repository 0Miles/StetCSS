import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileCSSFile, resolveCSSImportGraph } from '../src'

function withFiles(files: Record<string, string>, run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-import-conditions-'))
  try {
    for (const [name, source] of Object.entries(files)) writeFileSync(join(root, name), source)
    run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function compileNativeCSS(files: Record<string, string>) {
  let nativeCSS = ''
  withFiles(files, (root) => {
    nativeCSS = compileCSSFile(join(root, 'entry.css')).nativeCSS
  })
  return nativeCSS
}

/**
 * Guards #183: an inlined relative `@import` kept its rules but dropped its `layer()`,
 * `supports()` and media conditions. Unlayered rules beat every layer, so `layer(a)` reversed the
 * author's cascade, and `print` styles applied on screen.
 * Reverse check: `applyCSSImportConditions` returning its source unchanged reds every test here and
 * the stylesheet static-extraction test.
 */
test('a relative @import keeps its layer, supports and media conditions around the inlined rules', () => {
  expect(compileNativeCSS({
    'entry.css': [
      '@import "./local.css" layer(a);',
      '@import "./print.css" print;',
      '@import "./grid.css" supports(display: grid) screen and (min-width: 1px);',
      '.z { color: green }'
    ].join('\n'),
    'local.css': '.x { color: red }',
    'print.css': '.y { color: blue }',
    'grid.css': '.w { color: pink }'
  })).toBe([
    '@layer a {',
    '  .x {',
    '    color: red;',
    '  }',
    '}',
    '',
    '@media print {',
    '  .y {',
    '    color: #00f;',
    '  }',
    '}',
    '',
    '@media screen and (width >= 1px) {',
    '  @supports (display: grid) {',
    '    .w {',
    '      color: pink;',
    '    }',
    '  }',
    '}',
    '',
    '.z {',
    '  color: green;',
    '}'
  ].join('\n'))
})

/**
 * Guards #183: StetCSS directives that must be top-level stay outside the conditions an import
 * puts its stylesheet under. Wrapped in `@layer a { … }`, `@theme` and `@utilities` failed the
 * compile ("must be top-level") and `@source` stopped feeding the class set.
 * Reverse check: keeping no directive out of the wrapper reds only this test and the stylesheet
 * static-extraction test.
 */
test('top-level StetCSS directives of a conditioned @import stay outside its conditions', () => {
  withFiles({
    'entry.css': '@import "./local.css" layer(a) print;',
    'local.css': [
      '@source "./pages";',
      '@theme { --color-brand: #123456; }',
      '@utilities { brand { color: red } }',
      '.x { color: red }'
    ].join('\n')
  }, (root) => {
    const result = compileCSSFile(join(root, 'entry.css'))
    expect(result.nativeCSS).toBe([
      '@media print {',
      '  @layer a {',
      '    .x {',
      '      color: red;',
      '    }',
      '  }',
      '}'
    ].join('\n'))
    expect(result.extractionPolicy.include).toEqual(['./pages'])
    expect(result.manifestInput.variables).toEqual([{ name: 'color-brand', value: '#123456' }])
    expect(result.styleDefinitions?.map(({ name, layer }) => ({ name, layer }))).toEqual([{ name: 'brand', layer: 'utilities' }])
  })
})

/**
 * Guards #183: CSS only accepts `@import` before other rules, so an import the graph keeps moves to
 * the start. Moved ahead of `@layer theme, base;`, its `layer(b)` was declared first and `b` lost to
 * every layer the author declared before it. The layers declared before it move ahead with it, in
 * written order, and each is declared once: base.css's own statement moves rather than being
 * repeated, and the `layer(a)` wrapper, a block, gets a statement where it stood.
 * Reverse check: leaving `@layer` statements and blocks out of the moved prelude in
 * `hoistCSSImportStatements` reds this test, the stylesheet host-source layer tests and both Vite
 * import-order tests.
 */
test('an @import moved to the start keeps the layer order the stylesheet was written in', () => withFiles({
  'entry.css': [
    '@import "./base.css";',
    '@import "./local.css" layer(a);',
    '@import "https://example.com/b.css" layer(b);',
    '.z { color: green }'
  ].join('\n'),
  'base.css': '@layer theme, base;\n@layer base { body { margin: 0 } }',
  'local.css': '.x { color: red }'
}, (root) => {
  const entry = join(root, 'entry.css')
  expect(resolveCSSImportGraph(entry).source).toBe([
    '@layer theme, base;',
    '@layer a;',
    '@import "https://example.com/b.css" layer(b);',
    '@layer base { body { margin: 0 } }',
    '@layer a{',
    '.x { color: red }',
    '}',
    '',
    '.z { color: green }'
  ].join('\n'))
  expect(compileCSSFile(entry).nativeCSS).toBe([
    '@layer theme, base, a;',
    '@import "https://example.com/b.css" layer(b);',
    '',
    '@layer base {',
    '  body {',
    '    margin: 0;',
    '  }',
    '}',
    '',
    '@layer a {',
    '  .x {',
    '    color: red;',
    '  }',
    '}',
    '',
    '.z {',
    '  color: green;',
    '}'
  ].join('\n'))
}))

/**
 * Guards #183: a layer declared only inside a conditional rule is not declared up front. Declared
 * ahead of the moved `@import url(y.css) layer(y)`, `x` from the `print` import would sort before
 * `y` on screen, where native CSS declares `y` first and `x` with the later `./x.css`.
 * Reverse check: collecting `@layer` inside `@media` blocks for the moved prelude reds only this test.
 */
test('a layer declared only under a condition does not move ahead of a kept import', () => {
  expect(compileNativeCSS({
    'entry.css': '@import "./p.css" print;\n@import url(y.css) layer(y);\n@import "./x.css";',
    'p.css': '@layer x { .p { color: red } }',
    'x.css': '@layer x { .q { color: blue } }'
  }).startsWith('@import "y.css" layer(y);\n')).toBe(true)
})

/**
 * Guards #183: a stylesheet inlined under conditions can keep its own `@import` (a URL, a package).
 * Lifted out of the condition blocks unchanged, `c.css` loaded unlayered on screen although the
 * author imported it inside `layer(y)` for print. The kept import carries both sets of conditions.
 * Reverse check: lifting kept imports without `addCSSImportConditions` reds this test and both
 * rows below.
 */
test('an @import kept inside a conditioned @import carries both sets of conditions', () => {
  expect(compileNativeCSS({
    'entry.css': '@import "./a.css" layer(y) supports(display: grid) print;',
    'a.css': [
      '@import url(c.css);',
      '@import url(d.css) layer(inner) supports(color: red) (min-width: 1px);',
      '.a { color: red }'
    ].join('\n')
  })).toBe([
    '@import "c.css" layer(y) supports(display: grid) print;',
    '@import "d.css" layer(y.inner) supports((display: grid) and (color: red)) print and (width >= 1px);',
    '',
    '@media print {',
    '  @supports (display: grid) {',
    '    @layer y {',
    '      .a {',
    '        color: red;',
    '      }',
    '    }',
    '  }',
    '}'
  ].join('\n'))
})

const inexpressibleImports = [
  { case: 'an anonymous layer', parent: 'layer', child: '@import url(c.css);', message: 'an anonymous layer cannot be named on the kept import' },
  { case: 'two media types', parent: 'print', child: '@import url(c.css) screen;', message: 'one media query cannot require both "print" and "screen"' }
]

/**
 * Guards #183: where one `@import` cannot carry both sets of conditions, the compile names the
 * import instead of dropping a condition and shipping a different cascade.
 * Reverse check: returning the kept statement unchanged in `addCSSImportConditions` reds both rows
 * and the test above.
 */
test.each(inexpressibleImports)('an @import kept inside $case fails with both statements', ({ parent, child, message }) => {
  expect(() => compileNativeCSS({
    'entry.css': `@import "./a.css" ${parent};`,
    'a.css': `${child}\n.a { color: red }`
  })).toThrow(`${child} is kept as an @import inside @import "./a.css" ${parent};, but ${message}`)
})
