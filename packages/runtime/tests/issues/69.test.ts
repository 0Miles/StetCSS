// https://github.com/0Miles/StetCSS/issues/69

import { test, expect } from '@playwright/test'
import init from '../../e2e/init'

/**
 * Prevents: one class naming a mode the project does not declare (`@dark` when only `sepia` is
 * declared) throwing out of the runtime's class batch, so every class after it gets no CSS and
 * part of the page stays unstyled. The runtime logs the error and keeps going, on the initial
 * render and for classes added later.
 * Reverse-checked: calling `super.ensureClassRules(...classNames)` directly again in the runtime
 * override reds this test (`fg:blue` and `fg:green` get no rules).
 */
test('69', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.evaluate(() => {
    document.body.innerHTML = '<p class="fg:red@dark"></p><p class="fg:blue"></p>'
  })
  await init(page, { modes: ['sepia'] })
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<p class="fg:red@light fg:green"></p>')
  })
  await page.waitForFunction(() => globalThis.masterCSSRuntime.classUtilities.has('fg:green'))

  const text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
  expect(text).toContain('.fg\\:blue{')
  expect(text).toContain('.fg\\:green{')
  expect(text).not.toContain('@container')
  expect(errors.some((error) => error.includes('mode "dark", which is not declared'))).toBe(true)
  expect(errors.some((error) => error.includes('mode "light", which is not declared'))).toBe(true)
})
