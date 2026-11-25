// https://github.com/0Miles/StetCSS/issues/249

import { test, expect } from '@playwright/test'
import { StetCSS } from '@stet-css/engine'
import init, { createRuntimeProjectManifest } from '../../e2e/init'

const manifestInput = {
  defaultMode: 'none',
  modeTrigger: 'class' as const,
  modes: ['a,b', 'a.b', 'a:b', 'a b'],
  variables: [
    { namespace: 'color', key: 'x', value: '#000', mode: 'a,b' },
    { namespace: 'color', key: 'x', value: '#111', mode: 'a.b' },
    { namespace: 'color', key: 'x', value: '#222', mode: 'a:b' },
    { namespace: 'color', key: 'x', value: '#333', mode: 'a b' }
  ]
}

/**
 * Prevents: a mode name going into the class selector unescaped, so the mode `a,b` inserted
 * `.a,b{…}` into the runtime's sheet, two selectors, and the mode's variables reached every `b`
 * element; `.`, `:` and a space changed the selector the same way. The runtime inserts one escaped
 * class per mode, the same text the engine generates for static CSS.
 * Reverse-checked: dropping `cssEscape` from the class case of `getModeSelectorText` in engine
 * `src/theme-layer.ts` (and rebuilding engine) reds this test.
 */
test('249', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = '<p class="fg:x"></p>'
  })
  await init(page, manifestInput)
  await page.waitForFunction(() => globalThis.stetCSSRuntime.classUtilities.has('fg:x'))

  const runtime = await page.evaluate(() => {
    const sheet = document.querySelector<HTMLStyleElement>('style#stet-css')?.sheet
    const themeRule = Array.from(sheet?.cssRules ?? []).find((rule) => rule instanceof CSSLayerBlockRule && rule.name === 'theme') as CSSLayerBlockRule | undefined
    return {
      text: globalThis.stetCSSRuntime.themeLayer.text,
      selectors: Array.from(themeRule?.cssRules ?? []).map((rule) => (rule as CSSStyleRule).selectorText)
    }
  })

  const staticCSS = StetCSS.create({ manifest: createRuntimeProjectManifest(manifestInput) })
  staticCSS.ensureClassRules('fg:x')

  expect(runtime.selectors).toEqual(['.a\\,b', '.a\\.b', '.a\\:b', '.a\\ b'])
  expect(runtime.text).toBe('@layer theme{.a\\,b{--color-x:#000}.a\\.b{--color-x:#111}.a\\:b{--color-x:#222}.a\\ b{--color-x:#333}}')
  expect(runtime.text).toBe(staticCSS.themeLayer.text)
})
