import { validatePluginOptions, type CSSScanner } from '@stet-css/scanner'
import type { StetCSSEmittedGlobals } from '@stet-css/core'
import type { StyleCSSSources } from '@stet-css/stylesheet'
import type { Plugin, ResolvedConfig } from 'vite'
import ManifestLoaderPlugin from './plugins/manifest-loader'
import ManifestVirtualModulePlugin from './plugins/manifest-virtual-module'
import EmittedGlobalsVirtualModulePlugin from './plugins/emitted-globals-virtual-module'
import ContextPlugin from './plugins/context'
import ScannerPlugin from './plugins/scanner'
import LocalComposePlugin from './plugins/local-compose'
import StyleEntryPlugin from './plugins/style-entry'
import StyleEntryHMRPlugin from './plugins/style-entry-hmr'
import StyleEntryBuildPlugin from './plugins/style-entry-build'
import type { PluginOptions } from './options'

/**
 * What a first-party framework integration tells the plugin about its project. Not a user
 * option: projects add directories with `@source`.
 * @internal
 */
export interface PluginHost {
  /** The integration's package name, named in option errors; defaults to `@stet-css/vite`. */
  name?: string
  /** The project root; defaults to Vite's `root`. Nuxt passes its root, since Vite's is `srcDir`. */
  projectDir?: string
  /** More project directories read by the project rules, such as Nuxt layers. */
  extraProjectDirs?: string[]
  /** Absolute files or directories the class set never reads: the framework's build output. */
  ignorePaths?: string[]
}

export interface PluginContext {
  config?: ResolvedConfig
  host?: PluginHost
  scanner?: CSSScanner
  virtualCSSImporters?: Set<string>
  /** Vite environments whose managed CSS imports emitted the slot placeholder. */
  virtualCSSPlaceholderEnvironments?: Set<string>
  styleCSSSources?: StyleCSSSources
  emittedGlobals?: StetCSSEmittedGlobals
  /** The last extracted CSS, compared on source file changes to skip no-op HMR updates. */
  extractedCSS?: string
}

/**
 * @param options - Only `adapters`; a removed or unknown key throws.
 * @param host - Internal: set by first-party framework integrations only.
 */
export default function stetCSS(options: PluginOptions = {}, host?: PluginHost): Plugin[] {
  validatePluginOptions(options, host?.name ?? '@stet-css/vite')
  const context: PluginContext = { host }
  return [
    ContextPlugin(context),
    ManifestVirtualModulePlugin(context),
    EmittedGlobalsVirtualModulePlugin(context),
    ManifestLoaderPlugin(context),
    ScannerPlugin(options, context),
    LocalComposePlugin(context),
    StyleEntryPlugin(context),
    StyleEntryHMRPlugin(context),
    StyleEntryBuildPlugin(context)
  ]
}
