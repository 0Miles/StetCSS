import { createExtractedCSSResult } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'

export async function getExtractedCSSResult(context: PluginContext) {
  const result = await createExtractedCSSResult({
    scanner: getScanner(context),
    styleCSSSources: context.styleCSSSources,
    projectDir: context.config?.root,
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
