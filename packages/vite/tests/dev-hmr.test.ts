import { afterEach, describe, expect, it } from 'vitest'
import { chromium, type Browser } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import stetCSS from '../src'

let server: ViteDevServer | undefined
let browser: Browser | undefined
let fixtureDir: string | undefined
const fixtureRoot = path.resolve(__dirname, '../tmp')

function writeStyle(root: string, displayClass: string) {
  writeFileSync(path.join(root, 'app.css'), [
    '@import "@stet-css/core";',
    '@components {',
    '    probe {',
    `        @compose ${displayClass};`,
    '        width: 4px;',
    '        height: 4px;',
    '    }',
    '}'
  ].join('\n'))
}

/**
 * A dev server whose CSS entry is imported from `src/main.ts` and whose only
 * template, `src/pages/index.astro`, no module imports.
 */
async function startStaticTemplateServer(prefix: string) {
  mkdirSync(fixtureRoot, { recursive: true })
  fixtureDir = mkdtempSync(path.join(fixtureRoot, prefix))
  mkdirSync(path.join(fixtureDir, 'src/pages'), { recursive: true })
  writeFileSync(path.join(fixtureDir, 'index.html'), '<script type="module" src="/src/main.ts"></script>')
  writeFileSync(path.join(fixtureDir, 'src/main.ts'), 'import "./style.css"')
  writeFileSync(path.join(fixtureDir, 'src/style.css'), '@import "@stet-css/core";')
  const page = path.join(fixtureDir, 'src/pages/index.astro')
  writeFileSync(page, '<h1 class="font:heavy">Home</h1>')

  server = await createServer({
    root: fixtureDir,
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0
    },
    plugins: stetCSS()
  })
  await server.listen()
  const url = server.resolvedUrls?.local[0]
  if (!url) throw new Error('Expected Vite dev server URL.')
  return { page, url }
}

afterEach(async () => {
  await browser?.close()
  await server?.close()
  browser = undefined
  server = undefined
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('Vite dev HMR', () => {
  /**
   * Guards editing the stylesheet entry in dev: the page must pick up the new rules through
   * HMR, keep its state, and keep updating after an edit that fails to compile. The entry also
   * feeds `virtual:stet-css-manifest`, whose hot update used to return only the manifest
   * module, so the page kept the old CSS until a reload.
   * Reverse check: dropping `...changedModules` from the list `manifest-virtual-module.ts`
   * returns turns this test and its unit test red.
   */
  it('updates entry CSS without full reload and recovers after invalid CSS', async () => {
    mkdirSync(fixtureRoot, { recursive: true })
    fixtureDir = mkdtempSync(path.join(fixtureRoot, 'dev-hmr-'))
    mkdirSync(fixtureDir, { recursive: true })
    writeFileSync(path.join(fixtureDir, 'index.html'), [
      '<!doctype html>',
      '<html>',
      '<head><title>StetCSS Vite HMR</title></head>',
      '<body><div id="probe" class="probe"></div><script type="module" src="/main.ts"></script></body>',
      '</html>'
    ].join(''))
    writeFileSync(path.join(fixtureDir, 'main.ts'), 'import "./app.css"')
    writeStyle(fixtureDir, 'inline-flex')

    server = await createServer({
      root: fixtureDir,
      logLevel: 'silent',
      server: {
        host: '127.0.0.1',
        port: 0
      },
      plugins: stetCSS()
    })
    await server.listen()
    const wsEvents: unknown[] = []
    const originalSend = server.ws.send.bind(server.ws)
    server.ws.send = ((payload: unknown, ...args: unknown[]) => {
      wsEvents.push(payload)
      return originalSend(payload as never, ...args as never[])
    }) as typeof server.ws.send
    const url = server.resolvedUrls?.local[0]
    if (!url) throw new Error('Expected Vite dev server URL.')

    browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'inline-flex')
    await page.evaluate(() => {
      (window as Window & { __STET_CSS_HMR_MARKER?: string }).__STET_CSS_HMR_MARKER = 'preserve'
    })

    writeStyle(fixtureDir, 'flex')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'flex')
    expect(wsEvents).not.toContainEqual(expect.objectContaining({ type: 'full-reload' }))
    expect(await page.evaluate(() => (window as Window & { __STET_CSS_HMR_MARKER?: string }).__STET_CSS_HMR_MARKER))
      .toBe('preserve')

    writeStyle(fixtureDir, 'bg:neutral-120')
    await page.waitForTimeout(300)
    writeStyle(fixtureDir, 'block')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'block')
    expect(wsEvents).not.toContainEqual(expect.objectContaining({ type: 'full-reload' }))
    expect(await page.evaluate(() => (window as Window & { __STET_CSS_HMR_MARKER?: string }).__STET_CSS_HMR_MARKER))
      .toBe('preserve')
  })

  /**
   * Guards dev mode for templates no client module imports, such as Astro pages: their
   * classes must be styled on the first request and after an edit. The module scan this
   * replaced only saw modules the browser requested, so an Astro page's classes never
   * reached the dev CSS.
   * Reverse check: returning early from the watcher handler in `style-entry-hmr.ts` turns
   * only this test red.
   */
  it('styles and updates classes from a template no module imports', async () => {
    const { page, url } = await startStaticTemplateServer('static-template-')
    const fetchCSS = async () => (await fetch(new URL('src/style.css?direct', url))).text()

    expect(await fetchCSS()).toContain('.font\\:heavy')

    writeFileSync(page, '<h1 class="font:heavy">Home</h1><p class="italic">Intro</p>')
    await expect.poll(fetchCSS, { timeout: 5000 }).toContain('.italic')
  })

  /**
   * Guards the CSS a framework inlines into server-rendered dev HTML. Astro, SvelteKit and
   * Nuxt take it from the server environment's copy of the stylesheet entry. Once a browser
   * had requested the client copy, a class added to a template only refreshed the client
   * copy, so every page load painted without the new rule until the Vite client ran, and
   * never got it with JavaScript off.
   * Reverse check: removing the per-environment invalidation in `style-entry-hmr.ts` turns
   * only this test red.
   */
  it('refreshes the server environment CSS after a template gains a class', async () => {
    const { page, url } = await startStaticTemplateServer('static-ssr-')
    const devServer = server!
    const serverCSS = async () => (await devServer.environments.ssr.transformRequest('/src/style.css?inline'))?.code ?? ''

    // A browser loads the client copy of the entry, as the Vite client does on every page.
    expect(await (await fetch(new URL('src/style.css?inline', url))).text()).toContain('font\\\\:heavy')
    expect(await serverCSS()).toContain('font\\\\:heavy')

    writeFileSync(page, '<h1 class="font:heavy">Home</h1><p class="italic">Intro</p>')
    await expect.poll(serverCSS, { timeout: 5000 }).toContain('.italic')
  })
})
