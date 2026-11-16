import { findCSSManifestEntryFiles } from '@stet-css/project/entries'
import { collectStyleCSSDependencies } from '@stet-css/stylesheet'
import { createStaticCSS, type StaticCSSOptions } from './static'

export type GeneratedCSSLoaderOptions = StaticCSSOptions

interface LoaderContext {
  addDependency?: (file: string) => void
  cacheable?: (flag?: boolean) => void
  async?: () => (error: Error | null, content?: string) => void
  getOptions?: () => GeneratedCSSLoaderOptions
}

/**
 * Fills the generated CSS module with the project's CSS. Every file the CSS came from is a
 * dependency, so dev recompiles it when one of those files changes. A new file is picked up
 * once a dependency changes, usually the module that starts importing it. Under webpack the
 * loader is also uncacheable, so a build never reuses CSS computed before a file was added.
 */
export default function masterCSSNextGeneratedCSSLoader(this: LoaderContext) {
  this.cacheable?.(false)
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@stet-css/next] Generated CSS loader requires an async loader context.')
  }
  const options = this.getOptions?.()
  if (!options?.projectDir) {
    callback(new Error('[@stet-css/next] Missing generated CSS loader projectDir option.'))
    return
  }
  createStaticCSS(options)
    .then((result) => {
      for (const dependency of result.dependencies) {
        this.addDependency?.(dependency)
      }
      callback(null, result.css)
    })
    .catch(async (error: Error) => {
      // Keep watching the stylesheet entries so fixing an invalid one recompiles the CSS.
      try {
        for (const entry of await findCSSManifestEntryFiles(options.projectDir)) {
          for (const dependency of collectStyleCSSDependencies(entry, undefined, options.projectDir)) {
            this.addDependency?.(dependency)
          }
        }
      } finally {
        callback(error)
      }
    })
}
