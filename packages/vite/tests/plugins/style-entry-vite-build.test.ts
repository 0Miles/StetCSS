import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import masterCSS from '../../src/core'
import { buildProject } from '../plugin-test-helper'

function expectMasterBaseCSS(css: string) {
  expect(css).toContain('@layer base')
  expect(css).toMatch(/text-rendering:\s*geometricprecision/)
  expect(css).toMatch(/font-family:\s*var\(--font-family-sans\)/)
}

describe('StyleEntryPlugin Vite build integration', () => {
  test('keeps package imports legal when @stet-css/core appears first in the import block', async () => {
    const { css } = await buildProject({
      appClass: 'block',
      plugins: [
        masterCSS()
      ],
      prefix: 'master-css-vite-import-order-',
      styleCSS: [
        '@import "@stet-css/core";',
        '@import "fake-font/index.css";',
        '',
        ':root { --native-color: red; }'
      ].join('\n'),
      setup(root) {
        mkdirSync(join(root, 'node_modules/fake-font'), { recursive: true })
        writeFileSync(join(root, 'node_modules/fake-font/package.json'), JSON.stringify({
          name: 'fake-font',
          version: '1.0.0'
        }))
        writeFileSync(join(root, 'node_modules/fake-font/index.css'), '.fake-font{font-family:Fake;}')
      }
    })

    expect(css).toContain('.fake-font')
    expect(css).toContain('.block{display:block}')
    expect(css.indexOf('.fake-font')).toBeLessThan(css.indexOf('.block{display:block}'))
    expect(css).not.toContain('#master-css-slot')
    expect(css).not.toContain('@stet-css/core')
  })

  test('emits preset base CSS for the root Master CSS import', async () => {
    const { css } = await buildProject({
      appClass: 'block',
      plugins: [
        masterCSS()
      ],
      styleCSS: [
        '@import "@stet-css/core";',
        '',
        'body { margin: 0; }'
      ].join('\n')
    })

    expectMasterBaseCSS(css)
    expect(css).toContain('.block{display:block}')
    expect(css).not.toContain('@stet-css/core')
    expect(css).not.toContain('#master-css-slot')
  })

  /**
   * Guards the explicit `@stet-css/core/base.css` subpath import: Vite must expand it into the
   * preset base CSS, not ship the import.
   */
  test('lets Vite expand the explicit base.css subpath import', async () => {
    const { css } = await buildProject({
      plugins: [
        masterCSS()
      ],
      styleCSS: [
        '@import "@stet-css/core/base.css";',
        '',
        'body { margin: 0; }'
      ].join('\n')
    })

    expectMasterBaseCSS(css)
    expect(css).toMatch(/body\s*\{\s*margin:\s*0/)
    expect(css).not.toContain('@stet-css/core/base.css')
    expect(css).not.toContain('#master-css-slot')
  })

  /**
   * Guards templates that only a server build compiles, such as Astro pages: the SSR build
   * must emit their rules from the project's files. This passed before the module scan was
   * removed too, because the stylesheet already added the project's class set on top; it
   * now pins that the SSR build gets the class set with no module scan at all.
   * Reverse check: dropping `.ts` from the project's source extensions in `@stet-css/project`
   * (and rebuilding) turns only this test red.
   */
  test('static SSR build emits rules for classes in server-only templates', async () => {
    const { css } = await buildProject({
      plugins: [masterCSS()],
      prefix: 'master-css-vite-ssr-template-',
      styleCSS: '@import "@stet-css/core";',
      build: {
        ssr: 'src/entry-server.ts',
        ssrEmitAssets: true,
        rollupOptions: { output: { assetFileNames: 'assets/[name][extname]' } }
      },
      setup(root) {
        writeFileSync(join(root, 'src/entry-server.ts'), [
          'import "./style.css"',
          'import { render } from "./template"',
          'export default render'
        ].join('\n'))
        writeFileSync(join(root, 'src/template.ts'), 'export const render = () => `<h1 class="font:heavy">Home</h1>`\n')
      }
    })

    expect(css).toContain('.font\\:heavy{font-weight:var(--font-weight-heavy)}')
    expect(css).not.toContain('#master-css-slot')
  })

  /**
   * Guards integrations that import only the generated CSS module and have no stylesheet
   * entry: without an entry the stylesheet falls back to classes from a module scan, which
   * the plugin no longer runs, so it must ask for the project's class set explicitly.
   * Reverse check: dropping `classes: []` from `src/utils/extracted-css.ts` turns this test
   * and the serve load test of the virtual CSS module in `style-entry.test.ts` red.
   */
  test('static build without a stylesheet entry emits rules for the virtual CSS module', async () => {
    const { css } = await buildProject({
      appClass: 'block',
      plugins: [masterCSS()],
      prefix: 'master-css-vite-virtual-only-',
      mainTS: 'import "virtual:master-utilities.css"\n'
    })

    expect(css).toContain('.block{display:block}')
    expect(css).not.toContain('#master-css-slot')
  })
})
