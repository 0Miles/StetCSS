import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { resolveCSSImportGraph } from '@stet-css/compiler'
import CSSScanner from '@stet-css/scanner'
import { createExtractedCSS, createStyleCSSHostSource, registerStyleCSSSource, resolveStyleCSSImportGraph } from '../src'

async function withFiles(files: Record<string, string>, run: (root: string) => Promise<void> | void) {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-stylesheet-import-conditions-'))
  try {
    for (const [name, source] of Object.entries(files)) writeFileSync(join(root, name), source)
    await run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/**
 * Guards #183 on the static build: the entry's relative `@import` kept its rules but dropped its
 * `layer()` and media conditions, so `.x` beat every layer and `.y` applied on screen.
 * Reverse check: `applyCSSImportConditions` returning its source unchanged reds this test and the
 * compiler's condition tests.
 */
test('static extraction keeps the conditions of a relative @import around the inlined rules', () => withFiles({
  'entry.css': [
    '@import "./local.css" layer(a);',
    '@import "./print.css" print;',
    '.z { color: green }'
  ].join('\n'),
  'local.css': '@theme { --color-brand: #123456; }\n.x { color: red }',
  'print.css': '.y { color: blue }'
}, async (root) => {
  const scanner = new CSSScanner({}, root)
  await scanner.init()
  const styleCSSSources = new Map()
  const entry = join(root, 'entry.css')
  await registerStyleCSSSource(scanner, styleCSSSources, entry, readFileSync(entry, 'utf-8'), { projectDir: root })

  expect(await createExtractedCSS({ scanner, styleCSSSources, projectDir: root })).toBe([
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
    '.z {',
    '  color: green;',
    '}'
  ].join('\n'))
}))

/**
 * Guards #183: the compiler and the stylesheet pipeline each expand an entry's import graph. When
 * they disagree, a build plugin and the manifest compile see different conditions and layer order
 * for the same entry.
 * Reverse check: leaving out `hoistCSSImportStatements` in `resolveStyleCSSImportGraph` reds only this test.
 */
test('the stylesheet import graph matches the compiler import graph', () => withFiles({
  'entry.css': [
    '@import "./base.css";',
    '@import "./local.css" layer(a) supports(display: grid) print;',
    '@import "https://example.com/b.css" layer(b);',
    '.z { color: green }'
  ].join('\n'),
  'base.css': '@layer theme, base;\n@layer base { body { margin: 0 } }',
  'local.css': '@import "https://example.com/c.css";\n@theme { --color-brand: #123456; }\n.x { color: red }'
}, (root) => {
  const entry = join(root, 'entry.css')
  const compilerGraph = resolveCSSImportGraph(entry)
  const stylesheetGraph = resolveStyleCSSImportGraph(entry, readFileSync(entry, 'utf-8'), root)
  expect(stylesheetGraph.source).toBe(compilerGraph.source)
  expect(stylesheetGraph.dependencies).toEqual(compilerGraph.dependencies)
}))

const PRESET_CSS = '@layer theme;\n@layer base { body { margin: 0 } }\n@layer utilities;\n.fg\\:red { color: red }'

/**
 * Guards #183 on the Vite dev host source: the generated CSS replaces `@import '@stet-css/core'`,
 * and the kept `@import url(b.css) layer(b)` must come first. Put after it, the generated CSS's
 * `@layer theme;` declared every preset layer after `b`, so `b` lost to all of them. The layers the
 * generated CSS declares ahead of the import move with it, each declared once.
 * Reverse check: returning the joined host parts without `hoistCSSImportStatements` reds this test,
 * the next one and both Vite import-order tests.
 */
test('the host source keeps a layered @import written after @stet-css/core after the preset layers', () => {
  expect(createStyleCSSHostSource('@import "@stet-css/core";\n@import url(b.css) layer(b);\n.card { color: red }', {
    stetSource: PRESET_CSS
  })).toBe([
    '@layer theme;',
    '@layer base;',
    '@layer utilities;',
    '@import url(b.css) layer(b);',
    '@layer base { body { margin: 0 } }',
    '',
    '.fg\\:red { color: red }'
  ].join('\n'))
})

/**
 * Guards #183 on the Vite build host source: the placeholder stands in for CSS spliced in after
 * bundling, so its layers come from `stetLayerSource` and are declared before the kept import.
 * Reverse check: ignoring `stetLayerSource` reds this test and the Vite build import-order test.
 */
test('the host source declares the layers of CSS spliced in later before a kept @import', () => {
  expect(createStyleCSSHostSource('@import "@stet-css/core";\n@import url(b.css) layer(b);', {
    stetSource: '#slot{--slot:0}',
    stetLayerSource: PRESET_CSS
  })).toBe('@layer theme, base, utilities;\n@import url(b.css) layer(b);\n#slot{--slot:0}')
  expect(createStyleCSSHostSource('@import url(b.css) layer(b);\n@import "@stet-css/core";', {
    stetSource: '#slot{--slot:0}',
    stetLayerSource: PRESET_CSS
  })).toBe('@import url(b.css) layer(b);\n#slot{--slot:0}')
})

/**
 * Guards #183 on the Next host source: the generated stylesheet import was always put first, so
 * `@import url(b.css) layer(b)` written before `@import '@stet-css/core'` sorted `b` after the
 * preset layers. The generated import takes the place of the core import.
 * Reverse check: putting the host import first again reds this test and the second case of the
 * `stetLayerSource` test.
 */
test('the host source imports the generated stylesheet where @stet-css/core was written', () => {
  expect(createStyleCSSHostSource('@import url(b.css) layer(b);\n@import "@stet-css/core";', {
    stetImport: './.stet/generated.css'
  })).toBe('@import url(b.css) layer(b);\n@import "./.stet/generated.css";')
})
