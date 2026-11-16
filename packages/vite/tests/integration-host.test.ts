import { join } from 'node:path'
import { expect, test } from 'vitest'
import stetCSS, { type PluginHost } from '../src'
import writeFile from './write-file-helper'
import { buildProject } from './plugin-test-helper'

function write(root: string, file: string, content: string) {
  writeFile(join(root, file), content)
}

/**
 * Guards the seam framework integrations use (Nuxt: Vite's root is `srcDir`, layers live
 * elsewhere): the class set reads the host's project root instead of Vite's, plus the extra
 * project directories, minus the ignored paths.
 * Reverse check: ignoring the host in `getStylesheetSourceContext` turns this test red.
 */
test('reads the class set from the directories the integration host names', async () => {
  const host: PluginHost = {}
  const { css } = await buildProject({
    plugins: [stetCSS({}, host)],
    styleCSS: '@import "@stet-css/core";',
    setup(root) {
      write(root, 'src/vite-root-only.html', '<div class="mt:11px"></div>')
      write(root, 'project/page.html', '<div class="mt:22px"></div>')
      write(root, 'project/out/bundle.html', '<div class="mt:33px"></div>')
      write(root, 'node_modules/layer/card.html', '<div class="mt:44px"></div>')
      write(root, 'node_modules/layer/node_modules/dep/index.html', '<div class="mt:55px"></div>')
      host.projectDir = join(root, 'project')
      host.extraProjectDirs = [join(root, 'node_modules/layer')]
      host.ignorePaths = [join(root, 'project/out')]
    }
  })

  expect(css).toContain('margin-top:22px')
  expect(css).toContain('margin-top:44px')
  for (const value of ['11px', '33px', '55px']) expect(css).not.toContain(`margin-top:${value}`)
})
