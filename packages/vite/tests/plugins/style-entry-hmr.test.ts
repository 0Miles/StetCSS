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
import { describe, test, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import StyleEntryHMRPlugin from '../../src/plugins/style-entry-hmr'

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
