import type { PluginOptions } from '@stet-css/vite'

export interface ModuleOptions {
  /**
   * Scanner options passed through to `@stet-css/vite`.
   */
  scanner?: PluginOptions['scanner']
}
