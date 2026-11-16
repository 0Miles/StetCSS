/**
 * Unit tests for MasterCSSPlugin's webpack hook surface, driven through real tapable hooks
 * instead of a full webpack run; `static-e2e.test.ts` runs real builds.
 */
import { describe, test, expect, vi } from 'vitest'
import { SyncHook, AsyncSeriesHook } from 'tapable'
import MasterCSSPlugin from '../src'
import { VIRTUAL_MANIFEST_ID, MASTER_CSS_MANIFEST_QUERY } from '@stet-css/integration/manifest-module'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@stet-css/integration/emitted-globals-module'
import { createStylesheetDirectives } from '@stet-css/stylesheet'
import { transformStyleSource } from '../src/utils/transform-style-source'
import masterCSSStyleCSSLoader from '../src/style-css-loader'
import { addFileDependency } from '../src/utils/file-dependencies'
import path from 'node:path'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

// Build a minimal compiler / compilation pair whose hooks behave the
// way webpack@5 declares them. Includes the hooks VirtualModulesPlugin
// needs (afterEnvironment / afterResolvers / watchRun) so its apply()
// call inside the plugin doesn't blow up.
function makeFakeCompiler(options: {
  context?: string
  modifiedFiles?: Set<string>
  mode?: 'development' | 'production' | 'none'
  assets?: Record<string, { source: () => string }>
} = {}) {
  const assets = options.assets || {}
  const compilation = {
    fileDependencies: new Set<string>(),
    errors: [] as unknown[],
    emitAsset: vi.fn((fileName: string, source: { source: () => string }) => {
      assets[fileName] = source
    }),
    updateAsset: vi.fn((fileName: string, source: { source: () => string }) => {
      assets[fileName] = source
    }),
    hooks: {
      processAssets: new SyncHook<[Record<string, { source: () => string }>]>(['assets']),
    },
  }
  const compiler = {
    hooks: {
      initialize: new SyncHook<[]>([]),
      beforeRun: new AsyncSeriesHook<[unknown]>(['compiler']),
      watchRun: new AsyncSeriesHook<[unknown]>(['compiler']),
      afterEnvironment: new SyncHook<[]>([]),
      afterResolvers: new SyncHook<[unknown]>(['compiler']),
      thisCompilation: new SyncHook<[typeof compilation]>(['compilation']),
      normalModuleFactory: new SyncHook<[unknown]>(['normalModuleFactory']),
    },
    context: options.context || process.cwd(),
    modifiedFiles: options.modifiedFiles,
    options: {
      mode: options.mode,
      module: {
        rules: []
      },
      output: {} as { path?: string }
    },
    webpack: {
      Compilation: {
        PROCESS_ASSETS_STAGE_ADDITIONS: -100,
        PROCESS_ASSETS_STAGE_OPTIMIZE: 100
      },
      sources: {
        RawSource: class RawSource {
          constructor(private value: string) {}

          source() {
            return this.value
          }
        }
      }
    },
    inputFileSystem: {
      _writeVirtualFile: vi.fn()
    },
    resolverFactory: { hooks: { resolver: { for: () => ({ tap: () => {} }) } } },
  }
  return { compiler, compilation, assets }
}

function makeNormalModuleFactory(resolvedPath?: string) {
  return {
    hooks: {
      beforeResolve: new AsyncSeriesHook<[any]>(['resolveData']),
    },
    getResolver: () => ({
      resolve: (
        _contextInfo: unknown,
        _context: string,
        _request: string,
        _resolveContext: unknown,
        callback: (error: null | Error, result?: string | false) => void
      ) => {
        callback(null, resolvedPath)
      }
    })
  }
}

function resolveBefore(normalModuleFactory: ReturnType<typeof makeNormalModuleFactory>, resolveData: any) {
  return new Promise<void>((resolve, reject) => {
    normalModuleFactory.hooks.beforeResolve.callAsync(resolveData, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

// Construct a plugin whose scanner side-effects are stubbed out — we
// only want to drive the webpack hook surface. We keep the real
// constructor + init() so `this.options` is populated correctly.
function makePlugin(options: Record<string, unknown> = {}, cwd = process.cwd()) {
  const plugin = new MasterCSSPlugin({
    ...options,
  } as any, cwd)
  // webpack-virtual-modules pokes at compiler.webpack internals; stub
  // its apply() so we don't have to spin a real webpack here.
  return plugin
}

function runStyleCSSLoader(root: string, resourcePath: string, source: string) {
  const dependencies: string[] = []
  return new Promise<string>((resolve, reject) => {
    masterCSSStyleCSSLoader.call({
      resourcePath,
      rootContext: root,
      addDependency: (dependency) => dependencies.push(dependency),
      getOptions: () => ({}),
      async: () => (error, content) => {
        if (error) {
          const loaderError = error as Error & { dependencies?: string[] }
          loaderError.dependencies = dependencies
          reject(loaderError)
        } else {
          resolve(content || '')
        }
      }
    }, source)
  }).then((content) => ({ content, dependencies }))
}

function makeRegisteredStyleSource(dependencies: string[]) {
  return {
    source: '',
    masterCSS: false,
    directives: createStylesheetDirectives(),
    dependencies,
    sourceDependencies: []
  }
}

describe('MasterCSSPlugin', () => {
  test('exports the plugin as the default export', () => {
    expect(MasterCSSPlugin.name).toBe('MasterCSSPlugin')
  })

  /**
   * Guards that the plugin takes only `adapters`: the second form, scanner options passed
   * straight in (`new MasterCSSPlugin({ safelist })`), the nested `scanner` and a typo all
   * throw when the config loads instead of being ignored, as `examples/webpack`'s `sources`
   * once was.
   * Reverse check: dropping the `validatePluginOptions` call in `src/plugin.ts` turns only this
   * test red.
   */
  test('rejects scanner options, the nested scanner and unknown keys', () => {
    expect(() => new MasterCSSPlugin({ safelist: ['block'] } as never))
      .toThrow('@stet-css/webpack option "safelist" was removed; use @safelist in the CSS entry.')
    expect(() => new MasterCSSPlugin({ scanner: { adapters: [] } } as never))
      .toThrow('@stet-css/webpack option "scanner" was removed; pass "adapters" directly.')
    expect(() => new MasterCSSPlugin({ sources: ['./src'] } as never))
      .toThrow('Unknown @stet-css/webpack option "sources"; the only option is "adapters".')
  })

  test('installs a pre style loader for managed CSS entries', () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)

    expect((compiler as any).options.module.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        test: expect.any(RegExp),
        enforce: 'pre',
        use: [
          expect.objectContaining({
            loader: expect.stringContaining('style-css-loader'),
            options: expect.objectContaining({
              virtualCSSImportModuleId: expect.stringContaining('master-utilities.css')
            })
          })
        ]
      })
    ]))
  })

  test('rewrites managed CSS entries to the generated CSS virtual import', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-style-'))
    const entryPath = path.join(root, 'app.css')
    const themePath = path.join(root, 'theme.css')
    try {
      writeFileSync(themePath, '@layer components { .card { display: grid; } }')
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@import "./theme.css";',
        '',
        '.native { color: red; }'
      ].join('\n'))

      const result = await transformStyleSource(entryPath, readFileSync(entryPath, 'utf-8'), {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toBe('@import "../node_modules/.master-css/master-utilities.css";')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(themePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps imported native CSS and keyframes in the generated CSS virtual module', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-native-css-'))
    const entryPath = path.join(root, 'app.css')
    const homePath = path.join(root, 'home.css')
    const pagePath = path.join(root, 'page.tsx')
    try {
      writeFileSync(homePath, [
        '@theme { --color-active: #ff0000; }',
        '@components { active-card { animation: active-spin 1s infinite; } }',
        '@keyframes active-spin { to { opacity: .5; } }',
        '.native-card { color: var(--color-active); }'
      ].join('\n'))
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@import "./home.css";'
      ].join('\n'))
      writeFileSync(pagePath, '<div className="active-card native-card"></div>')

      const transformed = await transformStyleSource(entryPath, readFileSync(entryPath, 'utf-8'), {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })
      expect(transformed.code).toBe('@import "../node_modules/.master-css/master-utilities.css";')

      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)
      await compiler.hooks.beforeRun.promise(compiler)

      const virtualCSS = (compiler.inputFileSystem._writeVirtualFile as any).mock.calls
        .map((call: unknown[]) => String(call[2]))
        .reverse()
        .find((content: string) => content.includes('.active-card'))
      expect(virtualCSS).toContain('@keyframes active-spin')
      expect(virtualCSS).toContain('.native-card')
      expect(virtualCSS).toContain('--color-active:red')
      expect(virtualCSS).toContain('.active-card')
      expect(virtualCSS).not.toContain('@components')
      expect(virtualCSS).not.toContain('@import "./home.css"')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  test('locally lowers @compose in CSS Modules without rewriting to the virtual CSS import', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-local-compose-'))
    const entryPath = path.join(root, 'app.css')
    const modulePath = path.join(root, 'Button.module.css')
    try {
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@components {',
        '  brand { background-color: #123456; }',
        '}'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '.button { @compose inline-flex brand; color: white; }', {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toContain('.button{')
      expect(result.code).toContain('display:inline-flex')
      expect(result.code).toContain('background-color:#123456')
      expect(result.code).toContain('color:#fff')
      expect(result.code).not.toContain('@compose')
      expect(result.code).not.toContain('master-utilities.css')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('dedupes local theme variables already emitted by global style entries', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-local-dedupe-'))
    const entryPath = path.join(root, 'app.css')
    const modulePath = path.join(root, 'Home.module.css')
    try {
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '.global-section { padding-block: var(--spacing-5xl); }'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '.home { @compose py:5xl; }', {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toContain('.home{padding-block:var(--spacing-5xl)}')
      expect(result.code).not.toContain('--spacing-5xl:')
      expect(result.code).not.toContain('master-utilities.css')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('style loader keeps local style dependencies registered after invalid @compose', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-loader-invalid-'))
    const modulePath = path.join(root, 'Button.module.css')
    try {
      let error: Error & { dependencies?: string[] } | undefined
      try {
        await runStyleCSSLoader(root, modulePath, '.button { @compose bg:neutral-120; }')
      } catch (caught) {
        error = caught as Error & { dependencies?: string[] }
      }

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toContain('Invalid @compose class')
      expect(error?.dependencies).toContain(modulePath)

      const result = await runStyleCSSLoader(root, modulePath, '.button { @compose block; }')
      expect(result.content).toContain('.button{display:block}')
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('locally lowers explicit @reference CSS Modules and reports reference dependencies', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-reference-'))
    const modulePath = path.join(root, 'Button.module.css')
    const tokenPath = path.join(root, 'tokens.css')
    try {
      writeFileSync(tokenPath, [
        '@theme {',
        '  --spacing-card: 2rem;',
        '',
        '  @keyframes pop {',
        '    to { opacity: 1; }',
        '  }',
        '}',
        '@components {',
        '  brand {',
        '    padding: var(--spacing-card);',
        '    animation: pop 1s;',
        '  }',
        '}',
        '.referenced-native { color: red; }'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '@reference "./tokens.css"; .button { @compose brand; }', {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toContain('.button{padding:var(--spacing-card);animation:1s pop}')
      expect(result.code).toContain('--spacing-card:2rem')
      expect(result.code).toContain('@keyframes pop')
      expect(result.code).not.toContain('@reference')
      expect(result.code).not.toContain('referenced-native')
      expect(result.code).not.toContain('master-utilities.css')
      expect(result.dependencies).toContain(modulePath)
      expect(result.dependencies).toContain(tokenPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('leaves ordinary CSS unchanged in the style loader helper', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-local-compose-'))
    const modulePath = path.join(root, 'Button.module.css')
    try {
      const source = '.button { color: red; }'
      const result = await transformStyleSource(modulePath, source, {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toBe(source)
      expect(result.dependencies).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('strips Master directives from package CSS files before css-loader sees them', async () => {
    const themePath = path.resolve(__dirname, '../../core/src/theme.css')
    const result = await transformStyleSource(
      themePath,
      '@theme { --color-primary: red; }\n:root { color: red; }',
      {
        projectDir: path.resolve(__dirname, '../../../examples/webpack')
      }
    )

    expect(result.code).not.toContain('@master')
    expect(result.code).toContain(':root')
  })

  test('resolves virtual:master-css-manifest to a JS facade and external JSON asset', async () => {
    const plugin = new MasterCSSPlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_MANIFEST_ID,
      context: process.cwd(),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-css-manifest.js'))
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('const masterCSSManifestResponse = await fetch(typeof masterCSSManifestURL === \'string\' ? masterCSSManifestURL : masterCSSManifestURL.href);')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('export default await masterCSSManifestResponse.json();')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('font-weight-bold')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('"version":1')
  })

  test('adds resolve file dependencies to Set and array-like containers', () => {
    const dependency = path.join(process.cwd(), 'master.css')
    const setDependencies = new Set<string>()
    const arrayDependencies: string[] = []

    addFileDependency(setDependencies, dependency)
    addFileDependency(arrayDependencies, dependency)
    addFileDependency(arrayDependencies, dependency)

    expect(setDependencies.has(dependency)).toBe(true)
    expect(arrayDependencies).toEqual([dependency])
  })

  test('resolves virtual:master-css-manifest to an inline module in development', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const plugin = makePlugin({}, root)
    const { compiler } = makeFakeCompiler({ context: root, mode: 'development' })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_MANIFEST_ID,
      context: root,
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toMatch(/^export default \{"version":1/)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('loadMasterCSSManifestModule')
    expect([...(plugin as any).manifestJSONAssets.values()]).toEqual([])
  })

  test('keeps virtual manifest file dependencies after invalid CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-invalid-manifest-'))
    const entryPath = path.join(root, 'app.css')
    try {
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)

      const normalModuleFactory = makeNormalModuleFactory()
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: VIRTUAL_MANIFEST_ID,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await expect(resolveBefore(normalModuleFactory, resolveData)).rejects.toThrow('Invalid @compose class')
      expect(resolveData.fileDependencies.has(entryPath)).toBe(true)

      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@components {',
        '  card { @compose block; }',
        '}'
      ].join('\n'))

      await resolveBefore(normalModuleFactory, resolveData)
      expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
        .toContain('masterCSSManifestURL')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves virtual:master-css-emitted-globals to a JS virtual module', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-emitted-globals-'))
    try {
      const plugin = new MasterCSSPlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)

      const normalModuleFactory = makeNormalModuleFactory()
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: VIRTUAL_EMITTED_GLOBALS_ID,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await resolveBefore(normalModuleFactory, resolveData)

      expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-css-emitted-globals.js'))
      expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
        .toBe('export default {"variables":{},"animations":{}};')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves ?master-css-manifest imports to per-file JS facades and external JSON assets', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory(fixturePath)
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: './theme.css' + MASTER_CSS_MANIFEST_QUERY,
      context: path.dirname(fixturePath),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css'))
    expect(resolveData.request).toContain('.manifest.js')
    expect(resolveData.fileDependencies.has(fixturePath)).toBe(true)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('const masterCSSManifestResponse = await fetch(typeof masterCSSManifestURL === \'string\' ? masterCSSManifestURL : masterCSSManifestURL.href);')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('export default await masterCSSManifestResponse.json();')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('#456')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('accent')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('#456')
  })

  test('resolves ?master-css-manifest imports to inline modules in development', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler({ mode: 'development' })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory(fixturePath)
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: './theme.css' + MASTER_CSS_MANIFEST_QUERY,
      context: path.dirname(fixturePath),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toMatch(/^export default \{"version":1/)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('#456')
    expect([...(plugin as any).manifestJSONAssets.values()]).toEqual([])
  })

  test('keeps ?master-css-manifest file dependencies after invalid CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-invalid-query-manifest-'))
    const manifestPath = path.join(root, 'theme.css')
    try {
      writeFileSync(manifestPath, [
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)

      const normalModuleFactory = makeNormalModuleFactory(manifestPath)
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: './theme.css' + MASTER_CSS_MANIFEST_QUERY,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await expect(resolveBefore(normalModuleFactory, resolveData)).rejects.toThrow('Invalid @compose class')
      expect(resolveData.fileDependencies.has(manifestPath)).toBe(true)

      writeFileSync(manifestPath, [
        '@components {',
        '  card { @compose block; }',
        '}'
      ].join('\n'))

      await resolveBefore(normalModuleFactory, resolveData)
      expect(resolveData.request).toContain('.manifest.js')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves virtual CSS module imports to the generated CSS virtual module', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_CSS_ID,
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/main.ts')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-utilities.css'))
  })

  test('resolves CSS @import virtual utilities to the generated CSS virtual module', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_CSS_ID,
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/styles.css')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-utilities.css'))
  })

  test('leaves unrelated CSS @import unresolved', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: 'theme.css',
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/styles.css')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toBe('theme.css')
  })

  test('leaves CSS @import @stet-css/core package imports unchanged', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: '@stet-css/core',
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/styles.css')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toBe('@stet-css/core')
  })

  test('leaves non-CSS @stet-css/core imports unchanged', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: '@stet-css/core',
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/main.ts')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toBe('@stet-css/core')
  })

  test('adds managed CSS entry files as virtual manifest dependencies', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const plugin = makePlugin({}, root)
    const { compiler } = makeFakeCompiler({ context: root })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_MANIFEST_ID,
      context: root,
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.fileDependencies.has(path.join(root, 'app.css'))).toBe(true)
  })

  test('adds managed CSS import graph as virtual manifest dependencies', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-config-'))
    const entryPath = path.join(root, 'app.css')
    const themePath = path.join(root, 'theme.css')
    try {
      writeFileSync(themePath, '@components { card { color: #123456; } }')
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@import "./theme.css";'
      ].join('\n'))

      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      const normalModuleFactory = makeNormalModuleFactory()
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: VIRTUAL_MANIFEST_ID,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await resolveBefore(normalModuleFactory, resolveData)

      expect(resolveData.fileDependencies.has(entryPath)).toBe(true)
      expect(resolveData.fileDependencies.has(themePath)).toBe(true)
      expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
        .not.toContain('"color":"#123456"')
      expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
        .toContain('"color":"#123456"')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps managed CSS entry native CSS and uses its config', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-'))
    try {
      mkdirSync(path.join(root, 'src'), { recursive: true })
      writeFileSync(path.join(root, 'src/page.html'), '<div class="btn native-used root-native"></div>')
      writeFileSync(path.join(root, 'app.css'), [
        '@import "@stet-css/core";',
        '',
        '.root-native {',
        '    color: #789;',
        '}',
        '',
        '.root-unused {',
        '    color: #abc;',
        '}',
        '',
        '.native-used {',
        '    color: var(--color-primary);',
        '}',
        '',
        '@theme {',
        '    --color-primary: #123456;',
        '}',
        '',
        '@components {',
        '    btn {',
        '        display: grid;',
        '    }',
        '}'
      ].join('\n'))

      const { css } = await new MasterCSSPlugin({}, root).generateCSS()

      expect(css).toContain('.native-used')
      expect(css).toContain('.root-native')
      expect(css).toContain('.root-unused')
      expect(css).toMatch(/--color-primary:(rgb\(18 52 86\)|#123456)/)
      expect(css).toMatch(/\.btn\s*\{\s*display:\s*grid;?\s*\}/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  test('includes package base CSS for managed package imports', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-package-'))
    try {
      writeFileSync(path.join(root, 'app.css'), '@import "@stet-css/core";')

      const { css } = await new MasterCSSPlugin({}, root).generateCSS()

      expect(css).toContain('@layer base')
      expect(css).toContain('text-rendering: geometricprecision')
      expect(css).not.toContain('@stet-css/core')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  test('keeps managed CSS fallback dependencies after failed style registration', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-style-invalid-'))
    const entryPath = path.join(root, 'app.css')
    try {
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const plugin = new MasterCSSPlugin({}, root)

      const failed = await plugin.generateCSS()

      expect(String(failed.error)).toContain('Invalid @compose class')
      expect(failed.dependencies).toContain(entryPath)

      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@components {',
        '  card { display: block; }',
        '}'
      ].join('\n'))
      const fixed = await plugin.generateCSS()
      expect(fixed.error).toBeUndefined()
      expect(plugin.styleCSSSources.get(entryPath)?.dependencies).toContain(entryPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  test('resets scanner when the default CSS manifest changes in watch mode', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const configPath = path.join(root, 'app.css')
    const plugin = makePlugin({}, root)
    ;(plugin as any).defaultManifestDependencies = [configPath]
    const reset = vi.fn(async function (this: MasterCSSPlugin) {
      this.emit('reset')
      return this
    })
    ;(plugin as any).reset = reset
    const { compiler } = makeFakeCompiler({
      context: root,
      modifiedFiles: new Set([configPath])
    })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    await new Promise<void>((resolve, reject) => {
      compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
    })

    expect(reset).toHaveBeenCalledWith(plugin.options)
  })

  test('resets scanner when a managed CSS import dependency changes in watch mode', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-watch-'))
    const configPath = path.join(root, 'app.css')
    const tokenPath = path.join(root, 'theme.css')
    try {
      writeFileSync(tokenPath, '@components { card { color: #123456; } }')
      writeFileSync(configPath, '@import "@stet-css/core";\n@import "./theme.css";')

      const plugin = makePlugin({}, root)
      ;(plugin as any).styleCSSSources = new Map([
        [configPath, makeRegisteredStyleSource([configPath, tokenPath])]
      ])
      const reset = vi.fn(async function (this: MasterCSSPlugin) {
        this.emit('reset')
        return this
      })
      ;(plugin as any).reset = reset
      const { compiler } = makeFakeCompiler({
        context: root,
        modifiedFiles: new Set([tokenPath])
      })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      await new Promise<void>((resolve, reject) => {
        compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
      })

      expect(reset).toHaveBeenCalledWith(plugin.options)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * Guards watch mode for files no module imports: webpack only rebuilds on files it knows,
   * so the class set's source files and the entries' import graph must reach the compilation,
   * while the build's own output under the project root must not.
   * Reverse check: skipping the dependency hand-off to the compilation turns this test and the
   * watch test in `static-e2e.test.ts` red.
   */
  test('hands the static CSS dependencies to the compilation', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-deps-'))
    const entryPath = path.join(root, 'src/app.css')
    const themePath = path.join(root, 'src/theme.css')
    const templatePath = path.join(root, 'src/template.html')
    const outputPath = path.join(root, 'www/main.js')
    try {
      mkdirSync(path.join(root, 'src'), { recursive: true })
      mkdirSync(path.join(root, 'www'), { recursive: true })
      writeFileSync(themePath, '@components { card { color: #123456; } }')
      writeFileSync(entryPath, '@import "@stet-css/core";\n@import "./theme.css";')
      writeFileSync(templatePath, '<main class="card"></main>')
      writeFileSync(outputPath, 'document.body.className = "block"')
      const plugin = makePlugin({}, root)
      const { compiler, compilation } = makeFakeCompiler({ context: root })
      ;(compiler as any).options.output.path = path.join(root, 'www')
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      await compiler.hooks.beforeRun.promise(compiler)
      compiler.hooks.thisCompilation.call(compilation as any)

      expect(compilation.fileDependencies).toContain(entryPath)
      expect(compilation.fileDependencies).toContain(themePath)
      expect(compilation.fileDependencies).toContain(templatePath)
      expect(compilation.fileDependencies).not.toContain(outputPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  test('does not reset scanner when a non-manifest file changes in watch mode', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const plugin = makePlugin({}, root)
    ;(plugin as any).defaultManifestDependencies = [path.join(root, 'app.css')]
    const reset = vi.fn(async function (this: MasterCSSPlugin) {
      this.emit('reset')
      return this
    })
    ;(plugin as any).reset = reset
    const { compiler } = makeFakeCompiler({
      context: root,
      modifiedFiles: new Set([path.join(root, 'entry.js')])
    })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    await new Promise<void>((resolve, reject) => {
      compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
    })

    expect(reset).not.toHaveBeenCalled()
  })

})
