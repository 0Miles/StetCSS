import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import type { PluginContext } from '../core'
import getExtractedCSS from '../utils/extracted-css'
import {
  collectStyleCSSDependencies,
  createStyleCSSHostSource,
  isStetCSSPackageStyleFile,
  isStyleCSSRequest,
  removeStetStyleDirectives,
  resolveStetStyleSource
} from '@stet-css/stylesheet'
import { updateStyleCSSSource } from '../utils/register-style-source'
import { getScanner } from '../utils/scanner-context'
import { getEnvironmentName } from '../utils/environment'
import { getProjectDir } from '../utils/project-dir'
import { createSlotCSSRule } from '../utils/slot'
import { collectLayerStatementsBeforeImports } from '../utils/layer-order'
import { createBuildExtraction } from '../utils/build-digest'
import { invalidateEmittedGlobalsModule } from '../utils/emitted-globals-module'

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

function markPlaceholderEmitted(context: PluginContext, pluginContext: unknown) {
  context.virtualCSSPlaceholderEnvironments ??= new Set()
  context.virtualCSSPlaceholderEnvironments.add(getEnvironmentName(pluginContext))
}

/**
 * The generated CSS in dev. In a build, the placeholder `generateBundle` swaps it into, with the
 * CSS it stands for as `layerSource`: every entry's leading layers lead that CSS (#250), so a host
 * statement listing only its own entry's layers would sort the others after a kept import.
 */
async function createStetSource(context: PluginContext): Promise<{ source: string, layerSource?: string }> {
  if (context.config?.command === 'serve') return { source: await getExtractedCSS(context) }
  const { css, digest } = await createBuildExtraction(context)
  return { source: createSlotCSSRule(getScanner(context).slotCSSRule, digest), layerSource: css }
}

export default function StyleEntryPlugin(context: PluginContext): Plugin {
  return {
    name: 'stet-css:style-entry',
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

      const { source } = await createStetSource(context)
      if (context.config?.command !== 'serve') markPlaceholderEmitted(context, this)
      return source
    },
    async transform(code, id) {
      if (id.startsWith('\0')) return
      if (!isStyleCSSRequest(id)) return
      const projectDir = getProjectDir(context)
      const dependencies = new Set<string>()
      let resolvedStyleSource: ReturnType<typeof resolveStetStyleSource>
      try {
        resolvedStyleSource = resolveStetStyleSource(id, code, projectDir)
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

      if (isStetCSSPackageStyleFile(id, projectDir)) {
        return {
          code: removeStetStyleDirectives(code).code,
          map: null
        }
      }

      const { result, changed: registrationChanged } = await updateStyleCSSSource(context, id, code)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        this.addWatchFile?.(dependency)
      }

      const stetSource = await createStetSource(context)

      if (context.config?.command === 'serve') {
        context.virtualCSSImporters ??= new Set()
        context.virtualCSSImporters.add(id)
        // A first registration, or an edit the hot-update hook did not register already: the
        // entry's theme and directives decide the emitted variables.
        if (registrationChanged) invalidateEmittedGlobalsModule(context.server)
      } else {
        markPlaceholderEmitted(context, this)
      }

      const isServe = context.config?.command === 'serve'
      const hostSource = createStyleCSSHostSource(code, {
        stetSource: stetSource.source,
        // A build splices the CSS into the placeholder later; its layers come from that CSS.
        ...(stetSource.layerSource === undefined ? {} : { stetLayerSource: stetSource.layerSource })
      })
      if (!isServe) {
        // Vite hoists the kept imports past these statements; generateBundle moves them back.
        for (const statement of collectLayerStatementsBeforeImports(hostSource)) {
          (context.hostLayerStatements ??= new Set()).add(statement)
        }
      }
      return {
        code: hostSource,
        map: null
      }
    }
  }
}
