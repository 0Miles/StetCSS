import { defineNuxtModule } from '@nuxt/kit'
import { name } from '../package.json'
import masterCSS from '@stet-css/vite'
import type { Plugin, ResolvedConfig } from 'vite'
import type { ModuleOptions } from './options'

export type { ModuleOptions } from './options'

/**
 * Hands each plugin's `configResolved` a Vite config whose `root` is the Nuxt project root.
 * Nuxt sets Vite's root to `srcDir` (`app/`), and the plugin chain reads its project root,
 * and so the class set's files, from `config.root`: without this, classes in `layers/`,
 * `server/` and every other directory beside `app/` would be missing.
 */
function withProjectRoot(plugins: Plugin[], projectRoot: string): Plugin[] {
  return plugins.map((plugin) => {
    const hook = plugin.configResolved
    if (!hook) return plugin
    const handler = typeof hook === 'function' ? hook : hook.handler
    function configResolved(this: unknown, config: ResolvedConfig) {
      const projectConfig = new Proxy(config, {
        get: (target, key, receiver) => key === 'root' ? projectRoot : Reflect.get(target, key, receiver)
      })
      return handler.call(this as ThisParameterType<typeof handler>, projectConfig)
    }
    return {
      ...plugin,
      configResolved: typeof hook === 'function' ? configResolved : { ...hook, handler: configResolved }
    }
  })
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    configKey: 'mastercss'
  },
  setup(options, nuxt) {
    if (nuxt.options._prepare) return
    // Fix: [plugin ssr-styles] Cannot inline generated static CSS during SSR.
    if (nuxt.options.features?.inlineStyles)
      nuxt.options.features.inlineStyles = false
    nuxt.hook('vite:extendConfig', (viteConfig) => {
      const plugins = withProjectRoot(masterCSS({ scanner: options.scanner }) as unknown as Plugin[], nuxt.options.rootDir)
      if (viteConfig.plugins) viteConfig.plugins.push(...plugins as never[])
      else Object.assign(viteConfig, { plugins })
    })
  }
})
