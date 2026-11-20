import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { describe, expect, it } from 'vitest'
import { readBuiltCSS, runFixtureScript } from './helpers/next-build'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/css-module-compose')

/** The `class` the pre-rendered page gives the element with this `id`. */
function readPrerenderedClass(id: string) {
  const html = readFileSync(join(fixtureDir, '.next/server/app/index.html'), 'utf-8')
  return new RegExp(`id="${id}" class="([^"]*)"`).exec(html)?.[1]
}

/**
 * Guards #244: CSS Modules whose `@compose` references theme variables that only they use.
 * Turbopack shipped them as global CSS, so `styles.qa` was undefined; webpack rejected the
 * emitted `:root` rule (`Selector ":root" is not pure`). The modules must export hashed class
 * names, and the page must render the theme variable and the class trigger's dark variables,
 * including a Sass module's, which Next compiles with `style: compressed` in production.
 * Reverse check: renaming the Turbopack CSS Module rule's output `*.css` turns the Turbopack
 * case red; passing `cssModule: false` from the style loader turns both red (webpack rejects
 * the `:root` rule, Turbopack renames the `.dark` trigger); marking the generated rules with
 * a `cssmodules-pure-ignore` comment instead of a local class turns the webpack case red
 * (`Selector ":global(.dark)" is not pure` once Sass drops the comment).
 */
describe('CSS Module @compose e2e', () => {
  it.each([
    ['Turbopack', 'build'],
    ['webpack', 'build:webpack']
  ])('%s exports hashed classes that render the composed theme variables', async (_, script) => {
    runFixtureScript(fixtureDir, script)

    const qaClass = readPrerenderedClass('qa')
    const modeClass = readPrerenderedClass('mode')
    const sassClass = readPrerenderedClass('sass-dark')
    expect(qaClass).toMatch(/qa/)
    expect(qaClass).not.toBe('qa')
    expect(modeClass).toMatch(/mode/)
    expect(modeClass).not.toBe('mode')
    expect(sassClass).toMatch(/qa-sass/)
    expect(sassClass).not.toBe('qa-sass')

    const css = readBuiltCSS(join(fixtureDir, '.next/static'))
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.setContent([
        `<style>${css}</style>`,
        `<div id="qa" class="${qaClass}">Theme variable</div>`,
        `<div class="dark"><div id="mode" class="${modeClass}">Dark mode variable</div>`,
        `<div id="sass-dark" class="${sassClass}">Sass dark-only variable</div></div>`
      ].join(''))
      const color = (selector: string) => page.$eval(selector, (element) => getComputedStyle(element).color)

      expect(await color('#qa')).toBe('rgb(18, 52, 86)')
      expect(await color('#mode')).toBe('rgb(171, 205, 239)')
      expect(await color('#sass-dark')).toBe('rgb(19, 87, 155)')
    } finally {
      await browser.close()
    }
  })
})
