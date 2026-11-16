import { mkdtempSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { NextConfig } from 'next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import withStetCSS from '../src'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'

type WebpackConfig = Parameters<NonNullable<NextConfig['webpack']>>[0]
type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1]
type LoaderRule = { loader?: string, options?: Record<string, unknown> }
type ConfigRule = { loaders?: LoaderRule[], use?: LoaderRule[], type?: string }

const cwd = process.cwd()
let projectDir: string

beforeEach(() => {
  projectDir = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-next-config-')))
  process.chdir(projectDir)
})

afterEach(() => {
  process.chdir(cwd)
})

/** A third-party wrapper in the usual shape: spread the config, chain `webpack`. */
function withX(nextConfig: NextConfig, onWebpack: (config: WebpackConfig) => void): NextConfig {
  return {
    ...nextConfig,
    poweredByHeader: false,
    webpack(config: WebpackConfig, context: WebpackContext) {
      onWebpack(config)
      return nextConfig.webpack ? nextConfig.webpack(config, context) : config
    }
  }
}

function runWebpack(nextConfig: NextConfig) {
  return nextConfig.webpack!({ module: { rules: [] }, resolve: {} } as WebpackConfig, {} as WebpackContext)
}

function findLoaders(rules: unknown[], file: string) {
  return (rules as ConfigRule[]).flatMap((rule) => [...(rule.loaders || []), ...(rule.use || [])])
    .filter((loader) => loader.loader?.endsWith(file))
}

describe('withStetCSS', () => {
  /**
   * Guards #57: an outer wrapper cannot spread a Promise, as static mode used to return, and
   * must still reach the Turbopack rules and webpack hook withStetCSS added.
   * Reverse check: making withStetCSS return `Promise.resolve(config)` turns it red.
   */
  it('composes inside another wrapper and keeps both webpack hooks', () => {
    const onWebpack = vi.fn()
    const nextConfig = withX(withStetCSS({ reactStrictMode: true }), onWebpack)

    expect(nextConfig).not.toBeInstanceOf(Promise)
    expect(nextConfig.reactStrictMode).toBe(true)
    expect(nextConfig.poweredByHeader).toBe(false)
    expect(findLoaders(nextConfig.turbopack!.rules!['*'] as unknown[], 'generated-css-loader.js')).toHaveLength(1)

    const webpackConfig = runWebpack(nextConfig)

    expect(onWebpack).toHaveBeenCalledTimes(1)
    expect(findLoaders(webpackConfig.module.rules, 'generated-css-loader.js')).toHaveLength(1)
    expect(findLoaders(webpackConfig.module.rules, 'style-css-loader.js')).toHaveLength(1)
    expect(webpackConfig.resolve.alias[VIRTUAL_CSS_ID]).toBe(join(projectDir, '.stet/next.css'))
  })

  /**
   * Prevents: under Turbopack, a stylesheet whose only StetCSS syntax is a removed `@master`
   * at-rule never reaching the style loader, so the build passes and the at-rule ships doing
   * nothing. Turbopack runs the loader only on files its content condition matches.
   * Reverse check: removing `master` from the content pattern turns only this test red.
   */
  it('sends stylesheets with removed @master at-rules to the style loader under Turbopack', () => {
    const nextConfig = withStetCSS({} as NextConfig)
    const styleRule = (nextConfig.turbopack!.rules!['*'] as any[])
      .find((rule) => findLoaders([rule], 'style-css-loader.js').length)
    const content = styleRule.condition.all.find((condition: { content?: RegExp }) => condition.content).content as RegExp

    expect(content.test('@master entry;\n.main { color: red; }')).toBe(true)
    expect(content.test('@master { mode-trigger: media; }')).toBe(true)
    expect(content.test('.main { color: red; }')).toBe(false)
  })

  /**
   * Guards the reverse order: withStetCSS must chain the inner wrapper's webpack hook, or that
   * wrapper's loaders and aliases silently disappear.
   * Reverse check: not calling the user's `webpack` from withStetCSS turns it red.
   */
  it('wraps another wrapper and still runs its webpack hook', () => {
    const onWebpack = vi.fn()
    const nextConfig = withStetCSS(withX({}, onWebpack))

    const webpackConfig = runWebpack(nextConfig)

    expect(onWebpack).toHaveBeenCalledTimes(1)
    expect(nextConfig.poweredByHeader).toBe(false)
    expect(findLoaders(webpackConfig.module.rules, 'generated-css-loader.js')).toHaveLength(1)
  })

  /**
   * Guards that withStetCSS adds to the user's Turbopack config instead of replacing it.
   * Reverse check: dropping the user's `'*'` rules from the merged list turns it red.
   */
  it('keeps the user Turbopack rules and aliases', () => {
    const userStarRule = { loaders: ['user-loader'] }
    const nextConfig = withStetCSS({
      turbopack: {
        rules: {
          '*.svg': { type: 'asset' },
          '*': userStarRule
        },
        resolveAlias: { '@app': './app' }
      }
    })

    expect(nextConfig.turbopack!.rules!['*.svg']).toEqual({ type: 'asset' })
    expect(nextConfig.turbopack!.rules!['*']).toContain(userStarRule)
    const resolveAlias = nextConfig.turbopack!.resolveAlias as Record<string, string>
    expect(resolveAlias['@app']).toBe('./app')
    expect(resolveAlias[VIRTUAL_CSS_ID]).toBe('./.stet/next.css')
  })

  /**
   * Guards #57's removal: no adapter export, no adapter path and no instrumentation client
   * alias, so nothing renders HTML or injects the runtime.
   * Reverse check: re-adding an `adapterPath` to the returned config turns it red.
   */
  it('exports no adapter and adds no adapter or instrumentation client', async () => {
    const nextConfig = withStetCSS({}) as NextConfig & { adapterPath?: string }
    const webpackConfig = runWebpack(nextConfig)

    const exports = Object.keys(await import('../src'))
    expect(exports).toContain('withStetCSS')
    expect(exports.filter((name) => /adapter|renderNextBuildOutputs/i.test(name))).toEqual([])
    expect(nextConfig.adapterPath).toBeUndefined()
    expect(Object.keys(nextConfig.turbopack!.resolveAlias!).filter((id) => id.includes('instrumentation'))).toEqual([])
    expect(Object.keys(webpackConfig.resolve.alias).filter((id) => id.includes('instrumentation'))).toEqual([])
  })

  /**
   * Guards that a removed or misspelled option fails when Next loads the config and names the
   * one allowed key, instead of building without what the developer asked for.
   * Reverse check: dropping the `validatePluginOptions` call in `src/index.ts` turns only this
   * test red.
   */
  it('rejects removed and unknown options', () => {
    expect(() => withStetCSS({}, { scannerOptions: { adapters: [] } } as never))
      .toThrow('@stet-css/next option "scannerOptions" was removed; pass "adapters" directly.')
    expect(() => withStetCSS({}, { mode: 'progressive' } as never))
      .toThrow('@stet-css/next option "mode" was removed; static CSS is the only output')
    expect(() => withStetCSS({}, { adapter: [] } as never))
      .toThrow('Unknown @stet-css/next option "adapter"; the only option is "adapters".')
  })

  /**
   * Guards that custom adapters under Turbopack fail loudly: Turbopack hands loader options to
   * its workers as JSON, which drops the adapter functions, so the build would silently leave
   * out every class only the adapters find.
   * Reverse check: dropping the `process.env.TURBOPACK` check in `src/index.ts` turns this
   * test and the Turbopack case in `adapters-e2e.test.ts` red.
   */
  it('rejects custom adapters under Turbopack', () => {
    vi.stubEnv('TURBOPACK', 'auto')
    try {
      const adapters = [{ name: 'probe', test: /\.md$/, extract: async () => [] }]
      expect(() => withStetCSS({}, { adapters }))
        .toThrow('[@stet-css/next] Custom adapters need webpack')
      expect(() => withStetCSS({}, { adapters: [] })).not.toThrow()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
