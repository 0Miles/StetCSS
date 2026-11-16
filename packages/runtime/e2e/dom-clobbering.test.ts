import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRuntimeLoaderURL } from './init'

/**
 * Browsers expose elements with an `id` as same-named globals (named access on `window`),
 * so page content such as CMS output can occupy the runtime's global names before it loads.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RUNTIME_ASSET_BASE_URL = 'http://master-css-runtime.test'
const RUNTIME_SCRIPT_URL = `${RUNTIME_ASSET_BASE_URL}/css-runtime@rc`
const DEFAULT_MANIFEST_URL = `${RUNTIME_ASSET_BASE_URL}/css-runtime@rc/default-manifest.json`
const CLOBBERING_CASES = [
  { label: 'an element with id="MasterCSSRuntime"', markup: '<div id="MasterCSSRuntime"></div>', selector: 'div[id="MasterCSSRuntime"]' },
  { label: 'an element with id="masterCSSRuntime"', markup: '<div id="masterCSSRuntime"></div>', selector: 'div[id="masterCSSRuntime"]' },
  { label: 'an element with id="master-css"', markup: '<div id="master-css"></div>', selector: 'div[id="master-css"]' },
  // Two elements sharing an id make the global an HTMLCollection.
  { label: 'two elements with id="MasterCSSRuntime"', markup: '<div id="MasterCSSRuntime"></div><div id="MasterCSSRuntime"></div>', selector: 'div[id="MasterCSSRuntime"]' },
  { label: 'a form with name="MasterCSSRuntime"', markup: '<form name="MasterCSSRuntime"></form>', selector: 'form[name="MasterCSSRuntime"]' }
]

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function routeRuntimeAssets(page: Page) {
  await page.route(RUNTIME_SCRIPT_URL, route => route.fulfill({
    contentType: 'text/javascript',
    body: readFileSync(resolve(__dirname, '../dist/global.min.js'), 'utf8')
  }))
  await page.route(DEFAULT_MANIFEST_URL, route => route.fulfill({
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: readFileSync(resolve(__dirname, '../dist/default-manifest.json'), 'utf8')
  }))
}

async function waitForRuntime(page: Page) {
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.observing === true, undefined, { timeout: 5000 })
}

async function readRuntimeState(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const target = document.querySelector('p')!
    return {
      runtimeIsClass: typeof globalThis.MasterCSSRuntime === 'function',
      instanceOfRuntime: globalThis.masterCSSRuntime instanceof globalThis.MasterCSSRuntime,
      registered: globalThis.MasterCSSRuntime.instances.get(document) === globalThis.masterCSSRuntime,
      hidden: document.documentElement.hasAttribute('hidden'),
      display: getComputedStyle(target).display,
      // The runtime adds its own `style#master-css`, so look the page's element up by tag.
      clobberingElementKept: document.querySelector(selector) !== null
    }
  }, selector)
}

const expectedState = {
  runtimeIsClass: true,
  instanceOfRuntime: true,
  registered: true,
  hidden: false,
  display: 'flex',
  clobberingElementKept: true
}

for (const { label, markup, selector } of CLOBBERING_CASES) {
  test(`global runtime starts when ${label} precedes it`, async ({ page }) => {
    const errors = collectErrors(page)
    await routeRuntimeAssets(page)
    await page.setContent(`
      <!doctype html>
      <html hidden>
      <head></head>
      <body>
        ${markup}
        <p class="display:flex"></p>
        <script src="${RUNTIME_SCRIPT_URL}"></script>
      </body>
      </html>
    `)
    await waitForRuntime(page)

    expect(await readRuntimeState(page, selector)).toEqual(expectedState)
    expect(errors).toEqual([])
  })

  test(`module runtime starts when ${label} exists before it loads`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.setContent(`
      <!doctype html>
      <html hidden>
      <head></head>
      <body>
        ${markup}
        <p class="display:flex"></p>
      </body>
      </html>
    `)
    await page.evaluate(async ({ loaderURL }) => {
      const { startCSSRuntime } = await import(loaderURL)
      startCSSRuntime()
    }, { loaderURL: await getRuntimeLoaderURL() })
    await waitForRuntime(page)

    expect(await readRuntimeState(page, selector)).toEqual(expectedState)
    expect(errors).toEqual([])
  })
}

test('global runtime keeps an already registered runtime class', async ({ page }) => {
  await routeRuntimeAssets(page)
  await page.setContent(`
    <!doctype html>
    <html>
    <head></head>
    <body><p class="display:flex"></p></body>
    </html>
  `)
  await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })
  await waitForRuntime(page)
  const registeredBefore = await page.evaluateHandle(() => globalThis.MasterCSSRuntime)
  await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })

  expect(await page.evaluate(registered => globalThis.MasterCSSRuntime === registered, registeredBefore)).toBe(true)
})
