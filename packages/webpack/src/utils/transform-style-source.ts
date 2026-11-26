import {
  compileStyleCSS,
  createStyleCSSHostSource,
  hasLocalStyleDirectives,
  isStetCSSPackageStyleFile,
  isStyleCSSRequest,
  loadLocalStyleContext,
  removeStetStyleDirectives,
  resolveStetStyleSource,
  transformLocalStyleCSS
} from '@stet-css/stylesheet'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'

interface TransformStyleSourceResult {
  code: string
  dependencies: string[]
  /** The file is a stylesheet entry rewritten to import the generated CSS. */
  entry?: boolean
}

interface TransformStyleSourceOptions {
  /** The request's query, such as a `.vue` `<style>` block's `?vue&type=style&index=0&lang.css`. */
  resourceQuery?: string
  projectDir?: string
  stetImport?: string
}

export const STYLE_FILE_RE = /\.(css|scss|sass)$/

/** Whether the file itself is a stylesheet, read from its path alone: it may hold `#` or `?`. */
export function isStyleFile(resourcePath: string) {
  return STYLE_FILE_RE.test(resourcePath)
}

function hasStetStyleManifestDirective(source: string) {
  return source.includes('@settings') || source.includes('@theme')
}

export async function transformStyleSource(
  resourcePath: string,
  source: string,
  options: TransformStyleSourceOptions = {}
): Promise<TransformStyleSourceResult> {
  const { resourceQuery = '', projectDir, stetImport = VIRTUAL_CSS_ID } = options
  const request = resourcePath + resourceQuery
  const dependencies: string[] = []
  if (!isStyleCSSRequest(request)) {
    return { code: source, dependencies }
  }
  if (isStetCSSPackageStyleFile(request, projectDir)) {
    const cleanSource = removeStetStyleDirectives(source).code
    if (!hasStetStyleManifestDirective(cleanSource)) {
      return {
        code: cleanSource,
        dependencies
      }
    }
    const result = await compileStyleCSS(request, cleanSource, {
      projectDir,
      preserveNativeCSS: true
    })
    return {
      code: result.css || result.nativeCSS || '',
      dependencies: result.dependencies || dependencies
    }
  }

  const resolvedSource = resolveStetStyleSource(request, source, projectDir)
  // The plugin registers an entry by reading its file, so only a stylesheet file can be one:
  // a `.vue` `<style>` block that imports `@stet-css/core` passes through as written.
  if (resolvedSource && !isStyleFile(resourcePath)) {
    return { code: source, dependencies }
  }
  if (!resolvedSource) {
    if (hasLocalStyleDirectives(source)) {
      const context = await loadLocalStyleContext(projectDir)
      const result = await transformLocalStyleCSS(request, source, {
        baseManifest: context.manifest,
        projectDir,
        emittedGlobals: context.emittedGlobals
      })
      return {
        code: result.code,
        dependencies: [...new Set([
          ...context.dependencies,
          ...result.dependencies
        ])]
      }
    }
    return { code: source, dependencies }
  }

  dependencies.push(...resolvedSource.dependencies)
  return {
    code: createStyleCSSHostSource(source, {
      stetImport
    }),
    dependencies,
    entry: true
  }
}
