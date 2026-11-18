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
  projectDir?: string
  stetImport?: string
}

function hasStetStyleManifestDirective(source: string) {
  return source.includes('@settings') || source.includes('@theme')
}

export async function transformStyleSource(
  resourcePath: string,
  source: string,
  options: TransformStyleSourceOptions = {}
): Promise<TransformStyleSourceResult> {
  const { projectDir, stetImport = VIRTUAL_CSS_ID } = options
  const dependencies: string[] = []
  if (!isStyleCSSRequest(resourcePath)) {
    return { code: source, dependencies }
  }
  if (isStetCSSPackageStyleFile(resourcePath, projectDir)) {
    const cleanSource = removeStetStyleDirectives(source).code
    if (!hasStetStyleManifestDirective(cleanSource)) {
      return {
        code: cleanSource,
        dependencies
      }
    }
    const result = await compileStyleCSS(resourcePath, cleanSource, {
      projectDir,
      preserveNativeCSS: true
    })
    return {
      code: result.css || result.nativeCSS || '',
      dependencies: result.dependencies || dependencies
    }
  }

  const resolvedSource = resolveStetStyleSource(resourcePath, source, projectDir)
  if (!resolvedSource) {
    if (hasLocalStyleDirectives(source)) {
      const context = await loadLocalStyleContext(projectDir)
      const result = await transformLocalStyleCSS(resourcePath, source, {
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
