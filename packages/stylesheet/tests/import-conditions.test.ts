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
 * The static CSS for the classes of `root`'s files, with `entries` (file name to source; a file's
 * own source when `undefined`) registered in order.
 */
async function extractEntries(
  root: string,
  entries: Record<string, string | undefined>,
  options: Partial<Parameters<typeof createExtractedCSS>[0]> = {}
) {
  const scanner = new CSSScanner({}, root)
  await scanner.init()
  const styleCSSSources = new Map()
  for (const [name, source] of Object.entries(entries)) {
    const entry = join(root, name)
    await registerStyleCSSSource(scanner, styleCSSSources, entry, source ?? readFileSync(entry, 'utf-8'), { projectDir: root })
  }
  return createExtractedCSS({ scanner, styleCSSSources, projectDir: root, ...options })
}

/** The static CSS for the classes of `root`'s files, with `entryName` as the only entry. */
function extractEntry(root: string, entryName: string) {
  return extractEntries(root, { [entryName]: undefined })
}

/** Cascade layer order: each layer name where an `@layer` statement or block first names it. */
function layerOrder(css: string) {
  return [...new Set([...css.matchAll(/@layer\s+([^{;]+)[{;]/g)]
    .flatMap((match) => match[1].split(',').map((name) => name.trim())))]
}

/** Every layer name an `@layer` statement declares, once per statement that names it. */
function layerStatementNames(css: string) {
  return [...css.matchAll(/@layer\s+([^{;]+);/g)]
    .flatMap((match) => match[1].split(',').map((name) => name.trim()))
}

/**
 * Guards #250 on static extraction (the CLI, static builds): the package's CSS always came first
 * and `@layer reset;` written before `@import "@stet-css/core"` was lost, so `reset` was declared
 * after `utilities` and its `.r` beat `fg:blue`. The layers written before the import now lead the
 * CSS, each declared once.
 * Reverse check: before the fix this test and the next one were red, with `reset` after `utilities`.
 */
test('static extraction declares the layers written before @stet-css/core ahead of the preset layers', () => withFiles({
  'main.css': '@layer reset;\n@import "@stet-css/core";\n@layer reset { .r { color: rgb(0 128 0); } }',
  'index.html': '<div class="r fg:blue"></div>'
}, async (root) => {
  const css = await extractEntry(root, 'main.css')
  expect(layerOrder(css)).toEqual(['reset', 'theme', 'base', 'defaults', 'components', 'utilities'])
  const declared = layerStatementNames(css)
  expect(declared).toContain('reset')
  expect(declared).toEqual([...new Set(declared)])
}))

/**
 * Guards #250 for the other ways an entry orders layers around `@import "@stet-css/core"`: a layer
 * an inlined relative import names before it is declared ahead of the preset too, and a statement
 * written after it stays after the preset layers, as native CSS orders them.
 * Reverse check: moving every `@layer` statement of the entry ahead of the preset reds only this
 * test; before the fix it was red with `reset` and `vendor` after `utilities`.
 */
test('static extraction keeps the layers written after @stet-css/core after the preset layers', () => withFiles({
  'main.css': [
    '@layer reset;',
    '@import "./vendor.css" layer(vendor);',
    '@import "@stet-css/core";',
    '@layer late;',
    '@layer reset { .r { color: green } }',
    '@layer late { .l { color: red } }'
  ].join('\n'),
  'vendor.css': '.v { color: blue }',
  'index.html': '<div class="fg:blue"></div>'
}, async (root) => {
  expect(layerOrder(await extractEntry(root, 'main.css')))
    .toEqual(['reset', 'vendor', 'theme', 'base', 'defaults', 'components', 'utilities', 'late'])
}))

/**
 * Guards #250's "each layer declared once": `@layer reset;` before `@import "@stet-css/core"` with
 * no `reset` block left the entry's compile to keep the statement, so the CSS declared `reset`
 * ahead of the preset and again after it. The statement leaves the entry's own CSS.
 * Reverse check: keeping the statements in the entry's source reds only this test.
 */
test('static extraction declares a layer written before @stet-css/core once when no block follows', () => withFiles({
  'main.css': '@layer reset;\n@import "@stet-css/core";\n.a { color: red }',
  'index.html': '<div class="fg:blue"></div>'
}, async (root) => {
  expect(layerStatementNames(await extractEntry(root, 'main.css')).filter((name) => name === 'reset')).toEqual(['reset'])
}))

/**
 * Guards #250 across entries: all entries share one extracted CSS, so two entries that each write
 * `@layer reset;` before `@import "@stet-css/core"` must not lead it with `@layer reset, reset;`.
 * Reverse check: concatenating the entries' layers without de-duplicating reds only this test.
 */
test('static extraction declares a layer two entries write before @stet-css/core once', () => withFiles({
  'a.css': '@layer reset;\n@import "@stet-css/core";\n@layer reset { .a { color: red } }',
  'b.css': '@layer reset;\n@import "@stet-css/core";\n@layer reset { .b { color: blue } }',
  'index.html': '<div class="fg:blue"></div>'
}, async (root) => {
  const css = await extractEntries(root, { 'a.css': undefined, 'b.css': undefined })
  expect(css.startsWith('@layer reset;')).toBe(true)
  expect(layerStatementNames(css).filter((name) => name === 'reset')).toEqual(['reset'])
}))

/**
 * Guards #250 against `includeNativeCSS: false`: the layers written before
 * `@import "@stet-css/core"` belong to the entry's native CSS, so CSS without it must not declare them.
 * Reverse check: emitting the leading statement regardless of `includeNativeCSS` reds only this test.
 */
test('static extraction without native CSS declares no layer written before @stet-css/core', () => withFiles({
  'main.css': '@layer reset;\n@import "@stet-css/core";\n@layer reset { .r { color: green } }',
  'index.html': '<div class="r fg:blue"></div>'
}, async (root) => {
  const css = await extractEntries(root, { 'main.css': undefined }, { includeNativeCSS: false })
  expect(css).toContain('.fg\\:blue')
  expect(css).not.toContain('@layer reset')
}))

/**
 * Guards #250 for entries whose graph is not hoisted, such as a Vue style block: an `@layer` block
 * written before `@import "@stet-css/core"` holds rules, not just a layer name, so only statements
 * may leave the entry's source. Taking the block too made `.r` vanish from the CSS.
 * Reverse check: treating `@layer` blocks as statements in `findCSSLayerStatements` reds only this test.
 */
test('static extraction keeps an @layer block written before @stet-css/core in a Vue style block', () => withFiles({
  'index.html': '<div class="r fg:blue"></div>'
}, async (root) => {
  const css = await extractEntries(root, {
    'App.vue?vue&type=style&index=0&lang.css': '@layer reset { .r { color: green } }\n@import "@stet-css/core";'
  })
  expect(css).toMatch(/\.r\s*\{\s*color:\s*green/)
}))

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
