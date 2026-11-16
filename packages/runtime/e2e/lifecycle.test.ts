import { test, expect, type Page } from '@playwright/test'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import UtilityType from '@stet-css/schema/utility-type'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@stet-css/schema/runtime-style'
import CSSRuntime from '../src'
import init, { RUNTIME_SCRIPT_URL, getRuntimeLoaderURL, routeRuntimeAssets } from './init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function waitForRuntimeRuleFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  }))
}

test('does not expose tooling-only engine inspection helpers', async ({ page }) => {
  await init(page)
  await expect(page.evaluate(() => ({
    inspectClass: 'inspectClass' in globalThis.stetCSSRuntime,
    normalizeNumericValue: 'normalizeNumericValue' in globalThis.stetCSSRuntime
  }))).resolves.toEqual({
    inspectClass: false,
    normalizeNumericValue: false
  })
})

test('does not install the removed devtools hook global', async ({ page }) => {
  await init(page)
  await expect(page.evaluate(() => ['__MASTER', 'CSS', 'DEVTOOLS', 'HOOK__'].join('_') in globalThis)).resolves.toBe(false)
})

/**
 * Guards: `destroy()` leaving the runtime's `style#stet-css` in the page, so its rules keep
 * applying after the runtime is gone, or a second `destroy()` throwing. Dropping
 * `this.style?.remove()` from `disconnect()` in `core.ts` turns this test and two disconnect
 * tests in `edge-cases.test.ts` red.
 */
test('destroy removes its style, is safe to repeat, and a registered runtime observes again', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.classList.add('text-center')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => globalThis.stetCSSRuntime.utilitiesLayer.rules.length)).toBe(1)
  expect(await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.style?.sheet?.cssRules || [])
    .filter(cssRule => cssRule === globalThis.stetCSSRuntime.utilitiesLayer.native)
    .length
  )).toBe(1)
  expect(await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.style?.sheet?.cssRules || []).length)).toBe(1)
  await page.evaluate(() => {
    const runtime = globalThis.stetCSSRuntime
    runtime.destroy()
    ;(globalThis as any).destroyedRuntime = runtime
  })
  expect(await page.evaluate(() => (globalThis as any).destroyedRuntime.utilitiesLayer.rules.length)).toBe(0)
  const readDestroyedState = () => page.evaluate((styleId) => ({
    style: (globalThis as any).destroyedRuntime.style,
    runtimeStyles: document.querySelectorAll(`style#${styleId}`).length,
    registered: globalThis.StetCSSRuntime.instances.has(document) || globalThis.stetCSSRuntime !== undefined
  }), MASTER_CSS_RUNTIME_STYLE_ID)
  const destroyedState = { style: null, runtimeStyles: 0, registered: false }
  expect(await readDestroyedState()).toEqual(destroyedState)
  await page.evaluate(() => (globalThis as any).destroyedRuntime.destroy())
  expect(await readDestroyedState()).toEqual(destroyedState)
  await page.evaluate(() => {
    const runtime = (globalThis as any).destroyedRuntime as typeof globalThis.stetCSSRuntime
    runtime.register().observe()
    document.body.classList.add('block')
    document.body.classList.add('font:bold')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.style?.sheet?.cssRules || []).length)).toBe(2)
})

test('prevent attach layer twice', async ({ page }) => {
  await init(page, {
    utilities: [
      {
        name: 'app-wrapper',
        type: UtilityType.Semantic,
        layer: 'components',
        rules: [
          { selector: '&', declarations: { 'margin-left': 'auto', 'margin-right': 'auto' } },
          { selector: '&', declarations: { 'padding-left': '1.25rem', 'padding-right': '1.25rem' } },
          { selector: '&', declarations: { height: '2.5rem' } }
        ]
      }
    ]
  })
  await page.evaluate(() => {
    document.body.classList.add('app-wrapper')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => globalThis.stetCSSRuntime.componentsLayer.native?.cssRules?.length)).toBe(3)
})

test('insert semantic utility with multiple native rules into existing layer', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="block multi-rule"></div>'
  })
  await init(page, {
    utilities: [
      {
        name: 'multi-rule',
        rules: [
          { selector: '&', declarations: { display: 'flex' } },
          { selector: '&:hover', declarations: { color: 'red' } },
          { selector: '&', conditions: ['@supports (appearance:none)'], declarations: { 'scrollbar-width': 'thin' } }
        ]
      }
    ]
  })
  expect(await page.evaluate(() => globalThis.stetCSSRuntime.utilitiesLayer.native?.cssRules.length)).toBe(4)
  expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('inserts functional pseudo-class selector aliases into native CSSOM', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="pb:8x:not(:last) text-center_td:not(:first)"></div>'
  })
  await init(page)

  expect(await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.utilitiesLayer.native?.cssRules || [])
    .map((cssRule) => cssRule.cssText)
  )).toEqual([
    '.text-center_td\\:not\\(\\:first\\) td:not(:first-child) { text-align: center; }',
    '.pb\\:8x\\:not\\(\\:last\\):not(:last-child) { padding-bottom: 2rem; }'
  ])
  expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('refresh clears stale native keyframes', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.classList.add('animation:fade|1s', 'animation:flash|1s')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.style!.sheet!.cssRules)
    .filter((cssRule) => cssRule.constructor.name === 'CSSKeyframesRule')
    .map((cssRule) => (cssRule as CSSKeyframesRule).name)
  )).toEqual(['fade', 'flash'])

  await page.evaluate(() => {
    globalThis.stetCSSRuntime.refresh()
  })
  expect(await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.style!.sheet!.cssRules)
    .filter((cssRule) => cssRule.constructor.name === 'CSSKeyframesRule')
    .map((cssRule) => (cssRule as CSSKeyframesRule).name)
  )).toEqual(['fade', 'flash'])
})

test('observes static theme variables and keyframes without class references', async ({ page }) => {
  await init(page, {
    variables: [
      {
        name: 'color-static',
        key: 'static',
        namespace: 'color',
        type: 'string',
        value: '#123',
        static: true
      }
    ],
    animations: {
      'static-fade': {
        to: {
          opacity: '1'
        }
      }
    },
    animationOptions: {
      'static-fade': {
        static: true
      }
    }
  })

  const cssRules = await page.evaluate(() => Array.from(globalThis.stetCSSRuntime.style!.sheet!.cssRules)
    .map((cssRule) => cssRule.cssText)
  )
  expect(cssRules.some((cssRule) => cssRule.includes('--color-static'))).toBe(true)
  expect(cssRules.some((cssRule) => cssRule.includes('@keyframes static-fade'))).toBe(true)
})

test('generates browser native declarations through CSS.supports fallback', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = [
      '<div class="float:left display:block field-sizing:content transition-behavior:allow-discrete color:oklch(63.7%|0.237|25.331)"></div>',
      '<div class="made-up:left float:banana display:banana"></div>'
    ].join('')
  })
  await init(page)

  const result = await page.evaluate(() => ({
    supports: {
      fieldSizing: CSS.supports('field-sizing', 'content'),
      transitionBehavior: CSS.supports('transition-behavior', 'allow-discrete')
    },
    classUtilities: [...globalThis.stetCSSRuntime.classUtilities.keys()],
    cssRules: Array.from(globalThis.stetCSSRuntime.utilitiesLayer.native?.cssRules || [])
      .map((cssRule) => cssRule.cssText)
  }))

  expect(result.classUtilities).toContain('float:left')
  expect(result.classUtilities).toContain('display:block')
  expect(result.classUtilities).toContain('color:oklch(63.7%|0.237|25.331)')
  expect(result.cssRules.some((cssRule) => cssRule.includes('float: left'))).toBe(true)
  expect(result.cssRules.some((cssRule) => cssRule.includes('display: block'))).toBe(true)
  expect(result.cssRules.some((cssRule) => cssRule.includes('oklch'))).toBe(true)

  if (result.supports.fieldSizing) {
    expect(result.classUtilities).toContain('field-sizing:content')
    expect(result.cssRules.some((cssRule) => cssRule.includes('field-sizing: content'))).toBe(true)
  }
  if (result.supports.transitionBehavior) {
    expect(result.classUtilities).toContain('transition-behavior:allow-discrete')
    expect(result.cssRules.some((cssRule) => cssRule.includes('transition-behavior: allow-discrete'))).toBe(true)
  }

  expect(result.classUtilities).not.toContain('made-up:left')
  expect(result.classUtilities).not.toContain('float:banana')
  expect(result.classUtilities).not.toContain('display:banana')
})

test('registers emittedGlobals counts on an existing runtime', () => {
  const root = { host: {} } as unknown as ShadowRoot
  const cssRuntime = CSSRuntime.create({ manifest: defaultManifest, root })
  const returnedCSSRuntime = CSSRuntime.create({
    manifest: defaultManifest,
    root,
    emittedGlobals: {
      variables: {
        'color-primary': 1
      },
      animations: {
        fade: 1
      }
    }
  })

  expect(returnedCSSRuntime).toBe(cssRuntime)
  expect(cssRuntime.emittedGlobals.variables).toMatchObject({ 'color-primary': 1 })
  expect(cssRuntime.emittedGlobals.animations).toMatchObject({ fade: 1 })
  expect(Object.fromEntries(cssRuntime.themeLayer.tokenCounts)).toMatchObject({ 'color-primary': 1 })
  expect(Object.fromEntries(cssRuntime.animationsNonLayer.tokenCounts)).toMatchObject({ fade: 1 })

  cssRuntime.destroy()
})

test('registers emittedGlobals counts once on a new runtime', () => {
  const root = { host: {} } as unknown as ShadowRoot
  const cssRuntime = CSSRuntime.create({
    manifest: defaultManifest,
    root,
    emittedGlobals: {
      variables: {
        'color-primary': 1
      },
      animations: {
        fade: 1
      }
    }
  })

  expect(cssRuntime.emittedGlobals.variables).toMatchObject({ 'color-primary': 1 })
  expect(cssRuntime.emittedGlobals.animations).toMatchObject({ fade: 1 })
  expect(Object.fromEntries(cssRuntime.themeLayer.tokenCounts)).toMatchObject({ 'color-primary': 1 })
  expect(Object.fromEntries(cssRuntime.animationsNonLayer.tokenCounts)).toMatchObject({ fade: 1 })

  cssRuntime.destroy()
})

/**
 * #90: a page that hides `<html>` until the runtime renders must never stay blank. The CDN
 * bundle's reveal fallback timer runs on Playwright's paused clock, so only `runFor` can fire it.
 */

function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

function readHidden(page: Page) {
  return page.evaluate(() => document.documentElement.hasAttribute('hidden'))
}

async function openHiddenCDNPage(page: Page, setup = '') {
  await page.clock.install({ time: 0 })
  await page.clock.pauseAt(1000)
  await routeRuntimeAssets(page)
  await page.setContent(`
    <!doctype html>
    <html hidden>
    <head>
      <script>${setup}</script>
      <script src="${RUNTIME_SCRIPT_URL}"></script>
    </head>
    <body><p class="display:flex"></p></body>
    </html>
  `)
}

/**
 * Guards: a CDN startup failure (here a browser without `MutationObserver`) leaving the page
 * blank, or the reveal swallowing the error. Removing the reveal from `observe()` turns it red.
 */
test('CDN: reveals the page at once and still reports the error when startup throws', async ({ page }) => {
  const errors = collectPageErrors(page)
  await openHiddenCDNPage(page, 'window.MutationObserver = undefined')

  expect(await readHidden(page)).toBe(false)
  expect(errors).toHaveLength(1)
})

/**
 * Guards: a bundled module throwing while the bundle evaluates, before the startup call
 * runs, so no try/catch around that call sees it. Here the `StetCSSRuntime` global throws
 * when core reads it. The reveal waits for the next task, so it stays hidden while the clock
 * is paused. Dropping the timer in `src/reveal-fallback.ts` turns it red.
 */
test('CDN: reveals the page when a bundled module throws while loading', async ({ page }) => {
  const errors = collectPageErrors(page)
  await openHiddenCDNPage(page, `
    Object.defineProperty(window, 'StetCSSRuntime', {
      configurable: true,
      get() { throw new Error('StetCSSRuntime is unavailable') }
    })
  `)

  expect(errors).toEqual(['StetCSSRuntime is unavailable'])
  expect(await readHidden(page)).toBe(true)
  await page.clock.runFor(1)
  expect(await readHidden(page)).toBe(false)
})

/**
 * Guards: the reveal fallback timer outliving a successful start and removing a `hidden` the
 * page sets later. Not red before #90 (no timer existed); dropping the `clearTimeout` turns it red.
 */
test('CDN: a started runtime leaves a later hidden attribute alone', async ({ page }) => {
  const errors = collectPageErrors(page)
  await openHiddenCDNPage(page)

  expect(await readHidden(page)).toBe(false)
  await page.evaluate(() => document.documentElement.setAttribute('hidden', ''))
  await page.clock.runFor(1000)
  expect(await readHidden(page)).toBe(true)
  expect(errors).toEqual([])
})

async function startHiddenModuleRuntime(page: Page, options: { manifest?: unknown, setup?: () => void } = {}) {
  await page.setContent('<!doctype html><html hidden><head></head><body></body></html>')
  if (options.setup) await page.evaluate(options.setup)
  return page.evaluate(async ({ loaderURL, manifest }) => {
    const { startCSSRuntime } = await import(loaderURL)
    try {
      startCSSRuntime({ manifest })
      return 'started'
    } catch (error) {
      return (error as Error).name
    }
  }, { loaderURL: await getRuntimeLoaderURL(), manifest: options.manifest })
}

/**
 * Guards: a manual import whose manifest the engine rejects leaving the page blank, or the
 * error not reaching the caller. Removing the reveal from `CSSRuntime.create` turns it red.
 */
test('module: create() with an invalid manifest reveals the page and rethrows', async ({ page }) => {
  expect(await startHiddenModuleRuntime(page, { manifest: { version: 2 } })).toBe('TypeError')
  expect(await readHidden(page)).toBe(false)
})

/**
 * Guards: `observe()` throwing part-way leaving the page blank, or the error not reaching the
 * caller. Removing the reveal from `observe()` turns it red.
 */
test('module: observe() that throws reveals the page and rethrows', async ({ page }) => {
  expect(await startHiddenModuleRuntime(page, {
    setup: () => { (window as { MutationObserver?: unknown }).MutationObserver = undefined }
  })).toBe('TypeError')
  expect(await readHidden(page)).toBe(false)
})
