import type CSSScanner from '@stet-css/scanner'
import type { PluginContext } from '../core'

export function getScanner(context: PluginContext): CSSScanner {
  if (!context.scanner) {
    throw new Error('[@stet-css/vite] Scanner context was not initialized.')
  }
  return context.scanner
}
