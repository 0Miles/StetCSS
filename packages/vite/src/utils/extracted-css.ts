import { createExtractedCSSResult, type StyleCSSSources, type StylesheetSourceContext } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getProjectDir } from './project-dir'
import { collectProjectLeadingLayers } from './project-entries'

/**
 * The registered entries in path order. Vite transforms modules concurrently, so they register
 * in a different order from build to build; the generated CSS must not follow that order.
 */
function sortStyleCSSSources(styleCSSSources: StyleCSSSources | undefined) {
  if (!styleCSSSources) return
  return new Map([...styleCSSSources].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

/** What decides the class set; shared by extraction and the dev watcher's file filter. */
export function getStylesheetSourceContext(context: PluginContext): StylesheetSourceContext {
  return {
    scanner: getScanner(context),
    styleCSSSources: sortStyleCSSSources(context.styleCSSSources),
    projectDir: getProjectDir(context),
    extraProjectDirs: context.host?.extraProjectDirs,
    ignorePaths: context.host?.ignorePaths
  }
}

/**
 * Extracts without recording anything: for a reader that serves no CSS, such as the
 * emittedGlobals module, whose load must not move the baseline dev updates compare against.
 */
export async function extractCSSResult(context: PluginContext) {
  // Every class comes from the stylesheet's class set, so templates that only an SSR or
  // prerender build compiles still get their rules. Entries register as Vite transforms them, so
  // the CSS leads with the layers of every entry, registered or not yet: a stylesheet dev serves
  // before another entry registers orders that entry's leading layers as the build does (#250).
  return await createExtractedCSSResult({
    ...getStylesheetSourceContext(context),
    leadingLayers: await collectProjectLeadingLayers(context)
  })
}

/** Extracts the CSS the managed CSS modules serve, and records it for dev updates. */
async function getExtractedCSSResult(context: PluginContext) {
  const result = await extractCSSResult(context)
  context.emittedGlobals = result.emittedGlobals
  context.extractedCSS = result.css
  return result
}

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
  return (await getExtractedCSSResult(context)).css
}
