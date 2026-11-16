import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import vitePlugin from '@stet-css/vite'
import masterCSS from '../src/core'

const STATIC_PLUGIN_NAMES = vitePlugin({ mode: 'static' }).map(({ name }) => name)

async function setup(options?: Parameters<typeof masterCSS>[0]) {
  const addMiddleware = vi.fn()
  const injectScript = vi.fn()
  const updateConfig = vi.fn()

  await masterCSS(options).hooks['astro:config:setup']?.({
    addMiddleware,
    injectScript,
    updateConfig
  } as never)

  expect(updateConfig).toHaveBeenCalledTimes(1)
  const config = updateConfig.mock.calls[0][0] as { vite: { plugins: unknown[] } & Record<string, unknown> }
  const plugins = config.vite.plugins.flat(Infinity) as { name?: string }[]

  return {
    addMiddleware,
    injectScript,
    pluginNames: plugins.map(({ name }) => name),
    viteConfig: config.vite
  }
}

describe('@stet-css/astro integration', () => {
  it('uses the static Vite plugin chain with no options', async () => {
    const result = await setup()

    expect(result.pluginNames).toEqual(STATIC_PLUGIN_NAMES)
    expect(result.pluginNames).not.toContain('master-css:pre-render')
    expect(result.pluginNames).not.toContain('master-css:inject-runtime')
    expect(result.pluginNames).not.toContain('master-css:avoid-fouc')
  })

  it('adds no middleware, runtime script or server externals', async () => {
    const result = await setup()

    expect(result.addMiddleware).not.toHaveBeenCalled()
    expect(result.injectScript).not.toHaveBeenCalled()
    expect(Object.keys(result.viteConfig)).toEqual(['plugins'])
  })

  it('stays static when an untyped config passes a rendering mode', async () => {
    for (const options of [
      { mode: 'runtime', injectRuntime: true, avoidFOUC: true },
      { mode: 'progressive' },
      { mode: 'pre-render' },
      { mode: null }
    ]) {
      const result = await setup(options as never)

      expect(result.pluginNames).toEqual(STATIC_PLUGIN_NAMES)
      expect(result.addMiddleware).not.toHaveBeenCalled()
      expect(result.injectScript).not.toHaveBeenCalled()
    }
  })

  it('registers no hook that rewrites the built HTML', () => {
    expect(Object.keys(masterCSS().hooks)).toEqual(['astro:config:setup'])
  })

  it('exports no middleware entry and does not depend on @stet-css/server', () => {
    const packageJSON = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      exports: Record<string, unknown>,
      dependencies?: Record<string, string>,
      devDependencies?: Record<string, string>
    }

    expect(Object.keys(packageJSON.exports)).toEqual(['.'])
    expect(packageJSON.dependencies).not.toHaveProperty('@stet-css/server')
    expect(packageJSON.devDependencies ?? {}).not.toHaveProperty('@stet-css/server')
  })
})
