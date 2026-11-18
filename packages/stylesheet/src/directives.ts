import { existsSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import {
  collectStandaloneCSSDirectiveExtractionPolicy,
  createCSSDirectiveExtractionPolicy,
  createCSSImportGraphReader,
  findStandaloneCSSDirectiveStatements,
  mergeCSSDirectiveExtractionPolicy,
  removeStandaloneCSSDirectives,
  type CSSImportGraphReader,
  type StandaloneCSSDirectiveStatement
} from '@stet-css/compiler'
import { findCSSImportStatements, parseCSSImportSource } from '@stet-css/lexer'
import type { CSSDirectiveExtractionPolicy } from '@stet-css/schema/css-directives'

export type StylesheetDirectives = CSSDirectiveExtractionPolicy

export type StylesheetDirectiveStatement = StandaloneCSSDirectiveStatement

export interface StylesheetSourceOptions {
  include?: string[]
  exclude?: string[]
  safelist?: string[]
  blocklist?: (string | RegExp)[]
}

export interface CollectedStylesheetDirectives {
  directives: StylesheetDirectives
  dependencies: string[]
}

export function createStylesheetDirectives(): StylesheetDirectives {
  return createCSSDirectiveExtractionPolicy()
}

export function hasStylesheetDirectives(directives?: StylesheetDirectives) {
  return Boolean(directives && (
    directives.include.length ||
    directives.exclude.length ||
    directives.safelist.length ||
    directives.blocklist.length
  ))
}

export function hasStylesheetSourceDirectives(directives?: StylesheetDirectives) {
  return Boolean(directives && (
    directives.include.length ||
    directives.exclude.length
  ))
}

function normalizePath(source: string) {
  return source.replace(/\\/g, '/')
}

function normalizeSourcePattern(pattern: string, file?: string, cwd = process.cwd()) {
  if (pattern.startsWith('./') || pattern.startsWith('../')) {
    const absolutePattern = resolve(file ? dirname(file) : cwd, pattern)
    return normalizePath(relative(cwd, absolutePattern) || '.')
  }
  if (isAbsolute(pattern)) {
    return normalizePath(relative(cwd, pattern) || '.')
  }
  return normalizePath(pattern)
}

export function mergeStylesheetDirectives(...directives: (Partial<StylesheetDirectives> | undefined)[]) {
  return mergeCSSDirectiveExtractionPolicy(...directives)
}

export function mergeStylesheetSourceOptions<T extends StylesheetSourceOptions>(options: T, directives?: StylesheetDirectives): T {
  if (!directives) return options
  return {
    ...options,
    include: [...new Set([...(options.include || []), ...directives.include])],
    exclude: [...new Set([...(options.exclude || []), ...directives.exclude])],
    safelist: [...new Set([...(options.safelist || []), ...directives.safelist])],
    blocklist: [...(options.blocklist || []), ...directives.blocklist]
  } as T
}

export function findStylesheetDirectiveStatements(source: string): StylesheetDirectiveStatement[] {
  return findStandaloneCSSDirectiveStatements(source)
}

export function removeStylesheetDirectiveStatements(source: string) {
  const code = removeStandaloneCSSDirectives(source)
  return {
    code,
    removed: code !== source
  }
}

export function collectStylesheetDirectives(source: string, file?: string, cwd = process.cwd()): StylesheetDirectives {
  const directives = collectStandaloneCSSDirectiveExtractionPolicy(source, file)
  directives.include = directives.include.map((arg: string) => normalizeSourcePattern(arg, file, cwd))
  directives.exclude = directives.exclude.map((arg: string) => normalizeSourcePattern(arg, file, cwd))
  return directives
}

function isExpandableStyleImportSource(source: string) {
  return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function collectCSSGraphDirectivesFile(
  file: string,
  source: string,
  readCSSImport: CSSImportGraphReader,
  cwd: string,
  dependencies: string[],
  dependencySet: Set<string>,
  stack: string[]
): StylesheetDirectives {
  const absoluteFile = resolve(file)
  if (stack.includes(absoluteFile)) {
    throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
  }
  if (!dependencySet.has(absoluteFile)) {
    dependencySet.add(absoluteFile)
    dependencies.push(absoluteFile)
  }

  let directives = collectStylesheetDirectives(source, absoluteFile, cwd)
  for (const importStatement of findCSSImportStatements(source)) {
    const importSource = parseCSSImportSource(importStatement.statement)
    if (!importSource || !isExpandableStyleImportSource(importSource)) continue
    const importedFile = resolve(dirname(absoluteFile), importSource)
    if (!existsSync(importedFile)) {
      throw new Error(`CSS file not found: ${importedFile}`)
    }
    directives = mergeStylesheetDirectives(
      directives,
      collectCSSGraphDirectivesFile(
        importedFile,
        readCSSImport(importedFile),
        readCSSImport,
        cwd,
        dependencies,
        dependencySet,
        [...stack, absoluteFile]
      )
    )
  }
  return directives
}

export function collectStylesheetDirectivesFromCSSGraph(file: string, source?: string, cwd = process.cwd()): CollectedStylesheetDirectives {
  const dependencies: string[] = []
  const filename = resolve(file)
  const readCSSImport = createCSSImportGraphReader()
  return {
    directives: collectCSSGraphDirectivesFile(
      filename,
      readCSSImport(filename, source),
      readCSSImport,
      cwd,
      dependencies,
      new Set(),
      []
    ),
    dependencies
  }
}

export function resolveStylesheetSourcePaths(options: StylesheetSourceOptions, cwd = process.cwd()) {
  const paths = new Set<string>()
  if (options.include?.length) {
    for (const sourcePath of fg.sync(options.include, { cwd, ignore: options.exclude })) {
      if (sourcePath) paths.add(sourcePath)
    }
  }
  return [...paths]
}
