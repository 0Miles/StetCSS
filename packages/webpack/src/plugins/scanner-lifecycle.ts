import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { hasModifiedFile } from '../utils/path'

type WatchingCompiler = Compiler & {
  modifiedFiles?: ReadonlySet<string>
  removedFiles?: ReadonlySet<string>
}

function getChangedFiles(compiler: WatchingCompiler) {
  if (!compiler.modifiedFiles && !compiler.removedFiles) return undefined
  return [...compiler.modifiedFiles || [], ...compiler.removedFiles || []]
}

/**
 * Generates the static CSS before every compilation, so the virtual CSS module already holds
 * it when webpack builds the module; while watching, only changes that can alter it count.
 */
export default function ScannerLifecyclePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      if (context.getPluginInitialized()) return

      context.on('reset', () => {
        context.writeDefaultManifestModule().catch((error: unknown) => {
          console.error('[master-css.webpack] manifest module update failed:', error)
        })
      })

      compiler.hooks.beforeRun.tapPromise(context.name, async () => {
        await context.init()
        await context.writeGeneratedCSSModule()
      })

      compiler.hooks.watchRun.tapPromise(context.name, async (watchingCompiler) => {
        await context.init()
        const changedFiles = getChangedFiles(watchingCompiler as WatchingCompiler)
        const resetDependencies = context.getResetDependencyPaths()
        if (resetDependencies.some((dependency) => hasModifiedFile(changedFiles && new Set(changedFiles), dependency))) {
          await context.reset(context.getOptions())
          await context.writeGeneratedCSSModule()
          return
        }
        await context.writeGeneratedCSSModule(changedFiles)
      })

      context.setPluginInitialized(true)
    }
  }
}
