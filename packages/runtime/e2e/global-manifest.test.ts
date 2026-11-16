import { test, expect, type Page } from '@playwright/test'
import { DEFAULT_MANIFEST_URL, RUNTIME_SCRIPT_URL, routeRuntimeAssets } from './init'

async function startGlobalRuntime(page: Page) {
  await routeRuntimeAssets(page)
  await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })
  await page.waitForFunction(() => !!globalThis.masterCSSRuntime?.observing)
}

test('uses split bundled preset manifest', async ({ page }) => {
  await startGlobalRuntime(page)

  expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('font-weight-bold'))).toBeDefined()
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('color-white'))).toBeDefined()
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
})

test('uses modulepreloaded default manifest', async ({ page }) => {
  let defaultManifestRequests = 0
  const consoleMessages: string[] = []

  await routeRuntimeAssets(page, {
    onDefaultManifestRequest: () => {
      defaultManifestRequests++
    }
  })
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleMessages.push(message.text())
    }
  })

  await page.setContent(`
    <!doctype html>
    <html hidden>
    <head>
      <link rel="modulepreload" as="json" crossorigin href="${DEFAULT_MANIFEST_URL}">
      <script src="${RUNTIME_SCRIPT_URL}"></script>
    </head>
    <body></body>
    </html>
  `)
  await page.waitForFunction(() => !!globalThis.masterCSSRuntime?.observing)

  expect(defaultManifestRequests).toBe(1)
  expect(consoleMessages).toEqual([])
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
})

test('ignores global manifest override', async ({ page }) => {
  const manifest = {
    version: 1,
    variables: [
      { name: 'primary', key: 'primary', type: 'string', value: '#000000' }
    ]
  } as const
  await page.evaluate(({ manifest }) => {
    (globalThis as typeof globalThis & { masterCSSManifest?: unknown }).masterCSSManifest = manifest
  }, { manifest })
  await startGlobalRuntime(page)

  expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('primary'))).toBeUndefined()
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('font-weight-bold'))).toBeDefined()
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
})
