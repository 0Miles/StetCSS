import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { resolveCSSImportGraph } from '@stet-css/compiler'
import CSSScanner from '@stet-css/scanner'
import { createExtractedCSS, registerStyleCSSSource, resolveStyleCSSImportGraph } from '../src'

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
