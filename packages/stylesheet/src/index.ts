import {
  compileCSS,
  createManifestFromCSSResult,
  REMOVED_MASTER_AT_RULE_ERROR_CODE,
  type CompileCSSOptions,
  type CompileCSSResult
} from '@stet-css/compiler'
import {
  createCSSImportGraphReader,
  isMasterCSSPackageStyleFile as isMasterCSSCompilerPackageStyleFile,
  resolveMasterCSSPackageImportGraph,
  type CSSImportGraphReader
} from '@stet-css/compiler'
import type { StetCSSEmittedGlobals } from '@stet-css/core'
import type { createCSSWithNativeDeclarations } from '@stet-css/validator/native-declaration'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { renderCompiledManifestCSS, type RenderCompiledManifestCSSResult } from './render'
import {
  findCSSImportStatements,
  collectCSSDirectiveRanges,
  createStetCSSManifestEntryPattern,
  hasStetCSSImport,
  hasStetCSSManifestEntrypoint,
  isStetCSSModuleId as isMasterCSSManifestModuleId,
  normalizeStetCSSModuleIds,
  parseCSSImportSource
} from '@stet-css/lexer'
import type { SourceAdapter } from '@stet-css/source'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import {
  collectStylesheetDirectivesFromCSSGraph,
  createStylesheetDirectives,
  mergeStylesheetDirectives,
  removeStylesheetDirectiveStatements,
  type StylesheetDirectives
} from './directives'
import {
  collectStylesheetScopeClasses,
  isStylesheetScopeFile,
  resolveStylesheetIncludedFiles,
  resolveStylesheetScopeFiles,
  type StylesheetSourceScope
} from './sources'

export * from './directives'
export { isClassBlocklisted } from './class-exclusion'
export { collectCSSVariableReferences } from '@stet-css/lexer'

export const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/

const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const require = createRequire(import.meta.url)

export interface SassModule {
  compileStringAsync(source: string, options: {
    url: URL
    style: 'expanded'
    syntax: 'scss' | 'indented'
  }): Promise<{ css: string }>
}

export interface CompileStyleCSSOptions extends CompileCSSOptions {
  baseManifest?: StetCSSManifest
  projectDir?: string
  loadSass?: (projectDir?: string) => SassModule
}

export interface CompileRenderedStyleCSSOptions extends CompileStyleCSSOptions {
  /** Classes whose generated rules are rendered; native CSS is always kept. */
  classes?: string[]
}

export interface CompileRenderedStyleCSSResult extends CompileCSSResult {
  emittedGlobals: Required<StetCSSEmittedGlobals>
  manifest: StetCSSManifest
  renderedCSS: RenderCompiledManifestCSSResult
}

export interface TransformLocalStyleCSSResult {
  code: string
  dependencies: string[]
  transformed: boolean
  result?: CompileCSSResult
}

export interface TransformLocalStyleCSSOptions extends CompileStyleCSSOptions {
  emittedGlobals?: StetCSSEmittedGlobals
}

export type RegisterStyleCSSSourceOptions = CompileStyleCSSOptions

export type CreateStyleEntryEmittedGlobalsOptions = CompileStyleCSSOptions

export interface CreateStyleEntryEmittedGlobalsResult {
  emittedGlobals: Required<StetCSSEmittedGlobals>
  dependencies: string[]
}

/**
 * What decides a static build's class set: the scanner's source adapters, the registered
 * stylesheet entries and their directives, and the project root.
 */
export interface StylesheetSourceContext {
  scanner: ScannerState
  styleCSSSources?: StyleCSSSources
  /** Project root; defaults to `scanner.cwd`. */
  projectDir?: string
  /**
   * Glob patterns, relative to the project root, that replace the project's own source
   * files; `@source` and `@source not` still apply on top.
   */
  sources?: string[]
  /**
   * More project directories whose own source files join the project's, each by the same
   * rules with itself as the root: a framework's layers outside the project root.
   */
  extraProjectDirs?: string[]
  /**
   * Absolute files or directories the class set never reads, not even through `@source`;
   * a build integration passes its output directory so emitted bundles neither feed classes
   * back nor become watched sources.
   */
  ignorePaths?: string[]
}

export interface CreateExtractedCSSOptions extends CompileStyleCSSOptions, StylesheetSourceContext {
  manifest?: StetCSSManifest
  includeGeneratedCSS?: boolean
  includeNativeCSS?: boolean
  includeMasterBaseCSS?: boolean
}

export interface CreateExtractedCSSResult {
  css: string
  emittedGlobals: Required<StetCSSEmittedGlobals>
}

export type StylesheetCSS = ReturnType<typeof createCSSWithNativeDeclarations>

export interface ScannerState {
  cwd: string
  options: {
    adapters?: SourceAdapter[]
  }
  css: StylesheetCSS
}

export interface StyleCSSSource {
  source: string
  masterCSS: boolean
  directives: StylesheetDirectives
  dependencies: string[]
  sourceDependencies: string[]
}

export type StyleCSSSources = Map<string, StyleCSSSource>

export interface ResolvedStyleCSSSource {
  source: string
  dependencies: string[]
}

export interface ResolveStyleCSSImportGraphOptions {
  expandMasterCSSPackage?: boolean
}

export interface CreateStyleCSSHostSourceOptions {
  masterImport?: string
  masterSource?: string
}

interface DefaultMasterCSSPackageArtifact {
  manifest: StetCSSManifest
  nativeCSS: string
  dependencies: string[]
}

const DEFAULT_PRESET_SOURCE_FILES = [
  'index.css',
  'base.css',
  'theme.css',
  'variants.css',
  'utilities.css'
]

function defaultLoadSass(projectDir?: string): SassModule {
  if (projectDir) {
    try {
      return createRequire(join(projectDir, 'package.json'))('sass') as SassModule
    } catch {
      // Fall through to this package's dependency graph for tests and linked workspaces.
    }
  }
  return require('sass') as SassModule
}

export function normalizeStyleCSSModuleIds() {
  return normalizeStetCSSModuleIds()
}

export function createStyleCSSImportPattern() {
  return createStetCSSManifestEntryPattern()
}

export function createMasterStyleCSSPattern() {
  return createStyleCSSImportPattern()
}

export function cleanStyleRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

function getStyleRequestSearchParams(id: string) {
  const queryStart = id.indexOf('?')
  return queryStart === -1 ? new URLSearchParams() : new URLSearchParams(id.slice(queryStart + 1))
}

function getStyleRequestExtension(id: string) {
  const cleanExtension = extname(cleanStyleRequest(id))
  if (cleanExtension === '.css' || cleanExtension === '.scss' || cleanExtension === '.sass') {
    return cleanExtension
  }
  const lang = getStyleRequestSearchParams(id).get('lang')
  if (lang === 'css' || lang === 'scss' || lang === 'sass') {
    return '.' + lang
  }
  return cleanExtension
}

function isStyleModuleRequest(source: string) {
  return getStyleRequestSearchParams(source).get('type') === 'style'
}

export function isStyleCSSRequest(id: string) {
  return STYLE_CSS_REQUEST_RE.test(id) || (isStyleModuleRequest(id) && ['.css', '.scss', '.sass'].includes(getStyleRequestExtension(id)))
}

export function replaceStyleCSSImports(source: string, replacement: string) {
  let replaced = false
  const ids = new Set([
    ...normalizeStyleCSSModuleIds(),
    VIRTUAL_CSS_ID
  ])
  const code = source.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
    if (!ids.has(id)) return rule
    replaced = true
    return replacement
  })
  return { code, replaced }
}

function isExpandableStyleImportSource(source: string) {
  return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function findImportStatements(source: string) {
  return findCSSImportStatements(source)
}

function resolveStyleCSSImportGraphFile(
  file: string,
  source: string,
  readCSSImport: CSSImportGraphReader,
  dependencies: string[],
  dependencySet: Set<string>,
  stack: string[],
  projectDir?: string,
  options: ResolveStyleCSSImportGraphOptions = {}
): string {
  const absoluteFile = resolve(file)
  if (stack.includes(absoluteFile)) {
    throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
  }
  if (!dependencySet.has(absoluteFile)) {
    dependencySet.add(absoluteFile)
    dependencies.push(absoluteFile)
  }

  const imports = findImportStatements(source)
  if (!imports.length) return source

  let output = ''
  let index = 0
  for (const importStatement of imports) {
    output += source.slice(index, importStatement.start)
    const importSource = parseCSSImportSource(importStatement.statement)
    const packageGraph = options.expandMasterCSSPackage !== false && importSource && isMasterCSSManifestModuleId(importSource)
      ? resolveMasterCSSPackageImportGraph(projectDir)
      : undefined
    if (packageGraph && importSource) {
      for (const dependency of packageGraph.dependencies) {
        if (!dependencySet.has(dependency)) {
          dependencySet.add(dependency)
          dependencies.push(dependency)
        }
      }
      output += readCSSImport(importSource, packageGraph.source)
    } else if (importSource && isExpandableStyleImportSource(importSource)) {
      const importedFile = resolve(dirname(absoluteFile), importSource)
      if (!existsSync(importedFile)) {
        throw new Error(`CSS file not found: ${importedFile}`)
      }
      output += resolveStyleCSSImportGraphFile(
        importedFile,
        readCSSImport(importedFile),
        readCSSImport,
        dependencies,
        dependencySet,
        [...stack, absoluteFile],
        projectDir,
        options
      )
    } else {
      output += importStatement.statement
    }
    index = importStatement.end
  }
  return output + source.slice(index)
}

export function resolveStyleCSSImportGraph(
  file: string,
  source: string,
  projectDir?: string,
  options: ResolveStyleCSSImportGraphOptions = {}
): ResolvedStyleCSSSource {
  const dependencies: string[] = []
  if (!STYLE_CSS_REQUEST_RE.test(cleanStyleRequest(file))) {
    return {
      source,
      dependencies: [cleanStyleRequest(file)]
    }
  }
  const filename = cleanStyleRequest(file)
  const readCSSImport = createCSSImportGraphReader()
  return {
    source: resolveStyleCSSImportGraphFile(filename, readCSSImport(filename, source), readCSSImport, dependencies, new Set(), [], projectDir, options),
    dependencies
  }
}

export function collectStyleCSSDependencies(
  file: string,
  source?: string,
  projectDir?: string
) {
  const dependencies = new Set<string>()
  const filename = cleanStyleRequest(file)
  dependencies.add(filename)

  let resolvedSource = source
  if (resolvedSource === undefined) {
    try {
      resolvedSource = readFileSync(filename, 'utf-8')
    } catch {
      return [...dependencies]
    }
  }

  try {
    const graph = resolveStyleCSSImportGraph(filename, resolvedSource, projectDir, {
      expandMasterCSSPackage: false
    })
    for (const dependency of graph.dependencies) {
      dependencies.add(cleanStyleRequest(dependency))
    }
  } catch {
    // Keep the direct file dependency so the next valid edit can rerun the integration.
  }

  return [...dependencies]
}

export function removeStyleCSSImports(source: string) {
  return replaceStyleCSSImports(source, '')
}

function removeCSSImportStatements(source: string) {
  const imports = findImportStatements(source)
  if (!imports.length) return source
  let code = ''
  let index = 0
  for (const importStatement of imports) {
    code += source.slice(index, importStatement.start)
    index = importStatement.end
  }
  return code + source.slice(index)
}

export function hasStyleCSSImport(source: string) {
  return removeStyleCSSImports(source).replaced
}

export function hasDefaultStyleCSSImport(source: string) {
  return hasStyleCSSImport(source)
}

export function hasMasterStyleEntrypoint(source: string) {
  return hasStetCSSManifestEntrypoint(source)
}

export function resolveMasterStyleSource(
  file: string,
  source: string,
  projectDir?: string
) {
  if (!isStyleCSSRequest(file)) return
  const sourceHasMasterEntry = hasMasterStyleEntrypoint(source)
  let unresolvedPackageSource: ResolvedStyleCSSSource
  try {
    unresolvedPackageSource = resolveStyleCSSImportGraph(file, source, projectDir, {
      expandMasterCSSPackage: false
    })
  } catch (error) {
    // The graph reader rejects removed `@master` at-rules in the file or anything it imports.
    // That error must not be handed back to the bundler with the file: `@master entry;` no
    // longer makes an entry, so nothing else would compile the file and report it.
    if (!sourceHasMasterEntry && !isRemovedMasterAtRuleError(error)) return
    throw error
  }
  if (!isMasterStyleSource(unresolvedPackageSource.source)) return
  return resolveStyleCSSImportGraph(file, source, projectDir)
}

function isRemovedMasterAtRuleError(error: unknown) {
  return (error as { code?: unknown } | undefined)?.code === REMOVED_MASTER_AT_RULE_ERROR_CODE
}

export function isStetCSSModuleId(id: string) {
  return isMasterCSSManifestModuleId(id)
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
  return isMasterCSSCompilerPackageStyleFile(id, projectDir)
}

export function removeMasterStyleDirectives(source: string) {
  return removeStylesheetDirectiveStatements(source)
}

// Local styles go through the compiler when it has something to lower, or something to reject:
// `@dark` and `@light` were folded into `@variant`, and `@master` at-rules were removed in favour
// of `@import '@stet-css/core'` and `@settings`; passing them through would let the browser drop
// them without an error.
const LOCAL_STYLE_LOWERED_DIRECTIVE_NAMES = new Set(['compose', 'variant', 'reference'])
const LOCAL_STYLE_REJECTED_DIRECTIVE_NAMES = new Set(['dark', 'light', 'master'])

export function hasLocalStyleDirectives(source: string) {
  return collectCSSDirectiveRanges(source)
    .some((directive) => LOCAL_STYLE_LOWERED_DIRECTIVE_NAMES.has(directive.name) || LOCAL_STYLE_REJECTED_DIRECTIVE_NAMES.has(directive.name))
}

function isStyleCSSHostImport(importSource: string, masterImport: string) {
  return importSource === masterImport || (masterImport === '@stet-css/core' && normalizeStyleCSSModuleIds().has(importSource))
}

export function createStyleCSSHostSource(source: string, options: CreateStyleCSSHostSourceOptions = {}) {
  const masterImport = options.masterImport || '@stet-css/core'
  const masterSource = options.masterSource
  const hasMasterSource = Object.prototype.hasOwnProperty.call(options, 'masterSource')
  const cleanSource = removeMasterStyleDirectives(source).code
  const imports = findImportStatements(cleanSource)
  const preservedImports: string[] = []
  for (const importStatement of imports) {
    const importSource = parseCSSImportSource(importStatement.statement)
    if (!importSource) continue
    if (importSource === VIRTUAL_CSS_ID || normalizeStyleCSSModuleIds().has(importSource)) {
      if (!hasMasterSource && isStyleCSSHostImport(importSource, masterImport)) {
        preservedImports.push(importStatement.statement.trim())
      }
      continue
    }
    if (!isExpandableStyleImportSource(importSource)) {
      preservedImports.push(importStatement.statement.trim())
    }
  }
  if (hasMasterSource) {
    if (masterSource) {
      preservedImports.push(masterSource)
    }
  } else if (!preservedImports.some((statement) => {
    const importSource = parseCSSImportSource(statement)
    return importSource && isStyleCSSHostImport(importSource, masterImport)
  })) {
    preservedImports.unshift(`@import "${masterImport}";`)
  }
  return preservedImports.join('\n')
}

function canUseDefaultMasterCSSPackageArtifact(options: CompileStyleCSSOptions = {}) {
  return !options.baseManifest
    && !options.loadSass
    && !options.onWarning
    && options.preserveNativeCSS !== false
}

function resolveComparablePath(file: string) {
  return resolve(file)
}

function findDefaultPresetArtifactFiles(dependencies: string[]) {
  if (dependencies.length !== DEFAULT_PRESET_SOURCE_FILES.length + 1) return
  const dependencySet = new Set(dependencies.map(resolveComparablePath))
  for (const dependency of dependencies) {
    const directory = dirname(dependency)
    const sourceFiles = DEFAULT_PRESET_SOURCE_FILES.map((file) => resolveComparablePath(join(directory, file)))
    if (!sourceFiles.every((file) => dependencySet.has(file))) continue

    const manifestFile = join(directory, 'default-manifest.json')
    const nativeCSSFile = join(directory, 'default-native.css')
    if (!existsSync(manifestFile) || !existsSync(nativeCSSFile)) return
    return {
      manifestFile,
      nativeCSSFile
    }
  }
}

function readDefaultMasterCSSPackageArtifact(projectDir: string | undefined, options: CompileStyleCSSOptions = {}): DefaultMasterCSSPackageArtifact | undefined {
  if (!canUseDefaultMasterCSSPackageArtifact(options)) return

  const graph = resolveMasterCSSPackageImportGraph(projectDir)
  const artifactFiles = findDefaultPresetArtifactFiles(graph.dependencies)
  if (!artifactFiles) return

  return {
    manifest: JSON.parse(readFileSync(artifactFiles.manifestFile, 'utf8')) as StetCSSManifest,
    nativeCSS: readFileSync(artifactFiles.nativeCSSFile, 'utf8'),
    dependencies: [...new Set([
      ...graph.dependencies,
      artifactFiles.manifestFile,
      artifactFiles.nativeCSSFile
    ])]
  }
}

function resolveMasterCSSPackageCompileSource(projectDir?: string) {
  const graph = resolveMasterCSSPackageImportGraph(projectDir)
  return {
    source: removeMasterStyleDirectives(removeStyleCSSImports(graph.source).code).code,
    dependencies: graph.dependencies
  }
}

export async function createMasterCSSPackageHostSource(
  projectDir: string | undefined,
  options: CompileStyleCSSOptions = {}
) {
  const defaultArtifact = readDefaultMasterCSSPackageArtifact(options.projectDir ?? projectDir, options)
  if (defaultArtifact) {
    const renderedCSS = renderCompiledManifestCSS({
      manifest: defaultArtifact.manifest,
      nativeCSS: defaultArtifact.nativeCSS
    })
    return {
      source: renderedCSS.css,
      dependencies: defaultArtifact.dependencies
    }
  }

  const graph = resolveMasterCSSPackageCompileSource(projectDir)
  const result = await compileStyleCSS(graph.dependencies[0] || '@stet-css/core', graph.source, {
    ...options,
    preserveNativeCSS: true
  })
  const nativeCSS = getNativeCSS(result)
  const finalizedResult = createManifestFromCSSResult(result, options)
  return {
    source: renderCompiledManifestCSS({
      manifest: finalizedResult.manifest,
      nativeCSS
    }).css,
    dependencies: graph.dependencies
  }
}

export function isMasterStyleSource(source: string) {
  return hasMasterStyleEntrypoint(source)
}

export async function preprocessStyleCSS(source: string, id: string, options: CompileStyleCSSOptions = {}) {
  const filename = cleanStyleRequest(id)
  const extension = getStyleRequestExtension(id)
  if (extension !== '.scss' && extension !== '.sass') return source

  const sass = (options.loadSass || defaultLoadSass)(options.projectDir)
  const result = await sass.compileStringAsync(source, {
    url: pathToFileURL(filename),
    style: 'expanded',
    syntax: extension === '.sass' ? 'indented' : 'scss'
  })
  return result.css
}

export async function compileStyleCSS(
  id: string,
  source: string,
  options: CompileStyleCSSOptions = {}
): Promise<CompileCSSResult> {
  const { result, finalizedResult } = await compileStyleCSSResult(id, source, options)
  return {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: finalizedResult.css,
    generatedCSS: finalizedResult.generatedCSS
  }
}

async function compileStyleCSSResult(
  id: string,
  source: string,
  options: CompileStyleCSSOptions = {}
) {
  const { projectDir, loadSass: _loadSass, baseManifest, ...compileOptions } = options
  const filename = cleanStyleRequest(id)
  const css = await preprocessStyleCSS(source, id, options)
  const result = compileCSS(css, {
    ...compileOptions,
    from: filename
  })
  const finalizedResult = createManifestFromCSSResult(result, {
    ...compileOptions,
    baseManifest,
    root: projectDir,
    from: filename
  })
  return {
    compileOptions,
    finalizedResult,
    result
  }
}

export async function compileRenderedStyleCSS(
  id: string,
  source: string,
  options: CompileRenderedStyleCSSOptions = {}
): Promise<CompileRenderedStyleCSSResult> {
  const { classes, ...compileOptions } = options
  const { finalizedResult, result } = await compileStyleCSSResult(id, source, compileOptions)
  const renderedCSS = renderCompiledManifestCSS({
    manifest: finalizedResult.manifest,
    nativeCSS: result.nativeCSS,
    classNames: classes
  })
  return {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: renderedCSS.css,
    nativeCSS: renderedCSS.nativeCSS,
    generatedCSS: renderedCSS.generatedCSS,
    emittedGlobals: renderedCSS.emittedGlobals,
    manifest: finalizedResult.manifest,
    renderedCSS
  }
}

export async function compileLocalStyleCSS(
  id: string,
  source: string,
  options: CompileStyleCSSOptions = {}
): Promise<CompileCSSResult> {
  return compileStyleCSS(id, source, {
    ...options,
    preserveNativeCSS: true
  })
}

function createEmptyStyleEntryEmittedGlobals(): Required<StetCSSEmittedGlobals> {
  return {
    variables: {},
    animations: {}
  }
}

function hasEmittedGlobals(emittedGlobals: StetCSSEmittedGlobals | undefined) {
  return Boolean(
    Object.keys(emittedGlobals?.variables || {}).length
    || Object.keys(emittedGlobals?.animations || {}).length
  )
}

export async function createStyleEntryEmittedGlobals(
  entries: string[],
  options: CreateStyleEntryEmittedGlobalsOptions = {}
): Promise<CreateStyleEntryEmittedGlobalsResult> {
  const dependencies = new Set<string>()
  let baseManifest = options.baseManifest
  let emittedGlobals = createEmptyStyleEntryEmittedGlobals()

  for (const entry of [...new Set(entries)].sort()) {
    const filename = cleanStyleRequest(entry)
    const source = readFileSync(filename, 'utf-8')
    const resolvedSource = resolveMasterStyleSource(filename, source, options.projectDir)
    if (!resolvedSource) continue
    for (const dependency of resolvedSource.dependencies) {
      dependencies.add(cleanStyleRequest(dependency))
    }

    const { result, finalizedResult } = await compileStyleCSSResult(filename, resolvedSource.source, {
      ...options,
      baseManifest,
      preserveNativeCSS: true
    })
    for (const dependency of finalizedResult.dependencies) {
      dependencies.add(cleanStyleRequest(dependency))
    }

    const renderedCSS = renderCompiledManifestCSS({
      manifest: finalizedResult.manifest,
      nativeCSS: finalizedResult.css || result.nativeCSS,
      emittedGlobals
    })
    if (hasEmittedGlobals(renderedCSS.emittedGlobals)) {
      emittedGlobals = renderedCSS.emittedGlobals
    }
    baseManifest = finalizedResult.manifest
  }

  return {
    emittedGlobals,
    dependencies: [...dependencies]
  }
}

export async function transformLocalStyleCSS(
  id: string,
  source: string,
  options: TransformLocalStyleCSSOptions = {}
): Promise<TransformLocalStyleCSSResult> {
  if (!isStyleCSSRequest(id) || !hasLocalStyleDirectives(source)) {
    return {
      code: source,
      dependencies: [],
      transformed: false
    }
  }
  const {
    emittedGlobals,
    ...compileOptions
  } = options
  const { result, finalizedResult } = await compileStyleCSSResult(id, source, {
    ...compileOptions,
    preserveNativeCSS: true
  })
  const renderedCSS = renderCompiledManifestCSS({
    manifest: finalizedResult.resolutionManifest,
    nativeCSS: finalizedResult.css || result.nativeCSS,
    includeGeneratedCSS: false,
    emittedGlobals
  })
  const transformedResult = {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: renderedCSS.css,
    generatedCSS: renderedCSS.generatedCSS
  }
  return {
    code: transformedResult.css || transformedResult.nativeCSS || '',
    dependencies: [...new Set([cleanStyleRequest(id), ...(transformedResult.dependencies || [])])],
    transformed: true,
    result: transformedResult
  }
}

export function getNativeCSS(result: { css?: string, generatedCSS?: string, nativeCSS?: string }) {
  if (result.nativeCSS !== undefined) return result.nativeCSS
  const css = result.css || ''
  const generatedCSS = result.generatedCSS || ''
  if (generatedCSS && css.endsWith(generatedCSS)) {
    return css.slice(0, -generatedCSS.length).trim()
  }
  return css
}

function hasCompiledStyleManifestInput(result: CompileCSSResult) {
  return Boolean(Object.keys(result.manifestInput || {}).length || result.styleDefinitions?.length)
}

/**
 * The directives the class set applies: every registered entry's, merged, because all
 * entries share one generated CSS.
 */
export function getStyleCSSSourcesDirectives(styleCSSSources?: StyleCSSSources) {
  return mergeStylesheetDirectives(
    ...Array.from(styleCSSSources?.values() || [], (styleSource) => styleSource.directives)
  )
}

/**
 * The one scope the static class set reads: the project's own source files plus the
 * directives of every registered entry.
 */
function createStylesheetSourceScope(context: StylesheetSourceContext): StylesheetSourceScope {
  const { scanner } = context
  const directives = getStyleCSSSourcesDirectives(context.styleCSSSources)
  return {
    projectDir: context.projectDir ?? scanner.cwd,
    sources: context.sources,
    extraProjectDirs: context.extraProjectDirs,
    include: directives.include,
    exclude: directives.exclude,
    safelist: directives.safelist,
    blocklist: directives.blocklist,
    adapters: scanner.options.adapters,
    ignorePaths: context.ignorePaths
  }
}

/**
 * Lists every file the static class set reads: the project's own source files (or the
 * `sources` patterns), plus every entry's `@source` files, minus every entry's
 * `@source not` files.
 */
export async function resolveStylesheetSourceFiles(context: StylesheetSourceContext) {
  return resolveStylesheetScopeFiles(createStylesheetSourceScope(context))
}

/**
 * Whether a changed path feeds the static class set, by the same rule as
 * `resolveStylesheetSourceFiles`; for dev watchers.
 */
export function isStylesheetSourceFile(file: string, context: StylesheetSourceContext) {
  return isStylesheetScopeFile(file, createStylesheetSourceScope(context))
}

export async function registerStyleCSSSource(
  scanner: ScannerState,
  styleCSSSources: StyleCSSSources,
  id: string,
  source: string,
  options: RegisterStyleCSSSourceOptions = {}
) {
  const filename = cleanStyleRequest(id)
  const detectionSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? scanner.cwd)
  const resolvedSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? scanner.cwd, {
    expandMasterCSSPackage: false
  })
  // Sass passes a Sass entry's directives through untouched, so they are read from its
  // output; plain CSS comes back from `preprocessStyleCSS` as is.
  const collectedDirectives = isStyleCSSRequest(filename)
    ? collectStylesheetDirectivesFromCSSGraph(
      filename,
      await preprocessStyleCSS(detectionSource.source, filename, options),
      scanner.cwd
    )
    : {
      directives: createStylesheetDirectives(),
      dependencies: []
    }
  const masterCSS = hasStetCSSImport(resolvedSource.source)
  const sourceWithoutImports = removeCSSImportStatements(resolvedSource.source)
  const cleanSource = removeMasterStyleDirectives(sourceWithoutImports).code
  const defaultArtifact = masterCSS
    ? readDefaultMasterCSSPackageArtifact(options.projectDir ?? scanner.cwd, options)
    : undefined
  const compileOptions = masterCSS && !options.baseManifest
    ? { ...options, baseManifest: await resolveMasterCSSPackageManifest(options.projectDir ?? scanner.cwd, options, defaultArtifact) }
    : options
  const result = await compileStyleCSS(filename, cleanSource, compileOptions)
  const sourceDependencies = resolveStylesheetIncludedFiles({
    projectDir: scanner.cwd,
    include: collectedDirectives.directives.include,
    exclude: collectedDirectives.directives.exclude
  })
  result.dependencies = [...new Set([
    ...resolvedSource.dependencies,
    ...detectionSource.dependencies,
    ...(result.dependencies || []),
    ...collectedDirectives.dependencies,
    ...sourceDependencies,
    ...(defaultArtifact?.dependencies || [])
  ])]
  styleCSSSources.set(filename, {
    source: cleanSource,
    masterCSS,
    directives: collectedDirectives.directives,
    dependencies: result.dependencies || [],
    sourceDependencies
  })
  return result
}

export interface CreateStyleCSSManifestOptions extends CompileStyleCSSOptions {
  styleCSSSources?: StyleCSSSources
}

function hasMasterCSSPackageSource(styleCSSSources?: StyleCSSSources) {
  return Array.from(styleCSSSources?.values() || []).some((styleSource) => styleSource.masterCSS)
}

/**
 * The manifest an entry that imports `@stet-css/core` resolves against. Entries are compiled
 * without that import, so without it `@compose inline-flex` cannot see the package's
 * static utilities.
 */
async function resolveMasterCSSPackageManifest(
  projectDir: string | undefined,
  options: CompileStyleCSSOptions,
  defaultArtifact = readDefaultMasterCSSPackageArtifact(projectDir, options)
) {
  if (defaultArtifact) return defaultArtifact.manifest
  const graph = resolveMasterCSSPackageCompileSource(projectDir)
  const { finalizedResult } = await compileStyleCSSResult(graph.dependencies[0] || '@stet-css/core', graph.source, options)
  return finalizedResult.manifest
}

async function compileMasterCSSPackage(projectDir: string | undefined, options: CompileStyleCSSOptions) {
  const graph = resolveMasterCSSPackageCompileSource(projectDir)
  const result = await compileStyleCSS(graph.dependencies[0] || '@stet-css/core', graph.source, options)
  return {
    ...result,
    dependencies: graph.dependencies
  }
}

export async function createStyleCSSManifest(options: CreateStyleCSSManifestOptions = {}) {
  const {
    styleCSSSources,
    ...compileOptions
  } = options
  const entries = Array.from(styleCSSSources || [])
  const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
  const defaultArtifact = hasMasterCSS
    ? readDefaultMasterCSSPackageArtifact(compileOptions.projectDir, compileOptions)
    : undefined
  const styleResults = await Promise.all([
    ...(hasMasterCSS && !defaultArtifact
      ? [compileMasterCSSPackage(compileOptions.projectDir, compileOptions)]
      : []),
    ...entries.map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, compileOptions))
  ])
  const dependencies = [
    ...(defaultArtifact?.dependencies || []),
    ...entries.flatMap(([, styleSource]) => styleSource.dependencies),
    ...styleResults.flatMap((result: CompileCSSResult) => result.dependencies || [])
  ]
  let manifest: StetCSSManifest | undefined = defaultArtifact?.manifest ?? compileOptions.baseManifest
  let hasStyleManifest = Boolean(defaultArtifact)
  for (const result of styleResults) {
    if (!hasCompiledStyleManifestInput(result)) continue
    const finalizedResult = createManifestFromCSSResult(result, {
      ...compileOptions,
      baseManifest: manifest
    })
    manifest = finalizedResult.manifest
    hasStyleManifest = true
  }
  return {
    manifest: hasStyleManifest ? manifest : undefined,
    dependencies: [...new Set(dependencies)]
  }
}

export async function createExtractedCSSResult(options: CreateExtractedCSSOptions): Promise<CreateExtractedCSSResult> {
  const {
    scanner,
    styleCSSSources,
    manifest: explicitPlan,
    includeGeneratedCSS = true,
    includeNativeCSS = true,
    includeMasterBaseCSS = true,
    sources,
    extraProjectDirs,
    ignorePaths,
    ...compileOptions
  } = options
  const sourceContext: StylesheetSourceContext = {
    scanner,
    styleCSSSources,
    projectDir: compileOptions.projectDir,
    sources,
    extraProjectDirs,
    ignorePaths
  }
  // One class set for every entry's generated rules; native CSS is kept as written.
  const classes = await collectStylesheetScopeClasses(createStylesheetSourceScope(sourceContext))

  const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
  const defaultArtifact = hasMasterCSS && !explicitPlan
    ? readDefaultMasterCSSPackageArtifact(compileOptions.projectDir ?? scanner.cwd, compileOptions)
    : undefined
  const masterCSSResult = hasMasterCSS && !defaultArtifact
    ? await compileMasterCSSPackage(compileOptions.projectDir, compileOptions)
    : undefined
  let mergedPlan = defaultArtifact?.manifest ?? compileOptions.baseManifest ?? explicitPlan ?? scanner.css.manifest
  const finalizedStyleResults = new Map<CompileCSSResult, ReturnType<typeof createManifestFromCSSResult>>()
  const finalize = (result: CompileCSSResult) => {
    if (!hasCompiledStyleManifestInput(result)) return
    const finalizedResult = createManifestFromCSSResult(result, {
      ...compileOptions,
      baseManifest: mergedPlan
    })
    mergedPlan = finalizedResult.manifest
    finalizedStyleResults.set(result, finalizedResult)
  }
  if (masterCSSResult) finalize(masterCSSResult)
  // Entries that import the package resolve `@compose` against the package's manifest.
  const masterCSSManifest = compileOptions.baseManifest ?? (hasMasterCSS ? mergedPlan : undefined)
  const entryStyleResults = await Promise.all(
    Array.from(styleCSSSources || [])
      .map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, {
        ...compileOptions,
        baseManifest: styleSource.masterCSS ? masterCSSManifest : compileOptions.baseManifest
      }))
  )
  for (const result of entryStyleResults) finalize(result)
  const nativeCSS = [
    ...(includeMasterBaseCSS
      ? [
        ...(defaultArtifact ? [defaultArtifact.nativeCSS] : []),
        ...(masterCSSResult ? [getNativeCSS(finalizedStyleResults.get(masterCSSResult) || masterCSSResult)] : [])
      ]
      : []),
    ...(includeNativeCSS
      ? entryStyleResults
        .map((result: CompileCSSResult) => finalizedStyleResults.get(result)?.css || result.nativeCSS)
        .filter(Boolean)
      : [])
  ]
  const renderedCSS = renderCompiledManifestCSS({
    manifest: mergedPlan,
    nativeCSS,
    classNames: classes,
    includeGeneratedCSS
  })
  return {
    css: renderedCSS.css,
    emittedGlobals: renderedCSS.emittedGlobals
  }
}

export async function createExtractedCSS(options: CreateExtractedCSSOptions) {
  return (await createExtractedCSSResult(options)).css
}
