import {
  createStyleCSSHostSource,
  createStyleEntryEmittedGlobals,
  hasLocalStyleDirectives,
  isMasterCSSPackageStyleFile,
  removeMasterStyleDirectives,
  resolveMasterStyleSource,
  transformLocalStyleCSS,
  collectStyleCSSDependencies
} from '@stet-css/stylesheet'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { findCSSManifestEntryFiles } from '@stet-css/project/entries'
import type { ScannerOptions } from '@stet-css/scanner'
import { createStaticCSS, toCSSImportPath, writeStaticOutputFile } from './static'

export interface StyleCSSLoaderOptions {
  /** The generated CSS module every stylesheet entry imports instead of `@stet-css/core`. */
  outputPath: string
  /** Project root; defaults to the loader's `rootContext`. */
  projectDir?: string
  /**
   * Also write the generated CSS to `outputPath`. webpack needs it: css-loader requests
   * `@import`ed files with `-!`, which skips the generated CSS loader rule.
   */
  writeOutput?: boolean
  scannerOptions?: ScannerOptions
}

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  async?: () => (error: Error | null, result?: string) => void
  addDependency?: (file: string) => void
  cacheable?: (flag?: boolean) => void
  getOptions?: () => StyleCSSLoaderOptions
}

async function createGlobalStyleEntryEmittedGlobals(
  entries: string[],
  baseManifest: Awaited<ReturnType<typeof loadProjectManifest>>['manifest'],
  projectDir: string | undefined,
  dependencies: string[]
) {
  if (!entries.length) return
  const result = await createStyleEntryEmittedGlobals(entries, {
    baseManifest,
    projectDir
  })
  dependencies.push(...result.dependencies)
  return result.emittedGlobals
}

async function transformLocalStyleSource(resourcePath: string, source: string, projectDir: string | undefined) {
  const dependencies: string[] = []
  const entries = await findCSSManifestEntryFiles(projectDir)
  const projectManifest = await loadProjectManifest(projectDir, { entries })
  const emittedGlobals = await createGlobalStyleEntryEmittedGlobals(
    entries,
    projectManifest.manifest,
    projectDir,
    dependencies
  )
  const result = await transformLocalStyleCSS(resourcePath, source, {
    baseManifest: projectManifest.manifest,
    projectDir,
    emittedGlobals
  })
  dependencies.push(...projectManifest.dependencies, ...(result.dependencies || []))
  return {
    code: result.code,
    dependencies
  }
}

/**
 * Rewrites a stylesheet entry to import the generated CSS module, which carries the entry's
 * native CSS and every generated rule; strips Master directives from the package's own
 * stylesheets; and lowers `@compose`, `@variant` and `@reference` in local stylesheets such
 * as CSS Modules. Other CSS passes through unchanged.
 */
export async function transformStyleSource(resourcePath: string, source: string, options: StyleCSSLoaderOptions, projectDir?: string) {
  if (isMasterCSSPackageStyleFile(resourcePath, projectDir)) {
    return { code: removeMasterStyleDirectives(source).code, dependencies: [] }
  }
  if (resolveMasterStyleSource(resourcePath, source, projectDir)) {
    const code = createStyleCSSHostSource(source, { masterImport: toCSSImportPath(resourcePath, options.outputPath) })
    if (!options.writeOutput || !projectDir) return { code, dependencies: [], entry: true }
    const result = await createStaticCSS({ projectDir, scannerOptions: options.scannerOptions })
    await writeStaticOutputFile(options.outputPath, result.css)
    return { code, dependencies: result.dependencies, entry: true }
  }
  if (hasLocalStyleDirectives(source)) {
    return transformLocalStyleSource(resourcePath, source, projectDir)
  }
  return { code: source, dependencies: [] }
}

export default function masterCSSStyleCSSLoader(this: LoaderContext, source: string) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@stet-css/next] Style CSS loader requires an async loader context.')
  }
  const options = this.getOptions?.()
  if (!options?.outputPath) {
    callback(new Error('[@stet-css/next] Missing style CSS loader outputPath option.'))
    return
  }
  const projectDir = options.projectDir ?? this.rootContext
  // Local stylesheets resolve classes against the entries, so register their graph before
  // compiling: an invalid `@compose` must still recompile once the source is fixed.
  const dependencies = hasLocalStyleDirectives(source)
    ? new Set(collectStyleCSSDependencies(this.resourcePath, source, projectDir))
    : new Set<string>()
  for (const dependency of dependencies) {
    this.addDependency?.(dependency)
  }
  transformStyleSource(this.resourcePath, source, options, projectDir)
    .then((result) => {
      // A new source file changes the class set without touching any dependency.
      if ('entry' in result && options.writeOutput) this.cacheable?.(false)
      for (const dependency of new Set(result.dependencies)) {
        if (dependencies.has(dependency)) continue
        this.addDependency?.(dependency)
      }
      callback(null, result.code)
    })
    .catch((error: Error) => callback(error))
}
