import { test, expect, type Page } from '@playwright/test'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@stet-css/schema/runtime-style'
import init, { DEFAULT_MANIFEST_URL, RUNTIME_SCRIPT_URL, getRuntimeLoaderURL, routeRuntimeAssets } from './init'

/**
 * Browsers expose elements with an `id` or `name` as same-named globals (named access on
 * `window`), and `name`d `img`/`form`/`embed`/`object`/`iframe` elements as same-named
 * properties of `document` that shadow its built-in members. Page content such as CMS output
 * can therefore occupy the names the runtime reads before it loads.
 */

type ClobberingCase = { label: string, markup: string, selector: string, globalOnly?: boolean }

/**
 * Guards: `create` reading `instances` from a page element held in the `MasterCSSRuntime`
 * global (TypeError, `<html hidden>` never cleared). Reverting `register-global.ts` and the
 * `CSSRuntime.instances` reads in `core.ts` turns these 6 tests (global and module paths) red.
 */
const WINDOW_GUARD_CASES: ClobberingCase[] = [
  { label: 'an element with id="MasterCSSRuntime"', markup: '<div id="MasterCSSRuntime"></div>', selector: 'div[id="MasterCSSRuntime"]' },
  // Two elements sharing an id make the global an HTMLCollection.
  { label: 'a pair of elements with id="MasterCSSRuntime"', markup: '<div id="MasterCSSRuntime"></div><div id="MasterCSSRuntime"></div>', selector: 'div[id="MasterCSSRuntime"]' },
  { label: 'a form with name="MasterCSSRuntime"', markup: '<form name="MasterCSSRuntime"></form>', selector: 'form[name="MasterCSSRuntime"]' }
]

/**
 * AC2 confirmations, not regression guards: these 4 tests are green before the fix too
 * (`masterCSSRuntime` is only ever written as an own property; the style lookup requires a
 * `<style>`). Keep them as the ticket's acceptance evidence.
 */
const WINDOW_CONFIRMATION_CASES: ClobberingCase[] = [
  { label: 'an element with id="masterCSSRuntime"', markup: '<div id="masterCSSRuntime"></div>', selector: 'div[id="masterCSSRuntime"]' },
  { label: 'an element with id="master-css"', markup: '<div id="master-css"></div>', selector: 'div[id="master-css"]' }
]

/**
 * Guards: the runtime reading a `document` member that a `name`d `<img>` shadows, which stops
 * startup. Reading these members through `document` instead of `Document.prototype`
 * (`src/document.ts`) turns 14 of these 18 tests red. `nodeType` and `head` stay green then:
 * the reverted `isDocumentRoot` does not read `nodeType`, and a shadowed `head` does not stop
 * Firefox. They guard against a `root.nodeType` check and engines that do break on `head`.
 */
const DOCUMENT_GUARD_CASES: ClobberingCase[] = [
  'getElementById',
  'constructor',
  'nodeType',
  'documentElement',
  'head',
  'defaultView',
  'createElement',
  'styleSheets',
  'querySelectorAll'
].map(name => ({
  label: `an image with name="${name}"`,
  markup: `<img name="${name}" alt="">`,
  selector: `img[name="${name}"]`
}))

/**
 * Guards: the CDN script's `document.currentScript` read, shadowed by a `name`d `<img>`, which
 * stops the CDN bundle before it creates a runtime. Reading `document.currentScript` directly
 * in `global.min.ts` turns this test red. Only the CDN bundle reads it.
 */
const CDN_GUARD_CASES: ClobberingCase[] = [
  { label: 'an image with name="currentScript"', markup: '<img name="currentScript" alt="">', selector: 'img[name="currentScript"]', globalOnly: true }
]

function collectMessages(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => messages.push(`pageerror: ${error.message}`))
  return messages
}

async function waitForRuntime(page: Page) {
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.observing === true, undefined, { timeout: 5000 })
}

async function readRuntimeState(page: Page, selector: string) {
  return page.evaluate(({ selector, styleId }) => {
    // The page's own elements may shadow `document` members, so read them from the prototype.
    const query = (selectors: string) => Document.prototype.querySelectorAll.call(document, selectors)
    const Runtime = globalThis.MasterCSSRuntime
    return {
      runtimeIsClass: typeof Runtime === 'function',
      instanceOfRuntime: globalThis.masterCSSRuntime instanceof Runtime,
      registered: Runtime.instances.get(document) === globalThis.masterCSSRuntime,
      runtimeStyles: query(`style#${styleId}`).length,
      hidden: query('html')[0].hasAttribute('hidden'),
      display: getComputedStyle(query('p')[0]).display,
      // The runtime adds its own `style#master-css`, so look the page's element up by tag.
      clobberingElementKept: query(selector).length > 0
    }
  }, { selector, styleId: MASTER_CSS_RUNTIME_STYLE_ID })
}

const expectedState = {
  runtimeIsClass: true,
  instanceOfRuntime: true,
  registered: true,
  runtimeStyles: 1,
  hidden: false,
  display: 'flex',
  clobberingElementKept: true
}

for (const { label, markup, selector, globalOnly } of [...WINDOW_GUARD_CASES, ...WINDOW_CONFIRMATION_CASES, ...DOCUMENT_GUARD_CASES, ...CDN_GUARD_CASES]) {
  test(`global runtime starts when ${label} precedes it`, async ({ page }) => {
    const messages = collectMessages(page)
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
    expect(messages).toEqual([])
  })

  if (globalOnly) continue

  test(`module runtime starts when ${label} exists before it loads`, async ({ page }) => {
    const messages = collectMessages(page)
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
    await init(page)
    await waitForRuntime(page)

    expect(await readRuntimeState(page, selector)).toEqual(expectedState)
    expect(messages).toEqual([])
  })
}

/**
 * Guards: a bundled import beside the CDN script starting a second runtime on the document,
 * which logs a hydration fallback warning, replaces the first copy's `style#master-css` and
 * leaves the first runtime writing into a detached sheet. Giving `CSSRuntime.instances` its own
 * map when another runtime class holds the global (`core.ts`) turns this test red.
 */
test('a module copy loaded after the CDN script reuses the CDN runtime', async ({ page }) => {
  const messages = collectMessages(page)
  await routeRuntimeAssets(page)
  await page.setContent(`
    <!doctype html>
    <html>
    <head></head>
    <body>
      <p class="display:flex"></p>
      <script src="${RUNTIME_SCRIPT_URL}"></script>
    </body>
    </html>
  `)
  await waitForRuntime(page)
  const cdnRuntime = await page.evaluateHandle(() => globalThis.masterCSSRuntime)
  const reused = await page.evaluate(async ({ loaderURL, cdnRuntime }) => {
    const { startCSSRuntime } = await import(loaderURL)
    const { default: ModuleRuntime } = await import(new URL('/src/core.ts', loaderURL).href)
    return {
      separateCopy: ModuleRuntime !== globalThis.MasterCSSRuntime,
      sameInstance: startCSSRuntime() === cdnRuntime && globalThis.masterCSSRuntime === cdnRuntime
    }
  }, { loaderURL: await getRuntimeLoaderURL(), cdnRuntime })

  expect(reused).toEqual({ separateCopy: true, sameInstance: true })
  expect(await readRuntimeState(page, 'p')).toEqual(expectedState)
  expect(messages).toEqual([])
})

/**
 * Guards: the CDN script, loaded after a bundled import, replacing the module's
 * `MasterCSSRuntime` class and starting a second runtime. Making `registerGlobal` always
 * overwrite the global, or giving `CSSRuntime.instances` its own map, turns this test red.
 */
test('the CDN script loaded after a module copy keeps the module runtime', async ({ page }) => {
  const messages = collectMessages(page)
  await page.setContent(`
    <!doctype html>
    <html>
    <head></head>
    <body><p class="display:flex"></p></body>
    </html>
  `)
  await init(page)
  await waitForRuntime(page)
  const moduleState = await page.evaluateHandle(() => ({
    Runtime: globalThis.MasterCSSRuntime,
    runtime: globalThis.masterCSSRuntime
  }))

  await routeRuntimeAssets(page)
  const manifestResponse = page.waitForResponse(DEFAULT_MANIFEST_URL)
  await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })
  await manifestResponse
  // Let the CDN bundle run `CSSRuntime.create` after its manifest import settles.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

  expect(await page.evaluate(moduleState => ({
    keptClass: globalThis.MasterCSSRuntime === moduleState.Runtime,
    keptInstance: globalThis.masterCSSRuntime === moduleState.runtime
  }), moduleState)).toEqual({ keptClass: true, keptInstance: true })
  expect(await readRuntimeState(page, 'p')).toEqual(expectedState)
  expect(messages).toEqual([])
})
