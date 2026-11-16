/**
 * Regression tests for the update queue in StyleEntryHMRPlugin.
 *
 * The `change` listener attached to the scanner used to be
 * `() => servers.forEach(...)` with no await. EventEmitter does not await
 * async listeners, so two changes in quick succession reloaded the managed
 * stylesheets concurrently. Updates now chain onto one Promise queue.
 *
 * These tests drive the plugin against a hand-rolled scanner +
 * ViteDevServer pair so each guarantee can be checked individually.
 */
import { afterEach, describe, test, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import StyleEntryHMRPlugin from '../../src/plugins/style-entry-hmr'
import StyleEntryPlugin from '../../src/plugins/style-entry'
import getExtractedCSS from '../../src/utils/extracted-css'
import { createProjectContext, removeProjects } from '../plugin-test-helper'

function makeScanner() {
  const scanner = new EventEmitter() as unknown as Record<string, unknown> & EventEmitter
  scanner.css = { text: '/* css */' }
  scanner.options = {}
  return scanner as any
}

function makeServer() {
  return {
    watcher: new EventEmitter(),
    moduleGraph: {
      getModuleById: () => null,
    },
    reloadModule: vi.fn(),
    ws: { send: vi.fn() },
  }
}

async function tick(times = 1) {
  for (let i = 0; i < times; i++) await new Promise((r) => setImmediate(r))
}

describe('StyleEntryHMRPlugin update queue', () => {
  test('a second change is queued behind the first — no overlap', async () => {
    const scanner = makeScanner()
    // Wire CSS-importer update observability via reloadModule.
    const server = makeServer()
    const cssModule = { file: '/style.css' }
    let releaseFirstReload!: () => void
    const firstReload = new Promise<void>((r) => { releaseFirstReload = r })
    const reloadSpy = vi.fn()
      .mockImplementationOnce(() => firstReload) // returns the unresolved promise as-is
      .mockImplementationOnce(() => Promise.resolve())
    server.reloadModule = reloadSpy
    ;(server.moduleGraph as any).getModuleById = (id: string) => id === '/style.css' ? cssModule : null

    const plugin = StyleEntryHMRPlugin({} as any, {
      scanner,
      virtualCSSImporters: new Set(['/style.css'])
    } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('change')
    scanner.emit('change')

    // First reloadModule called; second deferred behind the first's promise
    await tick(2)
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    releaseFirstReload?.()
    await tick(5)
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })

  test('reloads CSS files that import Master CSS', async () => {
    const scanner = makeScanner()
    const cssModule = { file: '/style.css' }
    const server = makeServer()
    ;(server.moduleGraph as any).getModuleById = (id: string) => id === '/style.css' ? cssModule : null

    const plugin = StyleEntryHMRPlugin({} as any, {
      scanner,
      virtualCSSImporters: new Set(['/style.css']),
    } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('change')
    await tick(5)

    expect(server.reloadModule).toHaveBeenCalledWith(cssModule)
  })

  /**
   * Guards the queue's error handling: one failed reload must not stop every later CSS
   * update for the rest of the dev session.
   * Reverse check: dropping `.catch(onError(label))` in `queueUpdate` turns only this test red.
   */
  test('an error in one update does not poison the queue', async () => {
    const scanner = makeScanner()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const server = makeServer()
    const cssModule = { file: '/style.css' }
    server.reloadModule = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error('boom')))
      .mockImplementationOnce(() => Promise.resolve())
    ;(server.moduleGraph as any).getModuleById = (id: string) => id === '/style.css' ? cssModule : null

    const plugin = StyleEntryHMRPlugin({} as any, {
      scanner,
      virtualCSSImporters: new Set(['/style.css'])
    } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('change')
    await tick(3)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('hmr update'), expect.any(Error))

    scanner.emit('change')
    await tick(5)
    expect(server.reloadModule).toHaveBeenCalledTimes(2)

    consoleSpy.mockRestore()
  })
})

afterEach(removeProjects)

/**
 * A served dev project: `index.html` is a project source file, and the virtual CSS module
 * was loaded once, as the browser's first request does.
 */
async function serveProject(html: string) {
  const context = createProjectContext({ command: 'serve', html, includeGeneratedCSS: true })
  const page = join(context.config.root, 'index.html')
  await (StyleEntryPlugin({} as any, context) as any).load.call({}, '\0' + VIRTUAL_CSS_ID)
  const server = makeServer()
  const cssModule = { id: '\0' + VIRTUAL_CSS_ID }
  ;(server.moduleGraph as any).getModuleById = (id: string) => id === cssModule.id ? cssModule : null
  const plugin = StyleEntryHMRPlugin({} as any, context)
  ;(plugin as any).configureServer.call({}, server as any)
  ;(plugin as any).buildStart.call({})
  return { context, page, server, cssModule }
}

describe('StyleEntryHMRPlugin source file changes', () => {
  /**
   * Guards against reloading the stylesheet on every save: an edit that adds no class must
   * leave the CSS module alone, and an edit that adds one must reload it once.
   * Reverse check: reloading without comparing the extracted CSS in `style-entry-hmr.ts`
   * turns only this test red.
   */
  test('reloads the managed CSS only when an edit changes its output', async () => {
    const { page, server, cssModule } = await serveProject('<div class="block">Hi</div>')

    writeFileSync(page, '<div class="block">Hello</div>')
    server.watcher.emit('change', page)
    await new Promise((r) => setTimeout(r, 200))
    expect(server.reloadModule).not.toHaveBeenCalled()

    writeFileSync(page, '<div class="block italic">Hello</div>')
    server.watcher.emit('change', page)
    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(1))
    expect(server.reloadModule).toHaveBeenCalledWith(cssModule)
  })

  /**
   * Guards a busy update queue: when another extraction (the emittedGlobals module, an SSR
   * transform) runs between an edit and its queued update, the client must still get the
   * new CSS. Comparing against the latest extraction instead of the CSS before the edit
   * skipped that reload.
   * Reverse check: reading the baseline inside the queued update in `style-entry-hmr.ts`
   * turns only this test red.
   */
  test('reloads after an edit even when another extraction ran while the update was queued', async () => {
    const { context, page, server } = await serveProject('<div class="block"></div>')
    let releaseFirstReload!: () => void
    server.reloadModule = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((r) => { releaseFirstReload = r }))
      .mockImplementation(() => Promise.resolve())

    writeFileSync(page, '<div class="block italic"></div>')
    server.watcher.emit('change', page)
    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(1))

    writeFileSync(page, '<div class="block italic underline"></div>')
    server.watcher.emit('change', page)
    await getExtractedCSS(context)
    releaseFirstReload()

    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(2))
  })

  /**
   * Guards bursts of file events (a checkout, save-all): they share one pending update
   * instead of extracting and reloading the stylesheet once per file.
   * Reverse check: dropping the pending-update check in `style-entry-hmr.ts` turns only this
   * test red.
   */
  test('reloads once for a burst of changes', async () => {
    const { page, server } = await serveProject('<div class="block"></div>')

    writeFileSync(page, '<div class="block italic"></div>')
    server.watcher.emit('change', page)
    server.watcher.emit('change', page)
    server.watcher.emit('add', page)
    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 200))

    expect(server.reloadModule).toHaveBeenCalledTimes(1)
  })
})

