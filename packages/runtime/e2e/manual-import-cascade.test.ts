import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { MasterCSS } from '@stet-css/core'
import init, { createRuntimeProjectManifest, getRuntimeLoaderURL } from './init'

/**
 * The README's claims about importing the runtime by hand:
 * - Beside the static CSS a build emitted, the runtime generates the same rules again in its own
 *   `style#master-css`, appended after them. The page looks the same, because `base.css` declares the
 *   layer order first and both copies sit in the same layer.
 * - Inside a shadow root nothing declares the order, so the runtime keeps its layer blocks in that order itself.
 */
const require = createRequire(import.meta.url)
const baseCSS = readFileSync(require.resolve('@stet-css/preset/base.css'), 'utf8')
const manifestInput = {
  utilities: [{ name: 'btn', layer: 'components' as const, declarations: { color: 'rgb(0, 0, 255)' } }]
}
const RED = 'rgb(255, 0, 0)'
const BLUE = 'rgb(0, 0, 255)'
const GREEN = 'rgb(0, 128, 0)'

/** The rules a build emits for these classes; static rendering writes the same engine output. */
function renderStaticCSS(...classNames: string[]) {
  return MasterCSS.create({ manifest: createRuntimeProjectManifest(manifestInput) })
    .ensureClassRules(...classNames)
    .text
}

function waitForRuntimeRuleFlush(page: Page) {
  return page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
}

async function startStaticPage(page: Page, layerStatement: string) {
  await page.setContent(`
    <!doctype html>
    <html>
    <head>
      <style>${layerStatement}</style>
      <style id="static">${renderStaticCSS('btn', 'color:#f00')}</style>
      <style>.author { color: ${GREEN} }</style>
    </head>
    <body>
      <p id="mixed" class="btn color:#f00"></p>
      <p id="author" class="author color:#f00"></p>
    </body>
    </html>
  `)
  await init(page, manifestInput)
}

function readStaticPage(page: Page) {
  return page.evaluate(() => {
    const colorOf = (id: string) => getComputedStyle(document.getElementById(id)!).color
    const runtimeRules = Array.from(document.querySelector<HTMLStyleElement>('style#master-css')!.sheet!.cssRules)
    return {
      mixed: colorOf('mixed'),
      author: colorOf('author'),
      runtimeLayers: runtimeRules.map((rule) => rule instanceof CSSLayerBlockRule ? rule.name : rule.cssText),
      runtimeSelectors: runtimeRules.flatMap((rule) => rule instanceof CSSLayerBlockRule
        ? Array.from(rule.cssRules).map((child) => (child as CSSStyleRule).selectorText)
        : [])
    }
  })
}

test('the runtime regenerates static rules without changing the cascade base.css declares', async ({ page }) => {
  await startStaticPage(page, baseCSS)

  expect(await readStaticPage(page)).toEqual({
    // The runtime's `.btn` (components) comes after the static `.color:#f00` (utilities); the layer order still ranks the utility first.
    mixed: RED,
    // Unlayered author CSS outranks every layer, also the runtime sheet that comes after it.
    author: GREEN,
    // The same two rules the static sheet holds, in the layers base.css declared, with no `@layer` statement of its own.
    runtimeLayers: ['components', 'utilities'],
    runtimeSelectors: ['.btn', '.color\\:\\#f00']
  })
})

test('reverse check: the declared layer order, not source order, decides the static page', async ({ page }) => {
  await startStaticPage(page, '@layer theme, base, defaults, utilities, components;')

  expect((await readStaticPage(page)).mixed).toBe(BLUE)
})

for (const rootKind of ['shadow root', 'document without base.css'] as const) {
  test(`a ${rootKind} keeps runtime layer blocks in layer order when a component follows a utility`, async ({ page }) => {
    await page.setContent('<!doctype html><html><head></head><body></body></html>')
    const manifest = createRuntimeProjectManifest(manifestInput)
    await page.evaluate(async ({ loaderURL, manifest, inShadowRoot }) => {
      let root: Document | ShadowRoot = document
      if (inShadowRoot) {
        const host = document.createElement('div')
        root = host.attachShadow({ mode: 'open' })
        document.body.append(host)
      }
      const container = inShadowRoot ? root as ShadowRoot : document.body
      container.innerHTML = '<p class="color:#f00"></p>'
      const { startCSSRuntime } = await import(loaderURL)
      startCSSRuntime({ manifest, root })
      // Used after the utility, so the components and theme blocks are created later.
      container.append(
        Object.assign(document.createElement('p'), { id: 'mixed', className: 'btn color:#f00' }),
        Object.assign(document.createElement('p'), { className: 'bg:red' })
      )
    }, { loaderURL: await getRuntimeLoaderURL(), manifest, inShadowRoot: rootKind === 'shadow root' })
    await waitForRuntimeRuleFlush(page)

    const result = await page.evaluate(() => {
      const root: Document | ShadowRoot = document.querySelector('div')?.shadowRoot || document
      const mixed = root.getElementById('mixed')!
      const sheet = root.querySelector<HTMLStyleElement>('style#master-css')!.sheet!
      return {
        mixed: getComputedStyle(mixed).color,
        layers: Array.from(sheet.cssRules).flatMap((rule) => rule instanceof CSSLayerBlockRule ? [rule.name] : [])
      }
    })
    expect(result).toEqual({
      mixed: RED,
      layers: ['theme', 'components', 'utilities']
    })
  })
}
