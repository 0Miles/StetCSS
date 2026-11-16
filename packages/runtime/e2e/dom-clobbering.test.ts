import { test, expect, type Page } from '@playwright/test'
import { STET_CSS_RUNTIME_STYLE_ID } from '@stet-css/schema/runtime-style'
import init, { RUNTIME_SCRIPT_URL, getRuntimeLoaderURL, routeRuntimeAssets } from './init'

/**
 * Browsers expose elements with an `id` or `name` as same-named globals (named access on
 * `window`), and `name`d `img`/`form`/`embed`/`object`/`iframe` elements as same-named
 * properties of `document` that shadow its built-in members. Page content such as CMS output
 * can therefore occupy the names the runtime reads before it loads.
 */

type ClobberingCase = { label: string, markup: string, selector: string }

/**
 * Guards: `create` reading `instances` from a page element held in the `StetCSSRuntime`
 * global (TypeError, `<html hidden>` never cleared). Reverting `register-global.ts` and the
 * `CSSRuntime.instances` reads in `core.ts` turns these 6 tests (global and module paths) red.
 */
const WINDOW_GUARD_CASES: ClobberingCase[] = [
  { label: 'an element with id="StetCSSRuntime"', markup: '<div id="StetCSSRuntime"></div>', selector: 'div[id="StetCSSRuntime"]' },
  // Two elements sharing an id make the global an HTMLCollection.
  { label: 'a pair of elements with id="StetCSSRuntime"', markup: '<div id="StetCSSRuntime"></div><div id="StetCSSRuntime"></div>', selector: 'div[id="StetCSSRuntime"]' },
  { label: 'a form with name="StetCSSRuntime"', markup: '<form name="StetCSSRuntime"></form>', selector: 'form[name="StetCSSRuntime"]' }
]

/**
 * AC2 confirmations, not regression guards: these 4 tests are green before the fix too
 * (`stetCSSRuntime` is only ever written as an own property; the runtime never looks
 * `#stet-css` up). Keep them as the ticket's acceptance evidence.
 */
const WINDOW_CONFIRMATION_CASES: ClobberingCase[] = [
  { label: 'an element with id="stetCSSRuntime"', markup: '<div id="stetCSSRuntime"></div>', selector: 'div[id="stetCSSRuntime"]' },
  { label: `an element with id="${STET_CSS_RUNTIME_STYLE_ID}"`, markup: `<div id="${STET_CSS_RUNTIME_STYLE_ID}"></div>`, selector: `div[id="${STET_CSS_RUNTIME_STYLE_ID}"]` }
]

/**
 * Guards: the runtime reading a `document` member that a `name`d `<img>` shadows, which stops
 * startup. Reading these members through `document` instead of `Document.prototype`
 * (`src/document.ts`) turns 10 of these 14 tests red. `nodeType` and `head` stay green then:
 * the reverted `isDocumentRoot` does not read `nodeType`, and a shadowed `head` does not stop
 * Firefox. They guard against a `root.nodeType` check and engines that do break on `head`.
 */
const DOCUMENT_GUARD_CASES: ClobberingCase[] = [
  'constructor',
  'nodeType',
  'documentElement',
  'head',
  'defaultView',
  'createElement',
  'querySelectorAll'
].map(name => ({
  label: `an image with name="${name}"`,
  markup: `<img name="${name}" alt="">`,
  selector: `img[name="${name}"]`
}))

function collectMessages(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => messages.push(`pageerror: ${error.message}`))
  return messages
}

async function waitForRuntime(page: Page) {
  await page.waitForFunction(() => globalThis.stetCSSRuntime?.observing === true, undefined, { timeout: 5000 })
}

async function readRuntimeState(page: Page, selector: string) {
  return page.evaluate(({ selector, styleId }) => {
    // The page's own elements may shadow `document` members, so read them from the prototype.
    const query = (selectors: string) => Document.prototype.querySelectorAll.call(document, selectors)
    const Runtime = globalThis.StetCSSRuntime
    return {
      runtimeIsClass: typeof Runtime === 'function',
      instanceOfRuntime: globalThis.stetCSSRuntime instanceof Runtime,
      registered: Runtime.instances.get(document) === globalThis.stetCSSRuntime,
      runtimeStyles: query(`style#${styleId}`).length,
      hidden: query('html')[0].hasAttribute('hidden'),
      display: getComputedStyle(query('p')[0]).display,
      // The runtime adds its own `style#stet-css`, so look the page's element up by tag.
      clobberingElementKept: query(selector).length > 0
    }
  }, { selector, styleId: STET_CSS_RUNTIME_STYLE_ID })
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

for (const { label, markup, selector } of [...WINDOW_GUARD_CASES, ...WINDOW_CONFIRMATION_CASES, ...DOCUMENT_GUARD_CASES]) {
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
 * which adds a second `style#stet-css` and generates every rule twice. Giving `CSSRuntime.instances` its own
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
  const cdnRuntime = await page.evaluateHandle(() => globalThis.stetCSSRuntime)
  const reused = await page.evaluate(async ({ loaderURL, cdnRuntime }) => {
    const { startCSSRuntime } = await import(loaderURL)
    const { default: ModuleRuntime } = await import(new URL('/src/core.ts', loaderURL).href)
    return {
      separateCopy: ModuleRuntime !== globalThis.StetCSSRuntime,
      sameInstance: startCSSRuntime() === cdnRuntime && globalThis.stetCSSRuntime === cdnRuntime
    }
  }, { loaderURL: await getRuntimeLoaderURL(), cdnRuntime })

  expect(reused).toEqual({ separateCopy: true, sameInstance: true })
  expect(await readRuntimeState(page, 'p')).toEqual(expectedState)
  expect(messages).toEqual([])
})

/**
 * Guards: the CDN script, loaded after a bundled import, replacing the module's
 * `StetCSSRuntime` class and starting a second runtime. Making `registerGlobal` always
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
    Runtime: globalThis.StetCSSRuntime,
    runtime: globalThis.stetCSSRuntime
  }))

  await routeRuntimeAssets(page)
  // The bundle runs `CSSRuntime.create` while it executes, so it is done once the tag loads.
  await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })

  expect(await page.evaluate(moduleState => ({
    keptClass: globalThis.StetCSSRuntime === moduleState.Runtime,
    keptInstance: globalThis.stetCSSRuntime === moduleState.runtime
  }), moduleState)).toEqual({ keptClass: true, keptInstance: true })
  expect(await readRuntimeState(page, 'p')).toEqual(expectedState)
  expect(messages).toEqual([])
})
