import type { Compiler, Module } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { normalizePath } from '../utils/path'
import { addFileDependency } from '../utils/file-dependencies'

/**
 * Hands webpack the files the static CSS reads, so editing one, even a file no module
 * imports, starts a rebuild, and fails the compilation when the CSS could not be generated.
 * An entry the style loader reports late, after the generated CSS module was built, gets
 * that module rebuilt before the compilation seals.
 */
export default function StaticCSSDependenciesPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      const virtualCSSPath = normalizePath(context.virtualCSSImportModuleId)
      const isGeneratedCSSModule = (module: Module) => {
        const resource = (module as Module & { resource?: string }).resource
        return Boolean(resource) && normalizePath(resource!) === virtualCSSPath
      }

      compiler.hooks.thisCompilation.tap(context.name, (compilation) => {
        for (const dependency of context.getStaticCSSDependencyPaths()) {
          addFileDependency(compilation.fileDependencies, dependency)
        }
        const error = context.getStaticCSSError()
        if (error !== undefined) {
          const message = error instanceof Error ? error.message : String(error)
          const WebpackError = compiler.webpack?.WebpackError
          compilation.errors.push(WebpackError
            ? new WebpackError(`[@stet-css/webpack] ${message}`)
            : error as InstanceType<typeof import('webpack').WebpackError>)
        }

        const builtVersions = new Map<Module, number>()
        compilation.hooks.buildModule?.tap(context.name, (module) => {
          if (isGeneratedCSSModule(module)) builtVersions.set(module, context.getStaticCSSVersion())
        })
        compilation.hooks.finishModules?.tapPromise(context.name, async () => {
          if (!builtVersions.size) return
          await context.waitForGeneratedCSSModule()
          const staleModules = [...builtVersions]
            .filter(([, version]) => version !== context.getStaticCSSVersion())
            .map(([module]) => module)
          builtVersions.clear()
          await Promise.all(staleModules.map((module) => new Promise<void>((resolve, reject) => {
            compilation.rebuildModule(module, (error) => error ? reject(error) : resolve())
          })))
        })
      })
    }
  }
}
