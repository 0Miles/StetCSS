import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import masterCSS from '../src'

let root: string
let html: string
let css: string

beforeAll(async () => {
  const tmpRoot = join(process.cwd(), 'tmp')
  mkdirSync(tmpRoot, { recursive: true })
  root = mkdtempSync(join(tmpRoot, 'master-css-vite-default-options-'))
  mkdirSync(join(root, 'src'), { recursive: true })
  writeFileSync(join(root, 'index.html'), [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head><link rel="stylesheet" href="/src/style.css" /></head>',
    '<body><h1 class="block">Hello World</h1></body>',
    '</html>'
  ].join('\n'))
  writeFileSync(join(root, 'src/style.css'), '@import "@stet-css/core";\n')

  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [masterCSS()],
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  })

  html = readFileSync(join(root, 'dist/index.html'), 'utf8')
  const assetsDir = join(root, 'dist/assets')
  css = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
    .join('\n')
}, 30000)

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true })
})

describe('masterCSS() without options', () => {
  /**
   * Guards: a Vite project that registers `masterCSS()` with no options gets the rules for the
   * classes in its source in the built CSS. If the default fell back to a mode that leaves rule
   * generation to the browser, the stylesheet would ship without utilities and the page would
   * render unstyled wherever the runtime is not loaded.
   *
   * Reverse check: setting the default `mode` in `src/options.ts` to `null` fails only this test;
   * setting it back to `'runtime'` fails this test and the HTML test below.
   */
  test('builds CSS that contains the rules for classes in the source', () => {
    expect(css).toContain('.block{display:block}')
  })

  /**
   * Guards: the built page of a project with no options is plain HTML plus CSS. If the default
   * injected the runtime, the page would gain a script the project never wrote and `<html hidden>`,
   * so it stays blank until that script runs, and forever with JavaScript off.
   *
   * Reverse check: registering the runtime injection plugins, or the avoid-FOUC plugin, for the
   * `'static'` case in `src/core.ts` fails only this test.
   */
  test('builds HTML without a runtime script or a hidden root', () => {
    expect(html).not.toMatch(/<script\b/)
    expect(html).not.toMatch(/<html\b[^>]*\bhidden\b/)
  })
})
