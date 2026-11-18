import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileCSSFile } from '../src'

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
 * every layer the author declared before it. The stylesheet must start with the author's order.
 * Reverse check: dropping the leading `@layer` statement in `hoistCSSImportStatements` reds only this test.
 */
test('an @import moved to the start keeps the layer order the stylesheet was written in', () => {
  expect(compileNativeCSS({
    'entry.css': [
      '@import "./base.css";',
      '@import "./local.css" layer(a);',
      '@import "https://example.com/b.css" layer(b);',
      '.z { color: green }'
    ].join('\n'),
    'base.css': '@layer theme, base;\n@layer base { body { margin: 0 } }',
    'local.css': '.x { color: red }'
  })).toBe([
    '@layer theme, base, a, b;',
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
})
