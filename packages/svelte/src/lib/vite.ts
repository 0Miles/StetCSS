import baseVite, { type PluginOptions } from '@stet-css/vite'
import type { Plugin } from 'vite'

export default function stetCSS(options?: PluginOptions): Plugin[] {
  return baseVite(options, { name: '@stet-css/svelte' })
}
