import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { findCSSManifestEntryFiles } from '@stet-css/project/entries'
import { toManifestJSON } from '@stet-css/integration/manifest-module'
import { RESOLVED_VIRTUAL_MANIFEST_ID, VIRTUAL_MANIFEST_ID } from '../common'
import { collectStyleCSSDependencies } from '@stet-css/stylesheet'
import { includesFile } from '../utils/path'
import { getProjectDir } from '../utils/project-dir'
import { addServerAllow, createManifestModule, invalidateManifestModule, isProductionBuild } from '../utils/manifest-module'

export default function ManifestVirtualModulePlugin(context: PluginContext): Plugin {
  let cssManifestDependencies: string[] = []
  const loadDefaultManifest = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    const root = getProjectDir(context)
    const entries = await findCSSManifestEntryFiles(root)
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStyleCSSDependencies(entry, undefined, root)) {
        dependencies.add(dependency)
      }
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(context, cssManifestDependencies)
    for (const dependency of cssManifestDependencies) {
      pluginContext.addWatchFile?.(dependency)
    }
    const result = await loadProjectManifest(root, { entries })
    for (const dependency of result.dependencies) {
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(context, cssManifestDependencies)
    return result
  }
  return {
    name: 'stet-css:virtual-module:manifest',
    enforce: 'pre',
    async buildStart() {
      if (isProductionBuild(context)) return
      await loadDefaultManifest(this)
    },
    async resolveId(id) {
      if (id === VIRTUAL_MANIFEST_ID) return RESOLVED_VIRTUAL_MANIFEST_ID
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MANIFEST_ID) {
        return createManifestModule(context, this, toManifestJSON((await loadDefaultManifest(this)).manifest))
      }
    },
    async handleHotUpdate({ file, modules: changedModules, server }) {
      if (!includesFile(cssManifestDependencies, file)) return
      // Vite updates only the modules a hook returns: keep the changed file's own modules.
      return [
        ...changedModules,
        ...invalidateManifestModule(server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MANIFEST_ID), server)
      ]
    }
  }
}
