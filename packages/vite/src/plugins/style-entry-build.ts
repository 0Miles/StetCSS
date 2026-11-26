import type { Plugin } from 'vite'
import { collectStyleCSSLeadingLayers } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import getExtractedCSS, { getStylesheetSourceContext } from '../utils/extracted-css'
import { getScanner } from '../utils/scanner-context'
import { getEnvironmentName } from '../utils/environment'
import { createSlotCSSRulePattern, getSlotSelector } from '../utils/slot'
import { createBuildDigest } from '../utils/build-digest'
import { restoreLayerStatementsBeforeImports } from '../utils/layer-order'

/**
 * Puts the generated CSS where the first placeholder was and drops the others; `digests` are
 * the digests the placeholders carried, which named the asset.
 */
function replaceSlotCSSRules(source: string, slotPattern: RegExp, realCSS: string) {
  const digests: string[] = []
  const nextSource = source.replace(slotPattern, (_, digest: string) => {
    digests.push(digest)
    return digests.length === 1 ? realCSS : ''
  })
  return { source: nextSource, digests }
}

export const NO_STYLE_ENTRY_WARNING =
  '[stet-css.vite] No stylesheet in this build imports StetCSS, so no StetCSS rules ' +
  'were generated. Import \'@stet-css/core\' from a .css file that your app imports. ' +
  'Astro inlines @import inside .astro <style> blocks before Vite plugins see it, so an ' +
  'import written there ships the raw preset source instead.'

export default function StyleEntryBuildPlugin(context: PluginContext): Plugin {
  let warnedNoStyleEntry = false
  return {
    name: 'stet-css:style-entry:build',
    enforce: 'pre',
    apply: 'build',
    async generateBundle(_options, bundle) {
      // No environment built so far registered a managed CSS entry. Frameworks that build
      // several environments share one context, so a later environment without CSS (Astro's
      // client build after its server build) stays quiet once any entry was seen.
      if (!context.virtualCSSPlaceholderEnvironments?.size && !warnedNoStyleEntry) {
        warnedNoStyleEntry = true
        this.warn(NO_STYLE_ENTRY_WARNING)
      }
      const slotCSSRule = getScanner(context).slotCSSRule
      const slotPattern = createSlotCSSRulePattern(slotCSSRule)
      const realCSS = await getExtractedCSS(context)
      // Every entry the build imports has registered by now; the spliced CSS leads with these.
      const leadingLayers = collectStyleCSSLeadingLayers(getStylesheetSourceContext(context).styleCSSSources)
      const buildDigest = await createBuildDigest(context)
      const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
      const staleFileNames: string[] = []
      let replacedAny = false
      for (const eachCssFileName of cssFileNames) {
        const chunk = bundle[eachCssFileName]
        if (chunk.type === 'asset') {
          const oldSource = String(chunk.source)
          const result = replaceSlotCSSRules(oldSource, slotPattern, realCSS)
          if (!result.digests.length) continue
          chunk.source = restoreLayerStatementsBeforeImports(result.source, context.hostLayerStatements ?? new Set(), leadingLayers)
          replacedAny = true
          if (!result.digests.includes(buildDigest)) staleFileNames.push(eachCssFileName)
        }
      }
      // Each placeholder carries the build's digest from when its stylesheet was transformed.
      // It covers every entry discovery finds, so only an entry discovery misses (one outside
      // the project root, a framework's style block) that registered later can leave an
      // asset named after an earlier version of the CSS now spliced in.
      if (staleFileNames.length) {
        this.warn(
          `[stet-css.vite] ${staleFileNames.join(', ')}: the file name was hashed before ` +
          `every stylesheet that imports StetCSS was read, so it may not change when its ` +
          `CSS does and caches can keep serving the old file. Keep stylesheets that import ` +
          `'@stet-css/core' as .css, .scss or .sass files inside the project root.`
        )
      }
      // A managed CSS import in this environment emitted the placeholder but
      // no CSS chunk in its bundle still contained it. A downstream CSS
      // plugin or minifier likely rewrote or dropped the internal slot.
      // Each environment is checked against its own placeholder only: Astro
      // and other multi-environment builds bundle prerender, server and
      // client separately.
      const placeholderEmitted = context.virtualCSSPlaceholderEnvironments?.has(getEnvironmentName(this))
      if (placeholderEmitted && !replacedAny && realCSS.length > 0) {
        this.warn(
          `[stet-css.vite] Could not splice managed style CSS into any bundle asset. ` +
          `The placeholder rule "${getSlotSelector(slotCSSRule)}" was emitted but no CSS chunk in the final ` +
          `bundle still contained it — Vite's downstream CSS pipeline (a PostCSS ` +
          `plugin in your vite config, the bundler's CSS minifier, etc.) most likely ` +
          `rewrote or dropped it. The output will be missing StetCSS output.`
        )
      }
    }
  }
}
