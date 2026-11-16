import { mkdtempSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { NextConfig } from 'next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import withMasterCSS from '../src'
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

describe('withMasterCSS', () => {
  /**
   * Guards #57: an outer wrapper cannot spread a Promise, as static mode used to return, and
   * must still reach the Turbopack rules and webpack hook withMasterCSS added.
   * Reverse check: making withMasterCSS return `Promise.resolve(config)` turns it red.
   */
  it('composes inside another wrapper and keeps both webpack hooks', () => {
    const onWebpack = vi.fn()
    const nextConfig = withX(withMasterCSS({ reactStrictMode: true }), onWebpack)

    expect(nextConfig).not.toBeInstanceOf(Promise)
    expect(nextConfig.reactStrictMode).toBe(true)
    expect(nextConfig.poweredByHeader).toBe(false)
    expect(findLoaders(nextConfig.turbopack!.rules!['*'] as unknown[], 'generated-css-loader.js')).toHaveLength(1)

    const webpackConfig = runWebpack(nextConfig)

    expect(onWebpack).toHaveBeenCalledTimes(1)
    expect(findLoaders(webpackConfig.module.rules, 'generated-css-loader.js')).toHaveLength(1)
    expect(findLoaders(webpackConfig.module.rules, 'style-css-loader.js')).toHaveLength(1)
    expect(webpackConfig.resolve.alias[VIRTUAL_CSS_ID]).toBe(join(projectDir, '.master/next.css'))
  })

  /**
   * Guards the reverse order: withMasterCSS must chain the inner wrapper's webpack hook, or that
   * wrapper's loaders and aliases silently disappear.
   * Reverse check: not calling the user's `webpack` from withMasterCSS turns it red.
   */
  it('wraps another wrapper and still runs its webpack hook', () => {
    const onWebpack = vi.fn()
    const nextConfig = withMasterCSS(withX({}, onWebpack))

    const webpackConfig = runWebpack(nextConfig)

    expect(onWebpack).toHaveBeenCalledTimes(1)
    expect(nextConfig.poweredByHeader).toBe(false)
    expect(findLoaders(webpackConfig.module.rules, 'generated-css-loader.js')).toHaveLength(1)
  })

  /**
   * Guards that withMasterCSS adds to the user's Turbopack config instead of replacing it.
   * Reverse check: dropping the user's `'*'` rules from the merged list turns it red.
   */
  it('keeps the user Turbopack rules and aliases', () => {
    const userStarRule = { loaders: ['user-loader'] }
    const nextConfig = withMasterCSS({
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
    expect(resolveAlias[VIRTUAL_CSS_ID]).toBe('./.master/next.css')
  })

  /**
   * Guards #57's removal: no adapter export, no adapter path and no instrumentation client
   * alias, so nothing renders HTML or injects the runtime.
   * Reverse check: re-adding an `adapterPath` to the returned config turns it red.
   */
  it('exports no adapter and adds no adapter or instrumentation client', async () => {
    const nextConfig = withMasterCSS({}) as NextConfig & { adapterPath?: string }
    const webpackConfig = runWebpack(nextConfig)

    const exports = Object.keys(await import('../src'))
    expect(exports).toContain('withMasterCSS')
    expect(exports.filter((name) => /adapter|renderNextBuildOutputs/i.test(name))).toEqual([])
    expect(nextConfig.adapterPath).toBeUndefined()
    expect(Object.keys(nextConfig.turbopack!.resolveAlias!).filter((id) => id.includes('instrumentation'))).toEqual([])
    expect(Object.keys(webpackConfig.resolve.alias).filter((id) => id.includes('instrumentation'))).toEqual([])
  })
})
