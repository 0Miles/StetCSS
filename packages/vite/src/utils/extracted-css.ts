import { createExtractedCSSResult, type StyleCSSSources, type StylesheetSourceContext } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getProjectDir } from './project-dir'

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

export async function getExtractedCSSResult(context: PluginContext) {
  // Every class comes from the stylesheet's class set, so templates that only an SSR or
  // prerender build compiles still get their rules.
  const result = await createExtractedCSSResult(getStylesheetSourceContext(context))
  context.emittedGlobals = result.emittedGlobals
  context.extractedCSS = result.css
  return result
}

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
  return (await getExtractedCSSResult(context)).css
}
