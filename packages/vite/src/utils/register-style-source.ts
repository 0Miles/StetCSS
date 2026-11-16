import { registerStyleCSSSource as registerStylesheetCSSSource } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getProjectDir } from './project-dir'

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string) {
  context.styleCSSSources ??= new Map()
  return registerStylesheetCSSSource(getScanner(context), context.styleCSSSources, id, source, {
    projectDir: getProjectDir(context)
  })
}
