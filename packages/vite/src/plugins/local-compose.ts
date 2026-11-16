import type { Plugin } from 'vite'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { findCSSManifestEntryFiles } from '@stet-css/project/entries'
import {
  collectStyleCSSDependencies,
  createStyleEntryEmittedGlobals,
  hasLocalStyleDirectives,
  isStyleCSSRequest,
  resolveStetStyleSource,
  transformLocalStyleCSS
} from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { includesFile } from '../utils/path'
import { getProjectDir } from '../utils/project-dir'
import { addServerAllow } from '../utils/manifest-module'

export default function LocalComposePlugin(context: PluginContext): Plugin {
  let projectManifest: Awaited<ReturnType<typeof loadProjectManifest>> | undefined
  let projectManifestEntries: string[] = []
  let projectManifestDependencies: string[] = []
  let styleEntryEmittedGlobals: Awaited<ReturnType<typeof createStyleEntryEmittedGlobals>> | undefined
  const localComposeModules = new Set<string>()


  const loadComposeContext = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    if (projectManifest) return projectManifest
    const root = getProjectDir(context)
    const entries = await findCSSManifestEntryFiles(root)
    projectManifestEntries = entries
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStyleCSSDependencies(entry, undefined, root)) {
        dependencies.add(dependency)
      }
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(context, projectManifestDependencies)
    for (const dependency of projectManifestDependencies) {
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifest = await loadProjectManifest(root, { entries })
    for (const dependency of projectManifest.dependencies) {
      if (dependencies.has(dependency)) continue
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(context, projectManifestDependencies)
    return projectManifest
  }

  const loadStyleEntryEmittedGlobals = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    const manifestResult = await loadComposeContext(pluginContext)
    if (styleEntryEmittedGlobals) return styleEntryEmittedGlobals
    const dependencies = new Set(projectManifestDependencies)
    styleEntryEmittedGlobals = await createStyleEntryEmittedGlobals(projectManifestEntries, {
      baseManifest: manifestResult.manifest,
      projectDir: getProjectDir(context)
    })
    for (const dependency of styleEntryEmittedGlobals.dependencies) {
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(context, projectManifestDependencies)
    return styleEntryEmittedGlobals
  }

  return {
    name: 'stet-css:local-compose',
    enforce: 'pre',
    async buildStart() {
      projectManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
      styleEntryEmittedGlobals = undefined
    },
    async transform(code, id) {
      if (id.startsWith('\0')) return
      if (!isStyleCSSRequest(id)) return
      if (!hasLocalStyleDirectives(code)) return
      if (resolveStetStyleSource(id, code, getProjectDir(context))) return

      const dependencies = new Set(collectStyleCSSDependencies(id, code, getProjectDir(context)))
      for (const dependency of dependencies) {
        this.addWatchFile?.(dependency)
      }
      const manifestResult = await loadComposeContext(this)
      const emittedGlobalsResult = await loadStyleEntryEmittedGlobals(this)
      const result = await transformLocalStyleCSS(id, code, {
        baseManifest: manifestResult.manifest,
        projectDir: getProjectDir(context),
        emittedGlobals: emittedGlobalsResult.emittedGlobals
      })
      if (!result.transformed) return
      localComposeModules.add(id)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        this.addWatchFile?.(dependency)
      }
      return {
        code: result.code,
        map: null
      }
    },
    async handleHotUpdate({ file, server }) {
      if (!includesFile(projectManifestDependencies, file)) return
      projectManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
      styleEntryEmittedGlobals = undefined
      // Reload the compose modules and return nothing, so the changed file keeps its own update:
      // a returned list would replace Vite's.
      for (const moduleId of localComposeModules) {
        const module = server.moduleGraph.getModuleById(moduleId)
        if (!module) continue
        server.moduleGraph.invalidateModule(module)
        await server.reloadModule(module)
      }
    }
  }
}
