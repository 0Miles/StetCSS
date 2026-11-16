import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import type { PluginContext } from '../core'
import getExtractedCSS from '../utils/extracted-css'
import {
  collectStyleCSSDependencies,
  createStyleCSSHostSource,
  isMasterCSSPackageStyleFile,
  isStyleCSSRequest,
  removeMasterStyleDirectives,
  resolveMasterStyleSource
} from '@stet-css/stylesheet'
import { registerStyleCSSSource } from '../utils/register-style-source'
import { getScanner } from '../utils/scanner-context'
import { getEnvironmentName } from '../utils/environment'
import { getProjectDir } from '../utils/project-dir'
import { createSlotCSSRule } from '../utils/slot'
import { createBuildDigest } from '../utils/build-digest'

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

function markPlaceholderEmitted(context: PluginContext, pluginContext: unknown) {
  context.virtualCSSPlaceholderEnvironments ??= new Set()
  context.virtualCSSPlaceholderEnvironments.add(getEnvironmentName(pluginContext))
}

/** The generated CSS in dev; in a build, the placeholder `generateBundle` swaps it into. */
async function createMasterSource(context: PluginContext) {
  if (context.config?.command === 'serve') return await getExtractedCSS(context)
  return createSlotCSSRule(getScanner(context).slotCSSRule, await createBuildDigest(context))
}

export default function StyleEntryPlugin(context: PluginContext): Plugin {
  return {
    name: 'master-css:style-entry',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_CSS_ID || id === RESOLVED_VIRTUAL_CSS_ID) {
        return RESOLVED_VIRTUAL_CSS_ID
      }
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_CSS_ID) return

      context.virtualCSSImporters ??= new Set()
      context.virtualCSSImporters.add(RESOLVED_VIRTUAL_CSS_ID)

      const masterSource = await createMasterSource(context)
      if (context.config?.command !== 'serve') markPlaceholderEmitted(context, this)
      return masterSource
    },
    async transform(code, id) {
      if (id.startsWith('\0')) return
      if (!isStyleCSSRequest(id)) return
      const projectDir = getProjectDir(context)
      const dependencies = new Set<string>()
      let resolvedStyleSource: ReturnType<typeof resolveMasterStyleSource>
      try {
        resolvedStyleSource = resolveMasterStyleSource(id, code, projectDir)
      } catch (error) {
        for (const dependency of collectStyleCSSDependencies(id, code, projectDir)) {
          dependencies.add(dependency)
          this.addWatchFile?.(dependency)
        }
        throw error
      }
      if (!resolvedStyleSource) return

      for (const dependency of collectStyleCSSDependencies(id, code, projectDir)) {
        dependencies.add(dependency)
        this.addWatchFile?.(dependency)
      }

      if (isMasterCSSPackageStyleFile(id, projectDir)) {
        return {
          code: removeMasterStyleDirectives(code).code,
          map: null
        }
      }

      const result = await registerStyleCSSSource(context, id, code)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        this.addWatchFile?.(dependency)
      }

      const masterSource = await createMasterSource(context)

      if (context.config?.command === 'serve') {
        context.virtualCSSImporters ??= new Set()
        context.virtualCSSImporters.add(id)
      } else {
        markPlaceholderEmitted(context, this)
      }

      return {
        code: createStyleCSSHostSource(code, { masterSource }),
        map: null
      }
    }
  }
}
