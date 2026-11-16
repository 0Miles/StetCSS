import type { PluginContext } from '../core'

/** The project root every plugin resolves against: the integration host's, or Vite's `root`. */
export function getProjectDir(context: PluginContext) {
  return context.host?.projectDir ?? context.config?.root
}
