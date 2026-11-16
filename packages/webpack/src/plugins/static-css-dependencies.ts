import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

/**
 * Hands webpack the files the static CSS reads, so editing one, even a file no module
 * imports, starts a rebuild, and fails the compilation when the CSS could not be generated.
 */
export default function StaticCSSDependenciesPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.thisCompilation.tap(context.name, (compilation) => {
        for (const dependency of context.getStaticCSSDependencyPaths()) {
          compilation.fileDependencies.add(dependency)
        }
        const error = context.getStaticCSSError()
        if (error === undefined) return
        const message = error instanceof Error ? error.message : String(error)
        const WebpackError = compiler.webpack?.WebpackError
        compilation.errors.push(WebpackError
          ? new WebpackError(`[@stet-css/webpack] ${message}`)
          : error as InstanceType<typeof import('webpack').WebpackError>)
      })
    }
  }
}
