import { describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import CSSScanner from '@stet-css/scanner'
import ManifestLoaderPlugin from '../../src/plugins/manifest-loader'
import { STET_CSS_MANIFEST_QUERY } from '@stet-css/integration/manifest-module'
import { fromResolvedStetCSSManifestId, toResolvedStetCSSManifestId } from '@stet-css/integration/node'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/manifest-virtual-module')

async function createContext(root = FIXTURE_DIR) {
  const context = {
    config: {
      root,
      command: 'serve',
      build: {
        ssr: false
      },
      server: {
        fs: {
          allow: []
        }
      }
    },
    scanner: new CSSScanner({}, root)
  } as any
  await context.scanner.init()
  return context
}

describe('ManifestLoaderPlugin', () => {
  it('encodes per-file CSS manifest ids without a .css suffix for Vite dev', () => {
    const file = path.join(FIXTURE_DIR, 'theme.css')
    const id = toResolvedStetCSSManifestId(file)

    expect(id).not.toContain('.css')
    expect(id).not.toContain('%2Ecss')
    expect(fromResolvedStetCSSManifestId(id)).toBe(file)
  })

  it('resolves and loads per-file CSS manifests with ?stet-css-manifest', async () => {
    const context = await createContext()
    const plugin = ManifestLoaderPlugin(context)
    const importer = path.join(FIXTURE_DIR, 'entry.ts')
    const addWatchFile = vi.fn()
    const resolve = vi.fn(async (id: string) => ({ id: path.resolve(FIXTURE_DIR, id) }))

    const resolvedId = await (plugin.resolveId as any).call(
      { resolve },
      './theme.css' + STET_CSS_MANIFEST_QUERY,
      importer
    )
    const code = await (plugin.load as any).call({ addWatchFile }, resolvedId)
    const themeComponentsPath = path.join(FIXTURE_DIR, 'styles/theme-components.css')

    expect(resolvedId).toBe(toResolvedStetCSSManifestId(path.join(FIXTURE_DIR, 'theme.css')))
    expect(addWatchFile).toHaveBeenCalledWith(path.join(FIXTURE_DIR, 'theme.css'))
    expect(addWatchFile).toHaveBeenCalledWith(themeComponentsPath)
    expect(context.config.server.fs.allow).toContain(path.join(FIXTURE_DIR, 'theme.css'))
    expect(context.config.server.fs.allow).toContain(themeComponentsPath)
    expect(code).toContain('"version":1')
    expect(code).toContain('accent')
    expect(code).toContain('#456')
    expect(code).toContain('badge')
  })

  it('keeps per-file manifest dependencies registered after invalid CSS and recovers on the next run', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-query-manifest-'))
    const manifestPath = path.join(root, 'theme.css')
    try {
      mkdirSync(root, { recursive: true })
      writeFileSync(manifestPath, [
        '@components {',
        '    card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const context = await createContext(root)
      const plugin = ManifestLoaderPlugin(context)
      const resolvedId = toResolvedStetCSSManifestId(manifestPath)
      const addWatchFile = vi.fn()

      await expect((plugin.load as any).call({ addWatchFile }, resolvedId))
        .rejects.toThrow('Invalid @compose class')
      expect(addWatchFile).toHaveBeenCalledWith(manifestPath)
      expect(context.config.server.fs.allow).toContain(manifestPath)

      writeFileSync(manifestPath, [
        '@components {',
        '    card { @compose block; }',
        '}'
      ].join('\n'))

      const code = await (plugin.load as any).call({ addWatchFile: vi.fn() }, resolvedId)

      expect(code).toContain('"card"')
      expect(code).toContain('display')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('does not resolve unresolved CSS manifest query imports to filesystem fallbacks', async () => {
    const context = await createContext()
    const plugin = ManifestLoaderPlugin(context)
    const importer = path.join(FIXTURE_DIR, 'entry.ts')
    const resolve = vi.fn(async () => null)

    const resolvedId = await (plugin.resolveId as any).call(
      { resolve },
      './missing.css' + STET_CSS_MANIFEST_QUERY,
      importer
    )

    expect(resolve).toHaveBeenCalledWith('./missing.css', importer, { skipSelf: true })
    expect(resolvedId).toBeUndefined()
  })

  it('emits per-file CSS manifests as external JSON assets in production build', async () => {
    const context = await createContext()
    context.config.command = 'build'
    const plugin = ManifestLoaderPlugin(context)
    const importer = path.join(FIXTURE_DIR, 'entry.ts')
    const addWatchFile = vi.fn()
    const emitFile = vi.fn(() => 'stet_css_query_manifest_ref')
    const resolve = vi.fn(async (id: string) => ({ id: path.resolve(FIXTURE_DIR, id) }))

    const resolvedId = await (plugin.resolveId as any).call(
      { resolve },
      './theme.css' + STET_CSS_MANIFEST_QUERY,
      importer
    )
    const code = await (plugin.load as any).call({ addWatchFile, emitFile }, resolvedId)

    expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({
      type: 'asset',
      name: 'stet-css-manifest.json',
      source: expect.stringContaining('#456')
    }))
    expect(code).toContain('const stetCSSManifestURL = import.meta.ROLLUP_FILE_URL_stet_css_query_manifest_ref;')
    expect(code).toContain(`const stetCSSManifestResponse = await fetch(typeof stetCSSManifestURL === 'string' ? stetCSSManifestURL : stetCSSManifestURL.href);`)
    expect(code).toContain('export default await stetCSSManifestResponse.json();')
    expect(code).not.toContain('#456')
  })

  it('emits per-file CSS manifests through a universal facade in SSR production build', async () => {
    const context = await createContext()
    context.config.command = 'build'
    context.config.build.ssr = true
    const plugin = ManifestLoaderPlugin(context)
    const importer = path.join(FIXTURE_DIR, 'entry.ts')
    const addWatchFile = vi.fn()
    const emitFile = vi.fn(() => 'stet_css_query_manifest_ref')
    const resolve = vi.fn(async (id: string) => ({ id: path.resolve(FIXTURE_DIR, id) }))

    const resolvedId = await (plugin.resolveId as any).call(
      { resolve },
      './theme.css' + STET_CSS_MANIFEST_QUERY,
      importer
    )
    const code = await (plugin.load as any).call({ addWatchFile, emitFile }, resolvedId)

    expect(code).toContain('const stetCSSManifestURL = import.meta.ROLLUP_FILE_URL_stet_css_query_manifest_ref;')
    expect(code).toContain('loadStetCSSManifestFromFile')
    expect(code).toContain('loadStetCSSManifestFromFetch')
    expect(code).toContain(`with: { type: 'json' }`)
    expect(code).toContain('await fetch(specifier)')
    expect(code).not.toContain(`import { readFile } from 'node:fs/promises';`)
    expect(code).not.toContain('#456')
  })

  /**
   * Guards dev updates of a stylesheet read through `?stet-css-manifest`: the hook must return
   * the edited file's own modules along with the manifest query module.
   * Reverse check: starting `modules` empty in `manifest-loader.ts` turns only this test red.
   */
  it('updates per-file CSS manifest modules through HMR when imported', async () => {
    const context = await createContext()
    const plugin = ManifestLoaderPlugin(context)
    const manifestPath = path.join(FIXTURE_DIR, 'theme.css')
    const resolvedId = toResolvedStetCSSManifestId(manifestPath)
    const importer = {}
    const module = { importers: new Set([importer]) }
    const invalidateModule = vi.fn()
    const send = vi.fn()

    await (plugin.load as any).call({ addWatchFile: vi.fn() }, resolvedId)
    const changedModule = { id: manifestPath }
    const result = await (plugin.handleHotUpdate as any)({
      file: manifestPath,
      modules: [changedModule],
      server: {
        moduleGraph: {
          getModuleById: vi.fn((id) => id === resolvedId ? module : undefined),
          invalidateModule
        },
        ws: { send }
      }
    })

    expect(invalidateModule).toHaveBeenCalledWith(module)
    expect(send).not.toHaveBeenCalled()
    expect(result).toEqual([changedModule, module])
  })
})
