import { defineNuxtModule } from '@nuxt/kit'
import { resolve } from 'node:path'
import { name } from '../package.json'
import masterCSS, { type PluginHost } from '@stet-css/vite'
import type { ModuleOptions } from './options'

export type { ModuleOptions } from './options'

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
    const { rootDir } = nuxt.options
    // Nuxt sets Vite's root to `srcDir` (`app/`): the class set reads the Nuxt root instead,
    // plus every layer, which `extends` can place outside the root or under `node_modules`.
    const host: PluginHost = {
      name,
      projectDir: rootDir,
      extraProjectDirs: [...new Set(nuxt.options._layers.flatMap((layer) => [layer.config.rootDir, layer.config.srcDir]))]
        .filter((dir) => dir && resolve(dir) !== resolve(rootDir)),
      // A custom `buildDir` would feed built bundles back; `.output` is ignored by default.
      ignorePaths: [nuxt.options.buildDir]
    }
    nuxt.hook('vite:extendConfig', (viteConfig) => {
      const plugins = masterCSS(options, host)
      if (viteConfig.plugins) viteConfig.plugins.push(...plugins as never[])
      else Object.assign(viteConfig, { plugins })
    })
  }
})
