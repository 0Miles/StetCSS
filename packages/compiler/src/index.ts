import parseThemePrelude from './theme-prelude'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { stringifyStetCSSManifestJSON } from '@stet-css/schema/manifest-json'
import type { CSSDirectiveReference } from '@stet-css/schema/css-directives'
import { collectCSSDirectiveRanges } from '@stet-css/lexer'
import { createCSSImportGraphReader, type CSSImportGraphReader } from './css-import-graph-reader'
import { createFileStampCache } from './file-stamps'
import { applyCSSImportConditions, hoistCSSImportStatements } from './css-import-conditions'
import { createStetCSSManifest } from './stet-css-manifest'
import lowerCSSDirectives from './lower-css-directives'
import type { CompilerDiagnosticRecorder } from './diagnostics'
import {
  compileCSS,
  createCSSDirectiveExtractionPolicy,
  findCSSReferenceStatements,
  mergeCSSDirectiveExtractionPolicy,
  removeCSSReferenceStatements,
  type CompileCSSOptions,
  setCSSTransform,
  type CSSReferenceStatement,
  type CompileCSSFileOptions,
  type CompileCSSResult,
  type ResolvedCSSImportGraph
} from './core'
import {
  findCSSImportStatements,
  removeCSSImportStatements,
  replaceCSSImportStatements,
  type CSSImportStatement
} from './lexer/imports'

export * from './core'
export { createCSSImportGraphReader, type CSSImportGraphReader, type CSSImportGraphReaderOptions } from './css-import-graph-reader'
export { createFileStampCache, type FileStampCache } from './file-stamps'
export { applyCSSImportConditions, collectCSSLayerOrder, hoistCSSImportStatements } from './css-import-conditions'
export type {
  CompileCSSFileOptions,
  CompileCSSOptions,
  CompileCSSResult,
  CSSReferenceStatement,
  ResolvedCSSImportGraph,
  StandaloneCSSDirectiveStatement
} from './core'

setCSSTransform(transform)

const require = createRequire(import.meta.url)
const STET_CSS_PACKAGE_ID = '@stet-css/core'
const STET_CSS_PACKAGE_IDS = new Set([STET_CSS_PACKAGE_ID, '@stet-css/preset'])

interface CSSPackageJSON {
  name?: unknown
  style?: unknown
  exports?: unknown
}

export interface InspectCSSResult {
  hasStetCSSImport: boolean
  hasStetEntry: boolean
}

export interface ResolveCSSImportGraphOptions {
  projectDir?: string
  expandPackageImports?: boolean
  onReference?: (reference: CSSReferenceStatement, fromFile: string) => void
  /** Called with each stylesheet the graph reaches, before reading it, also when it is missing. */
  onDependency?: (file: string) => void
}

interface ResolveCSSImportGraphFileOptions extends ResolveCSSImportGraphOptions {
  inPackage?: boolean
  onSource?: (source: string, inPackage: boolean) => void
}

function collectThemeModeNames(source: string, target: Set<string>) {
  if (!source.includes('@theme')) return
  for (const range of collectCSSDirectiveRanges(source)) {
    if (range.name !== 'theme') continue
    const { mode } = parseThemePrelude(source.slice(range.preludeRange.start, range.preludeRange.end).trim())
    if (mode) target.add(mode)
  }
}

export type CompileCSSManifestOptions = CompileCSSFileOptions & {
  baseManifest?: StetCSSManifest
}
export type CompileCSSManifestSourceOptions = CompileCSSOptions & {
  baseManifest?: StetCSSManifest
  root?: string
  /** Called with each stylesheet the `@reference` tree reaches, as in `CompileCSSFileOptions`. */
  onDependency?: (file: string) => void
}

type CompileCSSManifestInternalOptions = CompileCSSManifestSourceOptions & {
  diagnostics?: CompilerDiagnosticRecorder
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  manifest: StetCSSManifest
  resolutionManifest: StetCSSManifest
  directives: CompileCSSResult
}

export interface CompileProjectManifestResult extends CompileCSSManifestResult {
  entries: string[]
}

export type CompileCSSManifestJSONResult = CompileCSSManifestResult & {
  json: string
  directives: CompileCSSResult
}

function isExpandableImportSource(source: string) {
  return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function readJSONFile<T>(file: string) {
  return JSON.parse(readFileSync(file, 'utf-8')) as T
}

function findPackageRoot(entryFile: string, packageName: string) {
  let directory = dirname(entryFile)
  while (true) {
    const packageJSONFile = resolve(directory, 'package.json')
    if (existsSync(packageJSONFile)) {
      try {
        const packageJSON = readJSONFile<CSSPackageJSON>(packageJSONFile)
        if (packageJSON.name === packageName) {
          return {
            directory,
            packageJSON
          }
        }
      } catch {
        // Keep walking up in case this is not the package root.
      }
    }
    const parentDirectory = dirname(directory)
    if (parentDirectory === directory) return
    directory = parentDirectory
  }
}

function resolvePackageDirectory(directory: string) {
  try {
    return realpathSync(directory)
  } catch {
    return directory
  }
}

function findNodeModulesPackageRoot(baseDirectory: string, packageName: string) {
  let directory = resolve(baseDirectory)
  const packagePath = packageName.split('/')
  while (true) {
    const packageJSONFile = resolve(directory, 'node_modules', ...packagePath, 'package.json')
    if (existsSync(packageJSONFile)) {
      try {
        const packageJSON = readJSONFile<CSSPackageJSON>(packageJSONFile)
        if (packageJSON.name === packageName) {
          return {
            directory: resolvePackageDirectory(dirname(packageJSONFile)),
            packageJSON
          }
        }
      } catch {
        // Keep walking up in case this is not the package root.
      }
    }
    const parentDirectory = dirname(directory)
    if (parentDirectory === directory) return
    directory = parentDirectory
  }
}

function resolvePackageRoot(packageName: string, fromFile: string, projectDir?: string) {
  const resolvedFromFile = resolve(projectDir || '', fromFile)
  const searchDirectories = [
    projectDir,
    resolvedFromFile,
    dirname(resolvedFromFile),
    process.cwd()
  ].filter((directory): directory is string => typeof directory === 'string')

  for (const directory of new Set(searchDirectories)) {
    const packageRoot = findNodeModulesPackageRoot(directory, packageName)
    if (packageRoot) return packageRoot
  }

  const resolver = createProjectRequire(fromFile, projectDir)
  let packageEntryFile: string
  try {
    packageEntryFile = resolver.resolve(packageName)
  } catch {
    packageEntryFile = require.resolve(packageName)
  }
  return findPackageRoot(packageEntryFile, packageName)
}

function getPackageStyleEntry(packageJSON: CSSPackageJSON) {
  if (typeof packageJSON.style === 'string') return packageJSON.style
  if (!packageJSON.exports || typeof packageJSON.exports !== 'object') return
  const rootExport = (packageJSON.exports as Record<string, unknown>)['.']
  if (!rootExport || typeof rootExport !== 'object') return
  const styleExport = (rootExport as Record<string, unknown>).style
  return typeof styleExport === 'string' ? styleExport : undefined
}

function createProjectRequire(fromFile: string, projectDir?: string) {
  return createRequire(resolve(projectDir || dirname(fromFile), 'package.json'))
}

export function resolveStetCSSPackageEntryFile(importSource: string, fromFile = process.cwd(), projectDir?: string) {
  if (!STET_CSS_PACKAGE_IDS.has(importSource)) return
  const packageRoot = resolvePackageRoot(importSource, fromFile, projectDir)
  if (!packageRoot) return
  const styleEntry = getPackageStyleEntry(packageRoot.packageJSON)
  if (!styleEntry) return
  const styleFile = resolve(packageRoot.directory, styleEntry)
  if (!existsSync(styleFile)) {
    throw new Error(`${importSource} CSS style entry was not found: ${styleFile}`)
  }
  return styleFile
}

/** A stylesheet entry is recognised by its `@stet-css/core` import alone. */
export function inspectCSS(source: string): InspectCSSResult {
  const hasStetCSSImport = findCSSImportStatements(source)
    .some((statement) => statement.source === STET_CSS_PACKAGE_ID)
  return {
    hasStetCSSImport,
    hasStetEntry: hasStetCSSImport
  }
}

function resolveCSSImportGraphFile(
  file: string,
  readCSSImport: CSSImportGraphReader,
  dependencies: string[],
  dependencySet: Set<string>,
  stack: string[],
  options: ResolveCSSImportGraphFileOptions = {}
): string {
  const absoluteFile = resolve(file)
  if (stack.includes(absoluteFile)) {
    throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
  }
  options.onDependency?.(absoluteFile)
  if (!existsSync(absoluteFile)) {
    throw new Error(`CSS manifest entry file not found: ${absoluteFile}`)
  }
  if (!dependencySet.has(absoluteFile)) {
    dependencySet.add(absoluteFile)
    dependencies.push(absoluteFile)
  }

  const source = readCSSImport(absoluteFile)
  const references = findCSSReferenceStatements(source, absoluteFile)
  for (const reference of references) {
    options.onReference?.(reference, absoluteFile)
  }
  const sourceWithoutReferences = removeCSSReferenceStatements(source, absoluteFile)
  options.onSource?.(sourceWithoutReferences, Boolean(options.inPackage))
  return replaceCSSImportStatements(sourceWithoutReferences, absoluteFile, (importStatement: CSSImportStatement): string | undefined => {
    const importSource = importStatement.source
    const packageFile = options.expandPackageImports !== false
      ? resolveStetCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
      : undefined
    if (packageFile) {
      return resolveCSSImportGraphFile(packageFile, readCSSImport, dependencies, dependencySet, [...stack, absoluteFile], { ...options, inPackage: true })
    }
    if (isExpandableImportSource(importSource)) {
      const importedSource = resolveCSSImportGraphFile(resolve(dirname(absoluteFile), importSource), readCSSImport, dependencies, dependencySet, [...stack, absoluteFile], options)
      return applyCSSImportConditions(importedSource, importStatement.statement)
    }
  })
}

export function resolveCSSImportGraph(file: string, options: ResolveCSSImportGraphOptions = {}): ResolvedCSSImportGraph {
  return resolveCSSImportGraphWithReader(file, createCSSImportGraphReader(), options)
}

function resolveCSSImportGraphWithReader(
  file: string,
  readCSSImport: CSSImportGraphReader,
  options: ResolveCSSImportGraphOptions = {}
): ResolvedCSSImportGraph {
  const dependencies: string[] = []
  const references: CSSReferenceStatement[] = []
  const packageModes = new Set<string>()
  const ownModes = new Set<string>()
  const source = hoistCSSImportStatements(resolveCSSImportGraphFile(file, readCSSImport, dependencies, new Set(), [], {
    ...options,
    onReference(reference, fromFile) {
      references.push(reference)
      options.onReference?.(reference, fromFile)
    },
    onSource(fileSource, inPackage) {
      collectThemeModeNames(fileSource, inPackage ? packageModes : ownModes)
    }
  }))
  const implicitModes = [...packageModes].filter((mode) => !ownModes.has(mode))
  return {
    source,
    dependencies,
    ...(references.length ? { references } : {}),
    ...(implicitModes.length ? { implicitModes } : {})
  }
}

export function resolveStetCSSPackageImportGraph(projectDir?: string) {
  const entry = resolveStetCSSPackageEntryFile(STET_CSS_PACKAGE_ID, projectDir || process.cwd(), projectDir)
  if (!entry) {
    throw new Error(`Cannot resolve ${STET_CSS_PACKAGE_ID} CSS entry.`)
  }
  return resolveCSSImportGraph(entry, {
    projectDir
  })
}

function stripRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

function resolveComparablePath(file: string) {
  const filename = resolve(file)
  try {
    return realpathSync(filename)
  } catch {
    return filename
  }
}

export function isStetCSSPackageStyleFile(id: string, projectDir?: string) {
  const filename = resolveComparablePath(stripRequest(id))
  if (extname(filename) !== '.css') return false
  try {
    return resolveStetCSSPackageImportGraph(projectDir).dependencies.some((dependency) => {
      return resolveComparablePath(dependency) === filename
    })
  } catch {
    return false
  }
}

export function compileCSSFile(file: string, options: CompileCSSFileOptions = {}): CompileCSSResult {
  return compileCSSFileWithReader(file, createCSSImportGraphReader(), options)
}

function compileCSSFileWithReader(
  file: string,
  readCSSImport: CSSImportGraphReader,
  options: CompileCSSFileOptions = {}
): CompileCSSResult {
  const absoluteFile = isAbsolute(file) ? file : resolve(options.root || '', file)
  const graph = resolveCSSImportGraphWithReader(absoluteFile, readCSSImport, { projectDir: options.root, onDependency: options.onDependency })
  return compileCSSImportGraph(absoluteFile, graph, options)
}

/** Compiles the resolved import graph of `file`, an absolute path. */
function compileCSSImportGraph(
  file: string,
  graph: ResolvedCSSImportGraph,
  options: CompileCSSFileOptions = {}
): CompileCSSResult {
  const { root: _root, onDependency: _onDependency, ...compileOptions } = options
  const source = compileOptions.preserveNativeCSS === false
    ? removeCSSImportStatements(graph.source, file)
    : graph.source
  const result = compileCSS(source, {
    ...compileOptions,
    from: file
  })
  if (graph.implicitModes) result.manifestInput.implicitModes = graph.implicitModes
  return {
    ...result,
    dependencies: graph.dependencies,
    ...(graph.references?.length ? { references: graph.references } : {})
  }
}

function addUnique<T>(target: T[], values: Iterable<T> | undefined) {
  if (!values) return
  for (const value of values) {
    if (!target.includes(value)) target.push(value)
  }
}

function resolveCSSReferenceFile(reference: CSSDirectiveReference, options: CompileCSSManifestSourceOptions = {}) {
  const fromFile = reference.file
    ? isAbsolute(reference.file)
      ? reference.file
      : resolve(options.root || '', reference.file)
    : resolve(options.root || process.cwd(), 'stet.css')
  const packageFile = resolveStetCSSPackageEntryFile(reference.source, fromFile, options.root)
  if (packageFile) return packageFile
  if (isExpandableImportSource(reference.source)) return resolve(dirname(fromFile), reference.source)
  throw new Error(`@reference only supports relative CSS files or StetCSS package entries: ${reference.source}`)
}

/**
 * The most stylesheets one compile's `@reference` directives expand, counting every expansion in
 * the reference tree. Each expansion is a full compile of the referenced stylesheet, so a few files
 * that each reference the next one twice would otherwise grow exponentially.
 */
const MAX_CSS_REFERENCE_EXPANSIONS = 256

/** One `@reference` a compile expands: the referenced stylesheet's import graph and its own references. */
interface CSSReferenceExpansion {
  file: string
  /**
   * `Date.now()` before the compile's import graph reader read its first file. The reader keeps the
   * text it read, so a reference compile may see a file as it was then (#202).
   */
  startedAt: number
  graph: ResolvedCSSImportGraph
  references: CSSReferenceExpansion[]
}

/**
 * Resolves the whole reference tree of one compile before any referenced stylesheet is compiled,
 * so an oversized tree fails after reading at most 256 import graphs. Every graph reads through the
 * compile's `readCSSImport`, so referenced stylesheets' imports count toward the compile's import
 * limits. `stack` lists the stylesheets being compiled around `references`; `startedAt` is
 * `Date.now()` taken before `readCSSImport` read its first file.
 */
function resolveCSSReferenceTree(
  references: CSSDirectiveReference[] | undefined,
  readCSSImport: CSSImportGraphReader,
  stack: string[],
  startedAt: number,
  options: CompileCSSManifestSourceOptions
): CSSReferenceExpansion[] {
  let expansions = 0
  const expand = (
    levelReferences: CSSDirectiveReference[] | undefined,
    levelStack: string[],
    comparableStack: string[]
  ): CSSReferenceExpansion[] => {
    return (levelReferences || []).map((reference) => {
      const file = resolveCSSReferenceFile(reference, options)
      const comparableFile = resolveComparablePath(file)
      const chain = [...levelStack, file]
      if (comparableStack.includes(comparableFile)) {
        throw new Error(`Circular CSS reference: ${chain.join(' -> ')}`)
      }
      expansions++
      if (expansions > MAX_CSS_REFERENCE_EXPANSIONS) {
        throw new Error(`CSS references compile more than ${MAX_CSS_REFERENCE_EXPANSIONS} stylesheets, counting repeated references of the same file: ${chain.join(' -> ')}`)
      }
      const graph = resolveCSSImportGraphWithReader(file, readCSSImport, { projectDir: options.root, onDependency: options.onDependency })
      return {
        file,
        startedAt,
        graph,
        references: expand(graph.references, chain, [...comparableStack, comparableFile])
      }
    })
  }
  return expand(references, stack, stack.map((file) => resolveComparablePath(file)))
}

interface CSSReferenceContext {
  dependencies: string[]
  warnings: string[]
  manifest?: StetCSSManifest
}

/**
 * Compiled reference contexts by base manifest, then by the referenced files: every CSS module that
 * references the same stylesheet shares one compile of it while none of its files change (#202).
 */
const cssReferenceContextCache = createFileStampCache<CSSReferenceContext>(64)

function getCSSReferenceTreeKey(references: CSSReferenceExpansion[]): unknown[] {
  return references.map((reference) => [reference.file, getCSSReferenceTreeKey(reference.references)])
}

/**
 * Compiles resolved references once per base manifest and set of referenced files, reusing the
 * result while every file it read keeps its stamp. Warnings of a reused result reach `onWarning` again.
 */
function compileCSSReferences(
  references: CSSReferenceExpansion[],
  options: CompileCSSManifestInternalOptions = {}
): CSSReferenceContext {
  if (!references.length || options.diagnostics) return compileCSSReferencesUncached(references, options)
  const key = JSON.stringify([options.root ?? '', getCSSReferenceTreeKey(references)])
  const cached = cssReferenceContextCache.get(key, options.baseManifest)
  if (cached) {
    for (const warning of cached.warnings) options.onWarning?.(warning)
    return cached
  }
  const context = compileCSSReferencesUncached(references, options)
  cssReferenceContextCache.set(key, context, context.dependencies, references[0].startedAt, options.baseManifest)
  return context
}

/** Compiles resolved references in order; each one sees the definitions of the references before it. */
function compileCSSReferencesUncached(
  references: CSSReferenceExpansion[],
  options: CompileCSSManifestInternalOptions = {}
): CSSReferenceContext {
  const dependencies: string[] = []
  const warnings: string[] = []
  let manifest = options.baseManifest

  for (const reference of references) {
    const referenceOptions = {
      ...options,
      baseManifest: manifest,
      preserveNativeCSS: false,
      from: reference.file
    }
    const result = toCompileCSSManifestResult(
      compileCSSImportGraph(reference.file, reference.graph, referenceOptions),
      referenceOptions,
      reference.references
    )
    manifest = result.manifest
    addUnique(dependencies, result.dependencies)
    addUnique(warnings, result.warnings)
  }

  return {
    dependencies,
    warnings,
    ...(references.length ? { manifest } : {})
  }
}

function toCompileCSSManifestResult(
  result: CompileCSSResult,
  options: CompileCSSManifestInternalOptions,
  references: CSSReferenceExpansion[]
): CompileCSSManifestResult {
  const { manifestInput: _directiveManifestInput, ...directiveData } = result
  const referenceContext = compileCSSReferences(references, options)
  const lowerResult = lowerCSSDirectives(result, {
    baseManifest: options.baseManifest,
    resolutionManifest: referenceContext.manifest,
    onWarning: options.onWarning,
    diagnostics: options.diagnostics
  })
  const dependencies: string[] = []
  const warnings: string[] = []
  addUnique(dependencies, result.dependencies)
  addUnique(dependencies, referenceContext.dependencies)
  addUnique(warnings, referenceContext.warnings)
  addUnique(warnings, lowerResult.warnings)
  const generatedCSS = lowerResult.generatedCSS || ''
  const css = [
    result.nativeCSS,
    generatedCSS
  ].filter(Boolean).join('\n')
  return {
    ...directiveData,
    dependencies,
    manifest: lowerResult.manifest,
    resolutionManifest: lowerResult.resolutionManifest,
    warnings,
    generatedCSS,
    css,
    directives: result
  }
}

export function createManifestFromCSSResult(
  result: CompileCSSResult,
  options: CompileCSSManifestSourceOptions = {}
) {
  return toCompileCSSManifestResult(result, options, resolveCSSReferenceTree(result.references, createCSSImportGraphReader(), [], Date.now(), options))
}

export function compileCSSManifest(source: string, options: CompileCSSManifestSourceOptions = {}): CompileCSSManifestResult {
  const from = options.from ? stripRequest(options.from) : undefined
  const fromFile = from ? isAbsolute(from) ? from : resolve(options.root || '', from) : undefined
  const result = compileCSS(source, {
    ...options,
    ...(fromFile ? { from: fromFile } : {})
  })
  const manifestOptions = {
    ...options,
    ...(fromFile ? { from: fromFile } : {})
  }
  const references = resolveCSSReferenceTree(result.references, createCSSImportGraphReader(), fromFile ? [fromFile] : [], Date.now(), manifestOptions)
  return toCompileCSSManifestResult(result, manifestOptions, references)
}

/**
 * Compiles one entry stylesheet and lowers it into a manifest. One import graph reader serves the
 * entry's import graph and its whole reference tree, so referenced stylesheets' imports count toward
 * the entry's import limits. `options.from` is passed through to the lowered result.
 */
function compileCSSManifestEntry(file: string, options: CompileCSSManifestOptions) {
  const absoluteFile = isAbsolute(file) ? file : resolve(options.root || '', file)
  const readCSSImport = createCSSImportGraphReader()
  const startedAt = Date.now()
  const result = compileCSSFileWithReader(absoluteFile, readCSSImport, {
    ...options,
    preserveNativeCSS: options.preserveNativeCSS ?? false
  })
  const references = resolveCSSReferenceTree(result.references, readCSSImport, [absoluteFile], startedAt, options)
  return { result, manifestResult: toCompileCSSManifestResult(result, options, references) }
}

export function compileCSSManifestFile(file: string, options: CompileCSSManifestOptions = {}): CompileCSSManifestResult {
  const absoluteFile = isAbsolute(file) ? file : resolve(options.root || '', file)
  return compileCSSManifestEntry(absoluteFile, { ...options, from: absoluteFile }).manifestResult
}

export function compileProjectManifest(entries: string[], options: CompileCSSManifestOptions = {}): CompileProjectManifestResult {
  const dependencies: string[] = []
  let extractionPolicy = createCSSDirectiveExtractionPolicy()
  const classNames: string[] = []
  const nativeCSS: string[] = []
  const css: string[] = []
  const generatedCSS: string[] = []
  const warnings: string[] = []
  let directives: CompileCSSResult = {
    manifestInput: {},
    extractionPolicy: createCSSDirectiveExtractionPolicy(),
    classNames: [],
    nativeCSS: '',
    css: '',
    generatedCSS: '',
    warnings: [],
    dependencies: []
  }
  let manifest: StetCSSManifest | undefined = options.baseManifest
  for (const entry of entries) {
    const { result, manifestResult } = compileCSSManifestEntry(entry, {
      ...options,
      baseManifest: manifest,
      from: entry
    })
    directives = result
    extractionPolicy = mergeCSSDirectiveExtractionPolicy(extractionPolicy, result.extractionPolicy)
    addUnique(dependencies, result.dependencies)
    addUnique(classNames, result.classNames)
    addUnique(warnings, result.warnings)
    manifest = manifestResult.manifest
    addUnique(dependencies, manifestResult.dependencies)
    addUnique(warnings, manifestResult.warnings)
    const entryGeneratedCSS = manifestResult.generatedCSS || ''
    if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
    if (entryGeneratedCSS) generatedCSS.push(entryGeneratedCSS)
    if (manifestResult.css) css.push(manifestResult.css)
  }
  const resolvedManifest = manifest || createStetCSSManifest()
  return {
    entries,
    manifest: resolvedManifest,
    resolutionManifest: resolvedManifest,
    dependencies,
    extractionPolicy,
    classNames,
    nativeCSS: nativeCSS.join('\n'),
    css: css.join('\n'),
    generatedCSS: generatedCSS.join('\n'),
    warnings,
    directives
  }
}

function toManifestJSONResult<T extends { manifest: StetCSSManifest }>(result: T): T & { json: string } {
  return {
    ...result,
    json: stringifyStetCSSManifestJSON(result.manifest)
  }
}

export function compileCSSManifestJSON(file: string, options: CompileCSSManifestOptions = {}): CompileCSSManifestJSONResult {
  return toManifestJSONResult(compileCSSManifestFile(file, options))
}

export function compileProjectManifestJSON(entries: string[], options: CompileCSSManifestOptions = {}) {
  return toManifestJSONResult(compileProjectManifest(entries, options))
}
