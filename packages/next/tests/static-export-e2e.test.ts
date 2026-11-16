import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { collectFiles, readBuiltCSS, runFixtureScript } from './helpers/next-build'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/static-export')
const outDir = join(fixtureDir, 'out')

describe('static export e2e', () => {
  /**
   * Guards #57: `output: 'export'` serves every page's Server Component classes from the CSS
   * asset, with no pre-rendered `<style>`.
   * Reverse check: removing the Turbopack generated CSS rule turns it red.
   */
  it('exports the Server Component classes of every page into the CSS asset', () => {
    runFixtureScript(fixtureDir)

    const htmlFiles = collectFiles(outDir, (file) => file.endsWith('.html'))
      .map((file) => relative(outDir, file).replaceAll('\\', '/'))
    const css = readBuiltCSS(join(outDir, '_next/static'))

    expect(htmlFiles).toEqual(expect.arrayContaining(['index.html', 'nested.html']))
    expect(css).toContain('.fg\\:red{color:var(--color-red)}')
    expect(css).toContain('.font\\:40px{font-size:40px}')
    expect(css).toContain('.fg\\:blue{color:var(--color-blue)}')
    expect(css).toContain('.font\\:32px{font-size:32px}')
    expect(existsSync(join(outDir, '_next/static/stet-css'))).toBe(false)
    expect(readFileSync(join(outDir, 'index.html'), 'utf-8')).not.toContain('<style id="stet-css"')
  })
})
