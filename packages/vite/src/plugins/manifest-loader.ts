import type { ModuleNode, Plugin } from 'vite'
import type { PluginContext } from '../core'
import {
  fromResolvedMasterCSSManifestId,
  toResolvedMasterCSSManifestId
} from '@stet-css/integration/node'
import { loadManifestJSON } from '@stet-css/project/manifest'
import { isCSSManifestRequest } from '@stet-css/project/entries'
import {
  isMasterCSSManifestRequest,
  stripMasterCSSManifestQuery
} from '@stet-css/integration/manifest-module'
import { collectStyleCSSDependencies } from '@stet-css/stylesheet'
import { includesFile } from '../utils/path'
import { getProjectDir } from '../utils/project-dir'
import { addServerAllow, createManifestModule, invalidateManifestModule } from '../utils/manifest-module'

export default function ManifestLoaderPlugin(context: PluginContext): Plugin {
  const cssManifestDependencies = new Map<string, string[]>()
  const watchManifestDependencies = (manifestPath: string, dependencies: string[] = []) => {
    cssManifestDependencies.set(manifestPath, dependencies)
    addServerAllow(context, dependencies)
  }
  return {
    name: 'stet-css:manifest-loader',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!isMasterCSSManifestRequest(id)) return
      const sourceId = stripMasterCSSManifestQuery(id)
      const resolved = await this.resolve(sourceId, importer, { skipSelf: true })
      if (resolved) return toResolvedMasterCSSManifestId(resolved.id)
    },
    async load(id) {
      const manifestPath = fromResolvedMasterCSSManifestId(id)
      if (!manifestPath) return
      if (!isCSSManifestRequest(manifestPath)) {
        throw new TypeError('Master CSS manifest queries only support CSS entry files.')
      }
      const dependencies = new Set(collectStyleCSSDependencies(manifestPath, undefined, getProjectDir(context)))
      for (const dependency of dependencies) {
        this.addWatchFile(dependency)
      }
      watchManifestDependencies(manifestPath, [...dependencies])
      const result = await loadManifestJSON(manifestPath)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        dependencies.add(dependency)
        this.addWatchFile(dependency)
      }
      watchManifestDependencies(manifestPath, [...dependencies])
      return createManifestModule(context, this, result.json)
    },
    async handleHotUpdate({ file, modules: changedModules, server }) {
      // Vite updates only the modules a hook returns: keep the changed file's own modules.
      const modules: ModuleNode[] = [...changedModules]
      const queryManifestPaths = new Set([file])
      for (const [manifestPath, dependencies] of cssManifestDependencies) {
        if (includesFile(dependencies, file)) queryManifestPaths.add(manifestPath)
      }
      for (const manifestPath of queryManifestPaths) {
        const queryModule = server.moduleGraph.getModuleById(toResolvedMasterCSSManifestId(manifestPath))
        if (!queryModule) continue
        modules.push(...invalidateManifestModule(queryModule, server))
      }
      if (modules.length > changedModules.length) return modules
    }
  }
}
