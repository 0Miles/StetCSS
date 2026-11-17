// https://github.com/0Miles/StetCSS/issues/164

import { test, expect, chromium, type Page } from '@playwright/test'
import init from '../../e2e/init'

/**
 * The rule the static build emits for each class. A copy, since the runtime
 * package does not depend on the validator: the static output itself is
 * guarded by `packages/validator/tests/test.ts` (`generateValidRules`) and
 * `packages/compiler/tests/native-declaration.test.ts`.
 */
const staticRules = [
  { className: 'container-type:scroll-state', property: 'container-type', value: 'scroll-state', rule: '.container-type\\:scroll-state{container-type:scroll-state}' },
  { className: 'background-image:image-set(url(a.png))', property: 'background-image', value: 'image-set(url(a.png))', rule: '.background-image\\:image-set\\(url\\(a\\.png\\)\\){background-image:image-set(url(a.png))}' },
  { className: 'height:calc-size(auto,size)', property: 'height', value: 'calc-size(auto,size)', rule: '.height\\:calc-size\\(auto\\,size\\){height:calc-size(auto,size)}' }
]

/** For each class: whether the browser supports its declaration, and whether the runtime emitted the static rule. */
async function compareWithStaticRules(page: Page) {
  await page.evaluate((classNames) => {
    document.body.innerHTML = classNames.map((className) => `<div class="${className}"></div>`).join('')
  }, staticRules.map(({ className }) => className))
  await init(page)
  return page.evaluate((rules) => {
    const text = globalThis.stetCSSRuntime.text
    return rules.map(({ className, property, value, rule }) => ({
      className,
      supported: CSS.supports(property, value),
      emitted: text.includes(rule)
    }))
  }, staticRules)
}

/**
 * Prevents #164 from coming back as a static/runtime split: the static build
 * dropped these native declarations because css-tree rejects them, while the
 * CDN runtime, which asks the browser's `CSS.supports`, emitted them. The
 * runtime must emit exactly the static rule text wherever the browser supports
 * the declaration, and nothing where it does not, as native CSS would. The
 * suite's Firefox page checks that against its own `CSS.supports`; Chromium
 * supports all three, so it must emit all three.
 * Trade-off: launches Chromium inside the Firefox project, the only installed
 * browser that supports all three.
 * Reverse-checked: changing the runtime's matcher to reject `calc-size(`
 * values reds the Chromium assertion only.
 */
test('164', async ({ page }) => {
  for (const { className, supported, emitted } of await compareWithStaticRules(page)) {
    expect(emitted, className).toBe(supported)
  }

  const browser = await chromium.launch()
  try {
    expect(await compareWithStaticRules(await browser.newPage())).toEqual(staticRules.map(({ className }) => ({
      className,
      supported: true,
      emitted: true
    })))
  } finally {
    await browser.close()
  }
})
