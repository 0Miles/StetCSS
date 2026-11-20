import { dirname, relative } from 'node:path'
import { isStyleFile, transformStyleSource } from './utils/transform-style-source'
import { getHost } from './utils/hosts'
import {
  collectStyleCSSDependencies,
  hasLocalStyleDirectives,
  isStetCSSPackageStyleFile,
  resolveStetStyleSource
} from '@stet-css/stylesheet'

interface StyleCSSLoaderOptions {
  virtualCSSImportModuleId?: string
  hostId?: string
  /** Set by the rule for `.vue` `<style>` blocks, which runs once vue-loader extracted the block. */
  vueStyleBlock?: boolean
}

interface LoaderContext {
  resourcePath: string
  resourceQuery?: string
  rootContext?: string
  async?: () => (error: Error | null, result?: string, map?: unknown) => void
  addDependency?: (file: string) => void
  getOptions?: () => StyleCSSLoaderOptions
}

function toCSSImportPath(fromFile: string, toFile?: string) {
  if (!toFile) return undefined
  let importPath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath
  }
  return importPath
}

function shouldAddStyleDependencies(resourcePath: string, source: string, projectDir?: string) {
  if (hasLocalStyleDirectives(source)) return true
  if (isStetCSSPackageStyleFile(resourcePath, projectDir)) return true
  try {
    return Boolean(resolveStetStyleSource(resourcePath, source, projectDir))
  } catch {
    return true
  }
}

export default function stetCSSStyleCSSLoader(this: LoaderContext, source: string, map?: unknown) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@stet-css/webpack] Style CSS loader requires an async loader context.')
  }
  const options = this.getOptions?.() || {}
  // The `pre` rule matches the resource webpack's rules see, which a match resource can make a
  // stylesheet when the file is not one: vue-loader's `experimentalInlineMatchResource` names a
  // block `App.vue.css?vue&type=style&…`. The source is then the whole file, before the loaders
  // that extract the stylesheet run, so it passes through; the `.vue` block rule lowers the block.
  if (!options.vueStyleBlock && !isStyleFile(this.resourcePath)) {
    callback(null, source, map)
    return
  }
  // The query tells a `.vue` `<style>` block (`App.vue?vue&type=style&…&lang.css`) apart
  // from the component itself, and carries its scope id.
  const request = this.resourcePath + (this.resourceQuery || '')
  const dependencies = shouldAddStyleDependencies(request, source, this.rootContext)
    ? new Set(collectStyleCSSDependencies(request, source, this.rootContext))
    : new Set<string>()
  for (const dependency of dependencies) {
    this.addDependency?.(dependency)
  }
  transformStyleSource(this.resourcePath, source, {
    resourceQuery: this.resourceQuery,
    projectDir: this.rootContext,
    stetImport: toCSSImportPath(this.resourcePath, options.virtualCSSImportModuleId)
  })
    .then(async (result) => {
      for (const dependency of new Set(result.dependencies)) {
        if (dependencies.has(dependency)) continue
        this.addDependency?.(dependency)
      }
      // An entry discovery cannot see, such as one outside the project root, joins the CSS
      // before webpack builds the virtual CSS module this entry imports.
      if (result.entry) {
        await getHost(options.hostId)?.addStyleEntry(this.resourcePath)
      }
      // A style left as written keeps its map: vue-loader maps a block to its lines in the file.
      callback(null, result.code, result.code === source ? map : undefined)
    })
    .catch((error: Error) => callback(error))
}
