import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@stet-css/schema/manifest-json'
import type { CSSDirectiveReference } from '@stet-css/schema/css-directives'
import { MASTER_CSS_ENTRY_DIRECTIVE_NAME } from '@stet-css/lexer'
import { createCSSImportGraphReader, type CSSImportGraphReader } from './css-import-graph-reader'
import { createMasterCSSManifest } from './master-css-manifest'
import lowerCSSDirectives from './lower-css-directives'
import type { CompilerDiagnosticRecorder } from './diagnostics'
import {
  compileCSS,
  createCSSDirectiveExtractionPolicy,
  findCSSReferenceStatements,
  findStandaloneMasterDirectiveStatements,
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
export { createCSSImportGraphReader, type CSSImportGraphReader } from './css-import-graph-reader'
export type {
  CompileCSSFileOptions,
  CompileCSSOptions,
  CompileCSSResult,
  CSSReferenceStatement,
  ResolvedCSSImportGraph,
  StandaloneCSSDirectiveStatement,
  StandaloneMasterDirectiveStatement
} from './core'

setCSSTransform(transform)

const require = createRequire(import.meta.url)
const MASTER_CSS_PACKAGE_ID = '@stet-css/core'
const MASTER_CSS_PACKAGE_IDS = new Set([MASTER_CSS_PACKAGE_ID, '@stet-css/preset'])

interface CSSPackageJSON {
  name?: unknown
  style?: unknown
  exports?: unknown
}

export interface InspectCSSResult {
  hasMasterEntryDirective: boolean
  hasMasterCSSImport: boolean
  hasMasterEntry: boolean
}

export interface ResolveCSSImportGraphOptions {
  projectDir?: string
  expandPackageImports?: boolean
  onReference?: (reference: CSSReferenceStatement, fromFile: string) => void
}

export type CompileCSSManifestOptions = CompileCSSFileOptions & {
  baseManifest?: MasterCSSManifest
}
export type CompileCSSManifestSourceOptions = CompileCSSOptions & {
  baseManifest?: MasterCSSManifest
  root?: string
}

type CompileCSSManifestInternalOptions = CompileCSSManifestSourceOptions & {
  diagnostics?: CompilerDiagnosticRecorder
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
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

export function resolveMasterCSSPackageEntryFile(importSource: string, fromFile = process.cwd(), projectDir?: string) {
  if (!MASTER_CSS_PACKAGE_IDS.has(importSource)) return
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

export function inspectCSS(source: string): InspectCSSResult {
  const hasMasterEntryDirective = findStandaloneMasterDirectiveStatements(source)
    .some((statement) => statement.name === MASTER_CSS_ENTRY_DIRECTIVE_NAME)
  const hasMasterCSSImport = findCSSImportStatements(source)
    .some((statement) => statement.source === MASTER_CSS_PACKAGE_ID)
  return {
    hasMasterEntryDirective,
    hasMasterCSSImport,
    hasMasterEntry: hasMasterEntryDirective || hasMasterCSSImport
  }
}

function resolveCSSImportGraphFile(
  file: string,
  readCSSImport: CSSImportGraphReader,
  dependencies: string[],
  dependencySet: Set<string>,
  stack: string[],
  options: ResolveCSSImportGraphOptions = {}
): string {
  const absoluteFile = resolve(file)
  if (stack.includes(absoluteFile)) {
    throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
  }
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
  const imports = findCSSImportStatements(sourceWithoutReferences, absoluteFile)
  if (!imports.length) return sourceWithoutReferences

  const preservedImports: string[] = []
  const resolvedSource = replaceCSSImportStatements(sourceWithoutReferences, absoluteFile, (importStatement: CSSImportStatement): string | undefined => {
    const importSource = importStatement.source
    const packageFile = options.expandPackageImports !== false
      ? resolveMasterCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
      : undefined
    if (packageFile || isExpandableImportSource(importSource)) {
      const importedFile = packageFile || resolve(dirname(absoluteFile), importSource)
      return resolveCSSImportGraphFile(importedFile, readCSSImport, dependencies, dependencySet, [...stack, absoluteFile], options)
    }
    preservedImports.push(importStatement.statement.trim())
    return ''
  })
  if (!preservedImports.length) return resolvedSource

  const firstImportStart = imports[0].start
  const afterImports = resolvedSource.slice(firstImportStart)
  return resolvedSource.slice(0, firstImportStart)
    + preservedImports.join('\n')
    + (afterImports ? '\n' : '')
    + afterImports
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
  const source = resolveCSSImportGraphFile(file, readCSSImport, dependencies, new Set(), [], {
    ...options,
    onReference(reference, fromFile) {
      references.push(reference)
      options.onReference?.(reference, fromFile)
    }
  })
  return {
    source,
    dependencies,
    ...(references.length ? { references } : {})
  }
}

export function resolveMasterCSSPackageImportGraph(projectDir?: string) {
  const entry = resolveMasterCSSPackageEntryFile(MASTER_CSS_PACKAGE_ID, projectDir || process.cwd(), projectDir)
  if (!entry) {
    throw new Error(`Cannot resolve ${MASTER_CSS_PACKAGE_ID} CSS entry.`)
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

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
  const filename = resolveComparablePath(stripRequest(id))
  if (extname(filename) !== '.css') return false
  try {
    return resolveMasterCSSPackageImportGraph(projectDir).dependencies.some((dependency) => {
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
  const graph = resolveCSSImportGraphWithReader(absoluteFile, readCSSImport, { projectDir: options.root })
  return compileCSSImportGraph(absoluteFile, graph, options)
}

/** Compiles the resolved import graph of `file`, an absolute path. */
function compileCSSImportGraph(
  file: string,
  graph: ResolvedCSSImportGraph,
  options: CompileCSSFileOptions = {}
): CompileCSSResult {
  const { root: _root, ...compileOptions } = options
  const source = compileOptions.preserveNativeCSS === false
    ? removeCSSImportStatements(graph.source, file)
    : graph.source
  const result = compileCSS(source, {
    ...compileOptions,
    from: file
  })
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
    : resolve(options.root || process.cwd(), 'master.css')
  const packageFile = resolveMasterCSSPackageEntryFile(reference.source, fromFile, options.root)
  if (packageFile) return packageFile
  if (isExpandableImportSource(reference.source)) return resolve(dirname(fromFile), reference.source)
  throw new Error(`@reference only supports relative CSS files or Master CSS package entries: ${reference.source}`)
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
  graph: ResolvedCSSImportGraph
  references: CSSReferenceExpansion[]
}

/**
 * Resolves the whole reference tree of one compile before any referenced stylesheet is compiled,
 * so an oversized tree fails after reading at most 256 import graphs. Every graph reads through the
 * compile's `readCSSImport`, so referenced stylesheets' imports count toward the compile's import
 * limits. `stack` lists the stylesheets being compiled around `references`.
 */
function resolveCSSReferenceTree(
  references: CSSDirectiveReference[] | undefined,
  readCSSImport: CSSImportGraphReader,
  stack: string[],
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
      const graph = resolveCSSImportGraphWithReader(file, readCSSImport, { projectDir: options.root })
      return {
        file,
        graph,
        references: expand(graph.references, chain, [...comparableStack, comparableFile])
      }
    })
  }
  return expand(references, stack, stack.map((file) => resolveComparablePath(file)))
}

/** Compiles resolved references in order; each one sees the definitions of the references before it. */
function compileCSSReferences(
  references: CSSReferenceExpansion[],
  options: CompileCSSManifestInternalOptions = {}
) {
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
  return toCompileCSSManifestResult(result, options, resolveCSSReferenceTree(result.references, createCSSImportGraphReader(), [], options))
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
  const references = resolveCSSReferenceTree(result.references, createCSSImportGraphReader(), fromFile ? [fromFile] : [], manifestOptions)
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
  const result = compileCSSFileWithReader(absoluteFile, readCSSImport, {
    ...options,
    preserveNativeCSS: options.preserveNativeCSS ?? false
  })
  const references = resolveCSSReferenceTree(result.references, readCSSImport, [absoluteFile], options)
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
  const nativeClassNames: string[] = []
  const nativeCSS: string[] = []
  const css: string[] = []
  const generatedCSS: string[] = []
  const warnings: string[] = []
  let directives: CompileCSSResult = {
    manifestInput: {},
    extractionPolicy: createCSSDirectiveExtractionPolicy(),
    classNames: [],
    nativeClassNames: [],
    nativeCSS: '',
    css: '',
    generatedCSS: '',
    warnings: [],
    dependencies: []
  }
  let manifest: MasterCSSManifest | undefined = options.baseManifest
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
    addUnique(nativeClassNames, result.nativeClassNames)
    addUnique(warnings, result.warnings)
    manifest = manifestResult.manifest
    addUnique(dependencies, manifestResult.dependencies)
    addUnique(warnings, manifestResult.warnings)
    const entryGeneratedCSS = manifestResult.generatedCSS || ''
    if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
    if (entryGeneratedCSS) generatedCSS.push(entryGeneratedCSS)
    if (manifestResult.css) css.push(manifestResult.css)
  }
  const resolvedManifest = manifest || createMasterCSSManifest()
  return {
    entries,
    manifest: resolvedManifest,
    resolutionManifest: resolvedManifest,
    dependencies,
    extractionPolicy,
    classNames,
    nativeClassNames,
    nativeCSS: nativeCSS.join('\n'),
    css: css.join('\n'),
    generatedCSS: generatedCSS.join('\n'),
    warnings,
    directives
  }
}

function toManifestJSONResult<T extends { manifest: MasterCSSManifest }>(result: T): T & { json: string } {
  return {
    ...result,
    json: stringifyMasterCSSManifestJSON(result.manifest)
  }
}

export function compileCSSManifestJSON(file: string, options: CompileCSSManifestOptions = {}): CompileCSSManifestJSONResult {
  return toManifestJSONResult(compileCSSManifestFile(file, options))
}

export function compileProjectManifestJSON(entries: string[], options: CompileCSSManifestOptions = {}) {
  return toManifestJSONResult(compileProjectManifest(entries, options))
}
