/**
 * Unit tests for StetCSSPlugin's webpack hook surface, driven through real tapable hooks
 * instead of a full webpack run; `static-e2e.test.ts` runs real builds.
 */
import { describe, test, expect, vi } from 'vitest'
import { SyncHook, AsyncSeriesHook } from 'tapable'
import StetCSSPlugin from '../src'
import { VIRTUAL_MANIFEST_ID, STET_CSS_MANIFEST_QUERY } from '@stet-css/integration/manifest-module'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@stet-css/integration/emitted-globals-module'
import { createStylesheetDirectives } from '@stet-css/stylesheet'
import { transformStyleSource } from '../src/utils/transform-style-source'
import stetCSSStyleCSSLoader from '../src/style-css-loader'
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
  const plugin = new StetCSSPlugin({
    ...options,
  } as any, cwd)
  // webpack-virtual-modules pokes at compiler.webpack internals; stub
  // its apply() so we don't have to spin a real webpack here.
  return plugin
}

interface StyleCSSLoaderRun {
  /** The block of a `.vue` file, such as `?vue&type=style&index=0&lang.css`. */
  resourceQuery?: string
  /** The options the plugin's rule passes; the `.vue` block rule sets `vueStyleBlock`. */
  options?: Record<string, unknown>
  /** The source map the previous loader handed on. */
  map?: unknown
}

function runStyleCSSLoader(root: string, resourcePath: string, source: string, run: StyleCSSLoaderRun = {}) {
  const dependencies: string[] = []
  return new Promise<{ content: string, map: unknown }>((resolve, reject) => {
    stetCSSStyleCSSLoader.call({
      resourcePath,
      resourceQuery: run.resourceQuery ?? '',
      rootContext: root,
      addDependency: (dependency) => dependencies.push(dependency),
      getOptions: () => run.options ?? {},
      async: () => (error, content, map) => {
        if (error) {
          const loaderError = error as Error & { dependencies?: string[] }
          loaderError.dependencies = dependencies
          reject(loaderError)
        } else {
          resolve({ content: content || '', map })
        }
      }
    }, source, run.map)
  }).then((result) => ({ ...result, dependencies }))
}

function makeRegisteredStyleSource(dependencies: string[]) {
  return {
    source: '',
    stetCSS: false,
    directives: createStylesheetDirectives(),
    dependencies,
    sourceDependencies: []
  }
}

describe('StetCSSPlugin', () => {
  test('exports the plugin as the default export', () => {
    expect(StetCSSPlugin.name).toBe('StetCSSPlugin')
  })

  /**
   * Guards that the plugin takes only `adapters`: the second form, scanner options passed
   * straight in (`new StetCSSPlugin({ safelist })`), the nested `scanner` and a typo all
   * throw when the config loads instead of being ignored, as `examples/webpack`'s `sources`
   * once was.
   * Reverse check: dropping the `validatePluginOptions` call in `src/plugin.ts` turns only this
   * test red.
   */
  test('rejects scanner options, the nested scanner and unknown keys', () => {
    expect(() => new StetCSSPlugin({ safelist: ['block'] } as never))
      .toThrow('@stet-css/webpack option "safelist" was removed; use @safelist in the CSS entry.')
    expect(() => new StetCSSPlugin({ scanner: { adapters: [] } } as never))
      .toThrow('@stet-css/webpack option "scanner" was removed; pass "adapters" directly.')
    expect(() => new StetCSSPlugin({ sources: ['./src'] } as never))
      .toThrow('Unknown @stet-css/webpack option "sources"; the only option is "adapters".')
  })

  // The rule goes in on `initialize`, once every plugin has applied (#236).
  test('installs a pre style loader for managed CSS entries', () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    compiler.hooks.initialize.call()

    expect((compiler as any).options.module.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        test: expect.any(RegExp),
        enforce: 'pre',
        use: [
          expect.objectContaining({
            loader: expect.stringContaining('style-css-loader'),
            options: expect.objectContaining({
              virtualCSSImportModuleId: expect.stringContaining('stet-utilities.css')
            })
          })
        ]
      })
    ]))
  })

  test('rewrites managed CSS entries to the generated CSS virtual import', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-style-'))
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
        stetImport: '../node_modules/.stet-css/stet-utilities.css'
      })

      expect(result.code).toBe('@import "../node_modules/.stet-css/stet-utilities.css";')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(themePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps imported native CSS and keyframes in the generated CSS virtual module', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-native-css-'))
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
        stetImport: '../node_modules/.stet-css/stet-utilities.css'
      })
      expect(transformed.code).toBe('@import "../node_modules/.stet-css/stet-utilities.css";')

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
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-local-compose-'))
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
        stetImport: '../node_modules/.stet-css/stet-utilities.css'
      })

      expect(result.code).toContain('.button{')
      expect(result.code).toContain('display:inline-flex')
      expect(result.code).toContain('background-color:#123456')
      expect(result.code).toContain('color:#fff')
      expect(result.code).not.toContain('@compose')
      expect(result.code).not.toContain('stet-utilities.css')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('dedupes local theme variables already emitted by global style entries', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-local-dedupe-'))
    const entryPath = path.join(root, 'app.css')
    const modulePath = path.join(root, 'Home.module.css')
    try {
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '.global-section { padding-block: var(--spacing-5xl); }'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '.home { @compose py:5xl; }', {
        projectDir: root,
        stetImport: '../node_modules/.stet-css/stet-utilities.css'
      })

      expect(result.code).toContain('.home{padding-block:var(--spacing-5xl)}')
      expect(result.code).not.toContain('--spacing-5xl:')
      expect(result.code).not.toContain('stet-utilities.css')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('style loader keeps local style dependencies registered after invalid @compose', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-loader-invalid-'))
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

  /**
   * Guards #236: vue-loader requests a `.vue` `<style>` block as `App.vue?vue&type=style&…`, so
   * the loader must judge the request by its query, not by the bare `resourcePath`, or
   * `@compose` and `@reference` reach css-loader as written. A scoped block also gets #189's
   * treatment: generated rules wrapped in `:global()` and generated keyframes named
   * `<name>-<id>` after vue-loader's `id=<id>&scoped=true`.
   * Reverse check: handing the loader's transform `resourcePath` alone turns this test and
   * every `.vue` case in `static-e2e.test.ts` red.
   */
  test('style loader lowers @compose and @reference in vue-loader style block requests', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-vue-block-'))
    const componentPath = path.join(root, 'App.vue')
    const tokensPath = path.join(root, 'tokens.css')
    try {
      writeFileSync(path.join(root, 'app.css'), [
        '@import "@stet-css/core";',
        '@components {',
        '  brand { background-color: #123456; }',
        '}'
      ].join('\n'))
      writeFileSync(tokensPath, '@theme { --color-probe: #abcdef; }')

      const plain = await runStyleCSSLoader(
        root,
        componentPath,
        '.plain { @compose inline-flex brand; }',
        { resourceQuery: '?vue&type=style&index=0&lang.css', options: { vueStyleBlock: true } }
      )
      // The same output a CSS Module with this source gets: component declarations first.
      expect(plain.content).toContain('.plain{background-color:#123456;display:inline-flex}')
      expect(plain.content).not.toContain('@compose')
      expect(plain.content).not.toContain(':global(')

      const scoped = await runStyleCSSLoader(
        root,
        componentPath,
        '@reference "./tokens.css";\n.probe { color: var(--color-probe); @compose animate:fade; }',
        { resourceQuery: '?vue&type=style&index=1&id=7a7a37b1&scoped=true&lang.css', options: { vueStyleBlock: true } }
      )
      expect(scoped.content).toContain('.probe{color:var(--color-probe);animation:var(--animate-fade)}')
      expect(scoped.content).toMatch(/:global\(:root\)\{[^}]*--color-probe:#abcdef/)
      expect(scoped.content).toMatch(/:global\(:root\)\{[^}]*--animate-fade:fade-7a7a37b1 /)
      expect(scoped.content).toMatch(/@keyframes fade-7a7a37b1\{/)
      expect(scoped.content).not.toContain('@reference')
      expect(scoped.content).not.toContain('@compose')
      expect(scoped.dependencies).toContain(tokensPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * Guards that judging a `.vue` style block by its query (#236) leaves a block that imports
   * `@stet-css/core` as it was: the plugin registers an entry by reading its file, which for a
   * block is the whole component, so rewriting the block to the generated CSS import would
   * drop its native CSS and its directives.
   * Reverse check: dropping the stylesheet-file check on entries in
   * `src/utils/transform-style-source.ts` turns only this test red.
   */
  test('style loader leaves a vue-loader style block that imports @stet-css/core as written', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-vue-entry-'))
    try {
      const source = '@import "@stet-css/core";\n.native { color: red; }'
      const result = await runStyleCSSLoader(
        root,
        path.join(root, 'App.vue'),
        source,
        { resourceQuery: '?vue&type=style&index=0&lang.css', options: { vueStyleBlock: true } }
      )
      expect(result.content).toBe(source)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * Guards vue-loader's `experimentalInlineMatchResource` form, `App.vue.css?vue&type=style&…`
   * (#236): webpack's rules see a stylesheet, so the `pre` rule runs, but before vue-loader
   * extracts the block: the source is the whole component and must pass through, map included.
   * The `.vue` block rule lowers the block once extracted.
   * Reverse check: dropping the `pre` rule's check on the file in `src/style-css-loader.ts`
   * turns this test red ("Invalid empty selector") and the inline cases in `static-e2e.test.ts`.
   */
  test('style loader leaves a .vue file the pre rule reaches through a match resource as written', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-vue-pre-'))
    try {
      const source = '<template><p class="plain"></p></template>\n<style>\n.plain { @compose block; }\n</style>\n'
      const map = { version: 3, sources: ['App.vue'], mappings: 'AAAA' }
      const result = await runStyleCSSLoader(root, path.join(root, 'App.vue'), source, {
        resourceQuery: '?vue&type=style&index=0&lang.css',
        map
      })
      expect(result.content).toBe(source)
      expect(result.map).toBe(map)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * Guards source maps through the loader (#236): vue-loader maps a `<style>` block to its lines
   * in the `.vue` file, and the `.vue` block rule now runs on every block. A style the loader
   * leaves as written must keep the incoming map, or CSS maps point at the block's own lines.
   * Reverse check: calling back without the map turns both cases red.
   */
  test.each([
    ['a .vue style block', 'App.vue', '?vue&type=style&index=0&lang.css', { vueStyleBlock: true }],
    ['a stylesheet', 'app.css', '', {}]
  ])('style loader keeps the source map of %s it leaves as written', async (_, file, resourceQuery, options) => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-map-'))
    try {
      const source = '.x { color: red; }\n'
      const map = { version: 3, sources: [file], mappings: 'SAAS' }
      const result = await runStyleCSSLoader(root, path.join(root, file), source, { resourceQuery, options, map })
      expect(result.content).toBe(source)
      expect(result.map).toBe(map)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * Guards entries in a project whose path holds `#` (#236's review): whether a request names a
   * stylesheet file is read from `resourcePath`, which has no query to cut, so the entry is
   * still rewritten to the generated CSS import.
   * Reverse check: judging the file by the request with its query cut at `#` turns only this
   * test red.
   */
  test('style loader rewrites an entry whose path holds #', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-#hash-'))
    try {
      const result = await runStyleCSSLoader(root, path.join(root, 'app.css'), '@import "@stet-css/core";\n')
      expect(result.content).toBe(`@import "${VIRTUAL_CSS_ID}";`)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  /**
   * Guards where the `.vue` block rule goes (#236): right before the rule that hands `.vue`
   * files to vue-loader, by package name or resolved path, past a rule that runs other files
   * through vue-loader (VuePress's `.md`); and a `null`, `undefined` or `false` rule, which
   * webpack accepts, must not throw.
   * VueLoaderPlugin takes the first rule that matches, so with two `.vue` rules split by
   * `include` the block rule goes before the first; a `test` can be a function or an array.
   * Reverse check: matching only the bare `vue-loader` name turns the resolved-path case red;
   * splicing before the first rule naming vue-loader turns the `.md` case red, and the
   * `static-e2e.test.ts` cases with the `.md` rule before the css rule; dropping the
   * guard on rules that are not objects turns the falsy case red (TypeError); `findLastIndex`
   * turns the `include` case red; a function condition that never matches turns the function
   * case red; an array condition that needs every item turns the array case red. Each of these
   * three also turns its `static-e2e.test.ts` case red.
   */
  test.each([
    ['a resolved vue-loader path', [
      { test: /\.vue$/, loader: '/project/node_modules/vue-loader/dist/index.js' }
    ], 0],
    ['a vue-loader rule for .md first', [
      { test: /\.md$/, use: ['vue-loader', '/project/md-loader.js'] },
      { test: /\.vue$/, use: [{ loader: 'vue-loader', options: {} }] }
    ], 1],
    ['null, undefined and false rules', [null, undefined, false], -1],
    ['two .vue rules split by include', [
      { test: /\.vue$/, include: '/project/src/a', loader: 'vue-loader' },
      { test: /\.vue$/, include: '/project/src/b', loader: 'vue-loader' }
    ], 0],
    ['a function test', [
      { test: (file: string) => file.endsWith('.vue'), loader: 'vue-loader' }
    ], 0],
    ['an array test', [
      { test: [/\.vue\.html$/, /\.vue$/], loader: 'vue-loader' }
    ], 0]
  ])('installs the .vue block rule with %s', (_, rules, vueRuleIndex) => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    ;(compiler.options.module as any).rules = [...rules]

    plugin.apply(compiler as any)
    compiler.hooks.initialize.call()

    const installed = (compiler.options.module as any).rules as any[]
    const isStyleLoader = (rule: any) => rule?.use?.[0]?.loader?.includes('style-css-loader')
    const blockRules = installed.filter((rule) => isStyleLoader(rule) && rule.use[0].options.vueStyleBlock)
    expect(installed.filter((rule) => isStyleLoader(rule) && rule.enforce === 'pre')).toHaveLength(1)
    if (vueRuleIndex === -1) {
      expect(blockRules).toEqual([])
      return
    }
    expect(blockRules).toHaveLength(1)
    expect(installed.indexOf(blockRules[0])).toBe(vueRuleIndex)
    expect(installed[vueRuleIndex + 1]).toBe(rules[vueRuleIndex])
  })

  /**
   * Guards that the rules go in once (#236): `initialize`, `beforeRun` and every `watchRun` try
   * to install them, so a plugin applied after `webpack()` still gets them; a second install
   * would run the loader again on every stylesheet and `.vue` block, more on each rebuild.
   * Reverse check: dropping the installed check turns this test red (5 of each rule) and the
   * watched late-apply case in `static-e2e.test.ts`.
   */
  test('installs its rules once across initialize, beforeRun and watch rebuilds', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    ;(compiler.options.module as any).rules = [{ test: /\.vue$/, loader: 'vue-loader' }]
    // The generation these hooks also start is not under test here.
    vi.spyOn(plugin as any, 'writeGeneratedCSSModule').mockResolvedValue(undefined)
    vi.spyOn(plugin, 'init').mockResolvedValue(plugin)

    plugin.apply(compiler as any)
    compiler.hooks.initialize.call()
    await compiler.hooks.beforeRun.promise(compiler)
    for (let rebuild = 0; rebuild < 3; rebuild++) {
      await compiler.hooks.watchRun.promise(compiler)
    }

    const installed = (compiler.options.module as any).rules as any[]
    const styleLoaderRules = installed.filter((rule) => rule?.use?.[0]?.loader?.includes('style-css-loader'))
    expect(styleLoaderRules.filter((rule) => rule.enforce === 'pre')).toHaveLength(1)
    expect(styleLoaderRules.filter((rule) => rule.use[0].options.vueStyleBlock)).toHaveLength(1)
  })

  /**
   * Guards the map of a block the loader rewrites (#236): the incoming map describes the source
   * as written, not the lowered CSS, so it must not travel with the new code; the next loader
   * maps the lowered text instead.
   * Reverse check: always handing on the incoming map turns only this test red.
   */
  test('style loader hands no incoming source map on with a block it lowers', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-lowered-map-'))
    try {
      const map = { version: 3, sources: ['App.vue'], mappings: 'SAAS' }
      const result = await runStyleCSSLoader(root, path.join(root, 'App.vue'), '.x { @compose block; }\n', {
        resourceQuery: '?vue&type=style&index=0&lang.css',
        options: { vueStyleBlock: true },
        map
      })
      expect(result.content).toContain('.x{display:block}')
      expect(result.map).toBeUndefined()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('locally lowers explicit @reference CSS Modules and reports reference dependencies', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-reference-'))
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
        stetImport: '../node_modules/.stet-css/stet-utilities.css'
      })

      expect(result.code).toContain('.button{padding:var(--spacing-card);animation:1s pop}')
      expect(result.code).toContain('--spacing-card:2rem')
      expect(result.code).toContain('@keyframes pop')
      expect(result.code).not.toContain('@reference')
      expect(result.code).not.toContain('referenced-native')
      expect(result.code).not.toContain('stet-utilities.css')
      expect(result.dependencies).toContain(modulePath)
      expect(result.dependencies).toContain(tokenPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('leaves ordinary CSS unchanged in the style loader helper', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-local-compose-'))
    const modulePath = path.join(root, 'Button.module.css')
    try {
      const source = '.button { color: red; }'
      const result = await transformStyleSource(modulePath, source, {
        projectDir: root,
        stetImport: '../node_modules/.stet-css/stet-utilities.css'
      })

      expect(result.code).toBe(source)
      expect(result.dependencies).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('strips StetCSS directives from package CSS files before css-loader sees them', async () => {
    const themePath = path.resolve(__dirname, '../../core/src/theme.css')
    const result = await transformStyleSource(
      themePath,
      '@theme { --color-primary: red; }\n:root { color: red; }',
      {
        projectDir: path.resolve(__dirname, '../../../examples/webpack')
      }
    )

    expect(result.code).toContain(':root')
  })

  test('resolves virtual:stet-css-manifest to a JS facade and external JSON asset', async () => {
    const plugin = new StetCSSPlugin()
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

    expect(resolveData.request).toContain(path.join('node_modules', '.stet-css', 'stet-css-manifest.js'))
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('const stetCSSManifestResponse = await fetch(typeof stetCSSManifestURL === \'string\' ? stetCSSManifestURL : stetCSSManifestURL.href);')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('export default await stetCSSManifestResponse.json();')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('font-weight-bold')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('"version":1')
  })

  test('adds resolve file dependencies to Set and array-like containers', () => {
    const dependency = path.join(process.cwd(), 'stet.css')
    const setDependencies = new Set<string>()
    const arrayDependencies: string[] = []

    addFileDependency(setDependencies, dependency)
    addFileDependency(arrayDependencies, dependency)
    addFileDependency(arrayDependencies, dependency)

    expect(setDependencies.has(dependency)).toBe(true)
    expect(arrayDependencies).toEqual([dependency])
  })

  test('resolves virtual:stet-css-manifest to an inline module in development', async () => {
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
      .not.toContain('loadStetCSSManifestModule')
    expect([...(plugin as any).manifestJSONAssets.values()]).toEqual([])
  })

  test('keeps virtual manifest file dependencies after invalid CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-invalid-manifest-'))
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
        .toContain('stetCSSManifestURL')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves virtual:stet-css-emitted-globals to a JS virtual module', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-emitted-globals-'))
    try {
      const plugin = new StetCSSPlugin({}, root)
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

      expect(resolveData.request).toContain(path.join('node_modules', '.stet-css', 'stet-css-emitted-globals.js'))
      expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
        .toBe('export default {"variables":{},"animations":{}};')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves ?stet-css-manifest imports to per-file JS facades and external JSON assets', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory(fixturePath)
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: './theme.css' + STET_CSS_MANIFEST_QUERY,
      context: path.dirname(fixturePath),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.stet-css'))
    expect(resolveData.request).toContain('.manifest.js')
    expect(resolveData.fileDependencies.has(fixturePath)).toBe(true)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('const stetCSSManifestResponse = await fetch(typeof stetCSSManifestURL === \'string\' ? stetCSSManifestURL : stetCSSManifestURL.href);')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('export default await stetCSSManifestResponse.json();')
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('#456')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('accent')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('#456')
  })

  test('resolves ?stet-css-manifest imports to inline modules in development', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler({ mode: 'development' })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory(fixturePath)
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: './theme.css' + STET_CSS_MANIFEST_QUERY,
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

  test('keeps ?stet-css-manifest file dependencies after invalid CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-invalid-query-manifest-'))
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
        request: './theme.css' + STET_CSS_MANIFEST_QUERY,
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

    expect(resolveData.request).toContain(path.join('node_modules', '.stet-css', 'stet-utilities.css'))
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

    expect(resolveData.request).toContain(path.join('node_modules', '.stet-css', 'stet-utilities.css'))
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
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-config-'))
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
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-'))
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

      const { css } = await new StetCSSPlugin({}, root).generateCSS()

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
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-package-'))
    try {
      writeFileSync(path.join(root, 'app.css'), '@import "@stet-css/core";')

      const { css } = await new StetCSSPlugin({}, root).generateCSS()

      expect(css).toContain('@layer base')
      expect(css).toContain('text-rendering: geometricprecision')
      expect(css).not.toContain('@stet-css/core')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  test('keeps managed CSS fallback dependencies after failed style registration', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-style-invalid-'))
    const entryPath = path.join(root, 'app.css')
    try {
      writeFileSync(entryPath, [
        '@import "@stet-css/core";',
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const plugin = new StetCSSPlugin({}, root)

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
    const reset = vi.fn(async function (this: StetCSSPlugin) {
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
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-watch-'))
    const configPath = path.join(root, 'app.css')
    const tokenPath = path.join(root, 'theme.css')
    try {
      writeFileSync(tokenPath, '@components { card { color: #123456; } }')
      writeFileSync(configPath, '@import "@stet-css/core";\n@import "./theme.css";')

      const plugin = makePlugin({}, root)
      ;(plugin as any).styleCSSSources = new Map([
        [configPath, makeRegisteredStyleSource([configPath, tokenPath])]
      ])
      const reset = vi.fn(async function (this: StetCSSPlugin) {
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
    const root = mkdtempSync(path.join(tmpdir(), 'stet-css-webpack-deps-'))
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
    const reset = vi.fn(async function (this: StetCSSPlugin) {
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
