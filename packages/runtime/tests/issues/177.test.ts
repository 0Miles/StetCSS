// https://github.com/0Miles/StetCSS/issues/177

import { test, expect, type Page } from '@playwright/test'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import { flattenStetCSSManifestVariables, type StetCSSManifest } from '@stet-css/schema/manifest'
import { StetCSS, type StetCSSEmittedGlobals } from '@stet-css/core'
import { createRuntimeProjectManifest, getRuntimeLoaderURL } from '../../e2e/init'

test.use({ colorScheme: 'light' })

const defaultVariables = flattenStetCSSManifestVariables((defaultManifestJSON as unknown as StetCSSManifest).variables)
const red60 = defaultVariables.find(({ name }) => name === 'color-red-60')!.value as string

interface ShadowRuntimeOptions {
  manifest?: StetCSSManifest
  emittedGlobals?: StetCSSEmittedGlobals
  /** The build's static CSS, linked in the document. */
  staticCSS?: string
  htmlClass?: string
  hostClass?: string
}

/** Starts a runtime on a fresh shadow root, then appends `html` to it, as a component renders after connecting. */
async function startShadowRuntime(page: Page, html: string, options: ShadowRuntimeOptions = {}) {
  await page.setContent(`<!doctype html><html class="${options.htmlClass || ''}"><head><style>${options.staticCSS || ''}</style></head><body></body></html>`)
  await page.evaluate(async ({ loaderURL, html, manifest, emittedGlobals, hostClass }) => {
    const host = document.createElement('div')
    host.id = 'host'
    if (hostClass) host.className = hostClass
    const root = host.attachShadow({ mode: 'open' })
    document.body.append(host)
    const { startCSSRuntime } = await import(loaderURL)
    startCSSRuntime({ manifest, root, emittedGlobals })
    // Append, as a component renders: `innerHTML` would also remove the runtime's `style#stet-css`.
    const template = document.createElement('template')
    template.innerHTML = html
    root.append(template.content)
    // Added classes are queued until the next frame.
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }, { loaderURL: await getRuntimeLoaderURL(), html, ...options })
}

function readShadow(page: Page, id: string, property: string) {
  return page.evaluate(({ id, property }) => {
    const element = document.getElementById('host')!.shadowRoot!.getElementById(id)!
    return getComputedStyle(element).getPropertyValue(property)
  }, { id, property })
}

/**
 * Prevents #177: in a shadow root the runtime wrote theme variables under `:root`, which never
 * matches inside a shadow tree, so `fg:red` kept the inherited text colour and `bg:red/.14` stayed
 * transparent. The page has no static CSS, so nothing inherits into the shadow tree either: the
 * runtime's own theme rules must reach it. The expected colours are the preset token written in
 * plain CSS on a sibling element.
 * Reverse-checked: making the runtime pass `rootSelector: ':root'` for a shadow root in `src/core.ts`
 * reds every test in this file and nothing else.
 */
test('177: theme variables resolve in a shadow root', async ({ page }) => {
  await startShadowRuntime(page, `
    <p id="fg" class="fg:red"></p>
    <p id="bg" class="bg:red/.14"></p>
    <p id="hex" class="fg:#ff0000"></p>
    <p id="fg-expected" style="color: ${red60}"></p>
    <p id="bg-expected" style="background-color: color-mix(in oklab, ${red60} 14%, transparent)"></p>
  `)

  expect(await readShadow(page, 'fg', '--color-red')).not.toBe('')
  expect(await readShadow(page, 'fg', 'color')).toBe(await readShadow(page, 'fg-expected', 'color'))
  expect(await readShadow(page, 'bg', 'background-color')).toBe(await readShadow(page, 'bg-expected', 'background-color'))
  expect(await readShadow(page, 'hex', 'color')).toBe('rgb(255, 0, 0)')
})

const GREEN = 'rgb(0, 128, 0)'
const BLUE = 'rgb(0, 0, 255)'

function createModeManifest(modeTrigger: 'class' | 'host') {
  return createRuntimeProjectManifest({
    modeTrigger,
    defaultMode: 'light',
    modes: ['light', 'dark'],
    variables: [
      { namespace: 'color', key: 'base', value: GREEN },
      { namespace: 'color', key: 'primary', dependencies: ['color-base'] },
      { namespace: 'color', key: 'primary', value: 'var(--color-base)', mode: 'light' },
      { namespace: 'color', key: 'primary', value: BLUE, mode: 'dark' }
    ]
  })
}

/**
 * Prevents #177 for the class and host mode triggers: the default mode's variables and the base
 * token they point at must reach the shadow tree, and the other mode still overrides them where its
 * trigger applies (a `.dark` element inside the tree for `class`, `.dark` on the host for `host`).
 * With `build-emitted`, the document already has the build's theme rules and the runtime is told
 * so through emitted globals: the document's `.dark` and `:host(.dark)` never match inside the
 * shadow tree, so the runtime must still emit the mode variables, and, as the README says, a mode
 * class on `<html>` does not reach the shadow tree under the class trigger.
 * Reverse-checked: making the runtime's `rootSelector` return `':root'` in `src/core.ts` reds every
 * test in this file; dropping the `rootSelector === ':host'` early return from engine
 * `isEmittedGlobalsVariable` reds only the two `build-emitted` cases. Nothing else in the runtime
 * suite goes red either way.
 */
for (const modeTrigger of ['class', 'host'] as const) {
  for (const source of ['runtime-only', 'build-emitted'] as const) {
    test(`177: ${modeTrigger} mode variables resolve in a shadow root (${source})`, async ({ page }) => {
      const manifest = createModeManifest(modeTrigger)
      const options: ShadowRuntimeOptions = source === 'build-emitted'
        ? {
            manifest,
            emittedGlobals: { variables: { 'color-primary': 1, 'color-base': 1 } },
            staticCSS: StetCSS.create({ manifest }).ensureClassRules('fg:primary').themeLayer.text
          }
        : { manifest }
      const html = '<p id="light" class="fg:primary"></p><div class="dark"><p id="dark" class="fg:primary"></p></div>'

      await startShadowRuntime(page, html, options)
      expect(await readShadow(page, 'light', 'color')).toBe(GREEN)

      if (modeTrigger === 'class') {
        expect(await readShadow(page, 'dark', 'color')).toBe(BLUE)
        await startShadowRuntime(page, html, { ...options, htmlClass: 'dark' })
        expect(await readShadow(page, 'light', 'color')).toBe(GREEN)
      } else {
        await startShadowRuntime(page, html, { ...options, hostClass: 'dark' })
        expect(await readShadow(page, 'light', 'color')).toBe(BLUE)
      }
    })
  }
}
