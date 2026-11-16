import CSSScanner from '@stet-css/scanner'
import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import { getProjectDir } from '../utils/project-dir'

export default function ScannerPlugin(options: PluginOptions, context: PluginContext): Plugin {
  return {
    name: 'master-css:scanner',
    enforce: 'pre',
    async configResolved(config) {
      const scanner = new CSSScanner(options.scanner, getProjectDir(context) ?? config.root)
      context.scanner = scanner
      await scanner.init()
      scanner.options.verbose = 0
    },
  }
}
