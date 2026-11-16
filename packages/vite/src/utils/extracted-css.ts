import { createExtractedCSSResult, type StylesheetSourceContext } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getProjectDir } from './project-dir'

/** What decides the class set; shared by extraction and the dev watcher's file filter. */
export function getStylesheetSourceContext(context: PluginContext): StylesheetSourceContext {
  return {
    scanner: getScanner(context),
    styleCSSSources: context.styleCSSSources,
    projectDir: getProjectDir(context),
    extraProjectDirs: context.host?.extraProjectDirs,
    ignorePaths: context.host?.ignorePaths
  }
}

export async function getExtractedCSSResult(context: PluginContext) {
  const result = await createExtractedCSSResult({
    ...getStylesheetSourceContext(context),
    includeGeneratedCSS: context.includeGeneratedCSS,
    // The plugin scans no modules: every class comes from the stylesheet's class set, so
    // templates that only an SSR or prerender build compiles still get their rules.
    classes: []
  })
  context.emittedGlobals = result.emittedGlobals
  context.extractedCSS = result.css
  return result
}

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
  return (await getExtractedCSSResult(context)).css
}
