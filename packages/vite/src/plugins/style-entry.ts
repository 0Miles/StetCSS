import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
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

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

function markPlaceholderEmitted(context: PluginContext, pluginContext: unknown) {
  context.virtualCSSPlaceholderEnvironments ??= new Set()
  context.virtualCSSPlaceholderEnvironments.add(getEnvironmentName(pluginContext))
}

export default function StyleEntryPlugin(_options: PluginOptions, context: PluginContext): Plugin {
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

      if (context.config?.command === 'serve') {
        return await getExtractedCSS(context)
      }

      markPlaceholderEmitted(context, this)
      return getScanner(context).slotCSSRule
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

      const masterSource = context.config?.command === 'serve'
        ? await getExtractedCSS(context)
        : getScanner(context).slotCSSRule

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
