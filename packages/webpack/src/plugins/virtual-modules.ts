import { EMPTY_MANIFEST_JSON } from '@stet-css/integration/manifest-module'
import { toInlineManifestModule } from '@stet-css/integration/manifest-facade'
import { EMPTY_EMITTED_GLOBALS_MODULE } from '@stet-css/integration/emitted-globals-module'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

interface WebpackPluginAdapter {
  apply(compiler: Compiler): void
}

export default function VirtualModuleRegistryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      const initialModules = {
        [context.virtualCSSImportModuleId]: '',
        [context.virtualManifestModuleId]: toInlineManifestModule(EMPTY_MANIFEST_JSON),
        [context.virtualEmittedGlobalsModuleId]: EMPTY_EMITTED_GLOBALS_MODULE
      }
      context.virtualModule = new VirtualModulesPlugin(initialModules)

      const virtualModule = context.virtualModule as unknown as WebpackPluginAdapter
      virtualModule.apply(compiler)
      for (const [modulePath, moduleContent] of Object.entries(initialModules)) {
        context.writeVirtualModule(modulePath, moduleContent)
      }
    }
  }
}
