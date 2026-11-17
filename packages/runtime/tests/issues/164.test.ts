// https://github.com/0Miles/StetCSS/issues/164

import { test, expect, chromium, type Page } from '@playwright/test'
import init from '../../e2e/init'

/**
 * The rules the static build emits for these classes, as asserted against
 * `generateValidRules` in `packages/validator/tests/test.ts`.
 */
const staticRules = {
  'container-type:scroll-state': '.container-type\\:scroll-state{container-type:scroll-state}',
  'background-image:image-set(url(a.png))': '.background-image\\:image-set\\(url\\(a\\.png\\)\\){background-image:image-set(url(a.png))}',
  'height:calc-size(auto,size)': '.height\\:calc-size\\(auto\\,size\\){height:calc-size(auto,size)}'
}

async function runtimeRules(page: Page) {
  await page.evaluate((classNames) => {
    document.body.innerHTML = classNames.map((className) => `<div class="${className}"></div>`).join('')
  }, Object.keys(staticRules))
  await init(page)
  const text = await page.evaluate(() => globalThis.stetCSSRuntime.text)
  return Object.fromEntries(Object.entries(staticRules).map(([className, rule]) => [className, text.includes(rule)]))
}

/**
 * Prevents #164 from coming back as a static/runtime split: the static build
 * dropped these native declarations because css-tree rejects them, while the
 * CDN runtime, which asks the browser's `CSS.supports`, emitted them. In
 * Chromium, which supports all three, the runtime must emit exactly the rule
 * text the static build emits. Firefox (the suite's browser) lacks
 * `scroll-state` and `calc-size()`, so its runtime correctly emits only the
 * `image-set()` rule; the runtime follows the browser by design.
 * Trade-off: launches Chromium inside the Firefox project, the only browser
 * that supports all three; the static side is the validator test's literal,
 * since the runtime package does not depend on the validator.
 * Reverse-checked: changing the runtime's matcher to reject `calc-size(`
 * values reds the Chromium assertion only.
 */
test('164', async ({ page }) => {
  expect(await runtimeRules(page)).toEqual({
    'container-type:scroll-state': false,
    'background-image:image-set(url(a.png))': true,
    'height:calc-size(auto,size)': false
  })

  const browser = await chromium.launch()
  try {
    expect(await runtimeRules(await browser.newPage())).toEqual({
      'container-type:scroll-state': true,
      'background-image:image-set(url(a.png))': true,
      'height:calc-size(auto,size)': true
    })
  } finally {
    await browser.close()
  }
})
