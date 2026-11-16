import type { Compiler } from 'webpack'
import type { StetCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { normalizePath } from '../utils/path'

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
export default function ScannerLifecyclePlugin(context: StetCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      if (context.getPluginInitialized()) return

      context.on('reset', () => {
        context.writeDefaultManifestModule().catch((error: unknown) => {
          console.error('[stet-css.webpack] manifest module update failed:', error)
        })
      })

      compiler.hooks.beforeRun.tapPromise(context.name, async () => {
        await context.init()
        await context.writeGeneratedCSSModule()
      })

      compiler.hooks.watchRun.tapPromise(context.name, async (watchingCompiler) => {
        await context.init()
        const changedFiles = getChangedFiles(watchingCompiler as WatchingCompiler)
        const changed = new Set(changedFiles?.map(normalizePath))
        const needsReset = context.getResetDependencyPaths().some((dependency) => changed.has(normalizePath(dependency)))
        if (needsReset) await context.reset(context.getOptions())
        // After a reset every generation input may differ, so regenerate unconditionally.
        await context.writeGeneratedCSSModule(needsReset ? undefined : changedFiles)
      })

      context.setPluginInitialized(true)
    }
  }
}
