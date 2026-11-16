import { describe, expect, it, vi } from 'vitest'
import vitePlugin from '@stet-css/vite'
import masterCSS from '../src/core'

const STATIC_PLUGIN_NAMES = vitePlugin({ mode: 'static' }).map(({ name }) => name)

describe('@stet-css/astro integration', () => {
  /**
   * Guards configs written for the removed modes: Astro no longer injects the runtime or
   * renders CSS through middleware, so a JavaScript config that still passes
   * `mode: 'runtime'` (or progressive, pre-render, null) must keep getting static CSS
   * instead of a Vite chain that leaves Astro pages unstyled.
   * Reverse check: spreading `options` after `mode: 'static'` in `src/core.ts` turns only
   * this test red.
   */
  it('stays static when an untyped config passes a removed rendering mode', async () => {
    for (const options of [
      { mode: 'runtime', injectRuntime: true, avoidFOUC: true },
      { mode: 'progressive' },
      { mode: 'pre-render' },
      { mode: null }
    ]) {
      const updateConfig = vi.fn()
      await masterCSS(options as never).hooks['astro:config:setup']?.({ updateConfig } as never)
      const plugins = (updateConfig.mock.calls[0][0].vite.plugins as unknown[]).flat(Infinity) as { name?: string }[]

      expect(plugins.map(({ name }) => name)).toEqual(STATIC_PLUGIN_NAMES)
    }
  })
})
