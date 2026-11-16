import { registerStyleCSSSource as registerStylesheetCSSSource } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getProjectDir } from './project-dir'

// Typed through the stylesheet function: the inferred type would name @stet-css/schema, which
// this package does not depend on.
export async function registerStyleCSSSource(
  context: PluginContext,
  id: string,
  source: string
): ReturnType<typeof registerStylesheetCSSSource> {
  context.styleCSSSources ??= new Map()
  return registerStylesheetCSSSource(getScanner(context), context.styleCSSSources, id, source, {
    projectDir: getProjectDir(context)
  })
}
