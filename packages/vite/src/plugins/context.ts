import type { Plugin } from 'vite'
import type { PluginContext } from '../core'

export default function ContextPlugin(context: PluginContext): Plugin {
  return {
    name: 'stet-css:context',
    enforce: 'pre',
    configResolved(config) {
      context.config = config
    },
    configureServer(server) {
      context.server = server
    }
  }
}
