import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { MasterCSS } from '@stet-css/core'
import init, { createRuntimeProjectManifest, getRuntimeLoaderURL } from './init'

/**
 * Guards the README's claims about importing the runtime by hand (`README.md`, "Rules generated twice" and "Layer order").
 *
 * - The static-page test guards against the runtime adopting or dropping rules the build already emitted, and
 *   against it re-emitting an `@layer` statement: it must generate the same two rules again in its own sheet, in
 *   the layers `base.css` declared. Its colour assertions read the browser's cascade on purpose (testing.md rule 6
 *   trade-off): they are the README's claim that the page looks the same, so they stay next to the CSSOM checks.
 * - The two layer-order tests guard against layer blocks landing in first-use order where nothing declares the
 *   order (a shadow root, a page without base.css), which let a component used after a utility beat it.
 *   Reverse-checked: restoring `insertRule(this.text, nativeSheet.cssRules.length)` in `src/layer.ts` and
 *   `src/theme-layer.ts` turns only these two tests red.
 */
const require = createRequire(import.meta.url)
const baseCSS = readFileSync(require.resolve('@stet-css/preset/base.css'), 'utf8')
const manifestInput = {
  utilities: [{ name: 'btn', layer: 'components' as const, declarations: { color: 'rgb(0, 0, 255)' } }]
}
const RED = 'rgb(255, 0, 0)'
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

async function startStaticPage(page: Page) {
  await page.setContent(`
    <!doctype html>
    <html>
    <head>
      <style>${baseCSS}</style>
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
    const runtimeRules = Array.from(document.querySelector<HTMLStyleElement>('style#stet-css')!.sheet!.cssRules)
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
  await startStaticPage(page)

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

for (const rootKind of ['shadow root', 'document without base.css'] as const) {
  test(`a ${rootKind} keeps runtime layer blocks in layer order when a component follows a utility`, async ({ page }) => {
    await page.setContent('<!doctype html><html><head></head><body></body></html>')
    const manifest = createRuntimeProjectManifest(manifestInput)
    await page.evaluate(async ({ loaderURL, manifest, inShadowRoot }) => {
      let root: Document | ShadowRoot = document
      let container: HTMLElement | ShadowRoot = document.body
      if (inShadowRoot) {
        const host = document.createElement('div')
        root = container = host.attachShadow({ mode: 'open' })
        document.body.append(host)
      }
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
      const sheet = root.querySelector<HTMLStyleElement>('style#stet-css')!.sheet!
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
