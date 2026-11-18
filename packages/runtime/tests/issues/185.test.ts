// https://github.com/0Miles/StetCSS/issues/185

import { test, expect, type Page } from '@playwright/test'
import init from '../../e2e/init'

/** `--color-brand` reaches `--color-base` only through the inline `--color-alias`, as `@theme inline` compiles it. */
function createInlineChainVariables(brandOptions: { static?: true } = {}) {
  return [
    { name: 'color-base', key: 'base', namespace: 'color', type: 'string' as const, value: 'red' },
    { name: 'color-alias', key: 'alias', namespace: 'color', type: 'string' as const, value: 'var(--color-base)', dependencies: ['color-base'], inline: true },
    { name: 'color-brand', key: 'brand', namespace: 'color', type: 'string' as const, value: 'var(--color-alias)', dependencies: ['color-alias'], ...brandOptions }
  ]
}

async function getThemeState(page: Page) {
  return page.evaluate(() => ({
    text: globalThis.stetCSSRuntime.themeLayer.text,
    counts: Object.fromEntries(globalThis.stetCSSRuntime.themeLayer.tokenCounts),
    color: getComputedStyle(document.getElementById('brand')!).color
  }))
}

async function setBrandClass(page: Page, present: boolean) {
  await page.evaluate((present) => {
    document.getElementById('brand')!.className = present ? 'fg:brand' : ''
  }, present)
  if (present) {
    await page.waitForFunction(() => globalThis.stetCSSRuntime.classUtilities.has('fg:brand'))
    return
  }
  // A removed class is queued for two frames, then retained until cleanup; flush both, as e2e/variables.test.ts does.
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }))
  await page.evaluate(() => globalThis.stetCSSRuntime.flushRetainedClassRules())
  expect(await page.evaluate(() => globalThis.stetCSSRuntime.classUtilities.has('fg:brand'))).toBe(false)
}

const themeText = '@layer theme{:root{--color-brand:var(--color-base);--color-base:red}}'

/**
 * Prevents #185 in the browser: a theme token reached only through an inline variable is never
 * inserted, so `fg:brand` resolves to `var(--color-base)` with nothing behind it and the text
 * keeps its inherited colour. The runtime's class insertion and deletion must emit and remove
 * the token behind the inline variable together with the variable that references it.
 * Reverse-checked: restoring the early return on `variable.inline` in the runtime's
 * `insertVariables` reds this test (no `--color-base`).
 */
test('185: class insertion emits a token reached through an inline variable', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = '<p id="brand"></p>'
  })
  await init(page, { variables: createInlineChainVariables() })

  await setBrandClass(page, true)
  expect(await getThemeState(page)).toEqual({ text: themeText, counts: { 'color-brand': 1, 'color-base': 1 }, color: 'rgb(255, 0, 0)' })

  await setBrandClass(page, false)
  expect(await getThemeState(page)).toMatchObject({ text: '', counts: {} })
})

/**
 * Prevents #185's half fix: static initialization emits the token behind the inline variable,
 * but if class insertion does not count it while class deletion walks through the inline
 * variable, removing the last `fg:brand` deletes the static `--color-base` and leaves
 * `--color-brand` dangling.
 * Reverse-checked: restoring the early return on `variable.inline` in the runtime's
 * `insertVariables` reds this test (`--color-base` is not counted when the class is added, so
 * removing the class deletes it).
 */
test('185: removing a class keeps a static token reached through an inline variable', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = '<p id="brand"></p>'
  })
  await init(page, { variables: createInlineChainVariables({ static: true }) })
  expect(await getThemeState(page)).toEqual({ text: themeText, counts: { 'color-brand': 1, 'color-base': 1 }, color: 'rgb(0, 0, 0)' })

  await setBrandClass(page, true)
  expect(await getThemeState(page)).toEqual({ text: themeText, counts: { 'color-brand': 2, 'color-base': 2 }, color: 'rgb(255, 0, 0)' })

  await setBrandClass(page, false)
  expect(await getThemeState(page)).toEqual({ text: themeText, counts: { 'color-brand': 1, 'color-base': 1 }, color: 'rgb(0, 0, 0)' })
})
