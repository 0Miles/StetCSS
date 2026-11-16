import type { ModuleNode, ViteDevServer } from 'vite'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toUniversalManifestFacadeModule
} from '@stet-css/integration/manifest-facade'
import type { PluginContext } from '../core'

export function invalidateManifestModule(module: ModuleNode | undefined, server: ViteDevServer): ModuleNode[] {
  if (!module) return []
  server.moduleGraph.invalidateModule(module)
  return [module]
}

export function isProductionBuild(context: PluginContext) {
  return context.config?.command === 'build'
}

/** Lets the dev server serve files outside the root that a manifest depends on. */
export function addServerAllow(context: PluginContext, paths: string[]) {
  const allow = context.config?.server.fs.allow
  if (!allow) return
  for (const path of paths) {
    if (!allow.includes(path)) allow.push(path)
  }
}

/** Inline in dev; in a build, an emitted asset loaded through the browser or universal facade. */
export function createManifestModule(
  context: PluginContext,
  pluginContext: { emitFile?: (asset: { type: 'asset', name: string, source: string }) => string },
  json: string
) {
  if (!isProductionBuild(context) || !pluginContext.emitFile) return toInlineManifestModule(json)
  const referenceId = pluginContext.emitFile({
    type: 'asset',
    name: MANIFEST_ASSET_FILE,
    source: json
  })
  const urlExpression = `import.meta.ROLLUP_FILE_URL_${referenceId}`
  return context.config?.build.ssr
    ? toUniversalManifestFacadeModule(urlExpression)
    : toBrowserManifestFacadeModule(urlExpression)
}
