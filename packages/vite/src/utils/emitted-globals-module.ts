import type { ViteDevServer } from 'vite'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID } from '../common'

/**
 * Drops every environment's cached `virtual:stet-css-emitted-globals`, so its next import
 * extracts again. Dev serves a loaded module until it is invalidated, while the managed CSS
 * it describes follows the project's files: a stale list makes the runtime skip a variable
 * the CSS no longer defines.
 */
export function invalidateEmittedGlobalsModule(server: ViteDevServer | undefined) {
  for (const environment of Object.values(server?.environments ?? {})) {
    const module = environment.moduleGraph.getModuleById(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)
    if (module) environment.moduleGraph.invalidateModule(module)
  }
}
