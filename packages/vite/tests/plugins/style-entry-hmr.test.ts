/**
 * Tests for StyleEntryHMRPlugin: a project source file change reloads the managed CSS
 * through one Promise queue, so updates never overlap and one failure does not stop later
 * ones. They drive the plugin against a temp project and a hand-rolled ViteDevServer.
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

afterEach(removeProjects)

/**
 * A served dev project: `index.html` is a project source file, and the virtual CSS module
 * was loaded once, as the browser's first request does.
 */
async function serveProject(html: string) {
  const context = createProjectContext({ command: 'serve', html })
  const page = join(context.config.root, 'index.html')
  await (StyleEntryPlugin(context) as any).load.call({}, '\0' + VIRTUAL_CSS_ID)
  const server = makeServer()
  const cssModule = { id: '\0' + VIRTUAL_CSS_ID }
  ;(server.moduleGraph as any).getModuleById = (id: string) => id === cssModule.id ? cssModule : null
  const plugin = StyleEntryHMRPlugin(context)
  ;(plugin as any).configureServer.call({}, server as any)
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

  /**
   * Guards the update queue: a second edit must wait for the first reload to finish instead
   * of reloading the stylesheet concurrently, which let an older CSS land after a newer one.
   * Reverse check: running the update directly instead of chaining it onto `updateChain` in
   * `queueUpdate` turns this test and the burst test red.
   */
  test('a second edit is queued behind the first reload', async () => {
    const { page, server } = await serveProject('<div class="block"></div>')
    let releaseFirstReload!: () => void
    server.reloadModule = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((r) => { releaseFirstReload = r }))
      .mockImplementation(() => Promise.resolve())

    writeFileSync(page, '<div class="block italic"></div>')
    server.watcher.emit('change', page)
    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(1))

    writeFileSync(page, '<div class="block italic underline"></div>')
    server.watcher.emit('change', page)
    await new Promise((r) => setTimeout(r, 200))
    expect(server.reloadModule).toHaveBeenCalledTimes(1)

    releaseFirstReload()
    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(2))
  })

  /**
   * Guards the queue's error handling: one failed reload must not stop every later CSS
   * update for the rest of the dev session.
   * Reverse check: dropping the `.catch` in `queueUpdate` turns only this test red.
   */
  test('an error in one update does not poison the queue', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { page, server } = await serveProject('<div class="block"></div>')
    server.reloadModule = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error('boom')))
      .mockImplementation(() => Promise.resolve())

    writeFileSync(page, '<div class="block italic"></div>')
    server.watcher.emit('change', page)
    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('source update'), expect.any(Error)))

    writeFileSync(page, '<div class="block italic underline"></div>')
    server.watcher.emit('change', page)
    await vi.waitFor(() => expect(server.reloadModule).toHaveBeenCalledTimes(2))

    consoleSpy.mockRestore()
  })
})
