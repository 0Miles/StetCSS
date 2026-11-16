import {
  compileStyleCSS,
  createStyleEntryEmittedGlobals,
  createStyleCSSHostSource,
  hasLocalStyleDirectives,
  isStetCSSPackageStyleFile,
  isStyleCSSRequest,
  removeStetStyleDirectives,
  resolveStetStyleSource,
  transformLocalStyleCSS
} from '@stet-css/stylesheet'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { findCSSManifestEntryFiles } from '@stet-css/project/entries'

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
      return {
        code: result.code,
        dependencies: [...new Set([
          ...projectManifest.dependencies,
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
