import { readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, matchesGlob, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import { findProjectSourceFiles, isProjectSourceFile } from '@stet-css/project/sources'
import { extractSourceClassCandidates, type SourceAdapter } from '@stet-css/source'
import { filterExcludedClasses, type ClassExcludePattern } from './class-exclusion'

/**
 * One stylesheet entry's view of the project: which files it reads classes from and which
 * classes it forces in or out.
 */
export interface StylesheetSourceScope {
  /** Root of the project's own source files; `@source` patterns are relative to it. */
  projectDir: string
  /** Glob patterns that replace the project's own source files as the base file set. */
  sources?: string[]
  /** `@source` patterns: files added on top of the base file set. */
  include?: string[]
  /** `@source not` patterns: files removed from the result. */
  exclude?: string[]
  /** `@safelist` classes. */
  safelist?: string[]
  /** `@blocklist` classes and patterns. */
  blocklist?: ClassExcludePattern[]
  /** Custom source adapters tried before the built-in ones. */
  adapters?: SourceAdapter[]
}

interface CachedCandidates {
  mtimeMs: number
  ctimeMs: number
  size: number
  candidates: string[]
}

/** Cache key for scopes without custom adapters: only the built-in ones apply. */
const NO_CUSTOM_ADAPTERS: SourceAdapter[] = []
const candidateCaches = new WeakMap<readonly SourceAdapter[], Map<string, CachedCandidates>>()

function toPosixPath(path: string) {
  return path.replace(/\\/g, '/')
}

function toProjectPattern(pattern: string, projectDir: string) {
  const normalizedPattern = isAbsolute(pattern)
    ? toPosixPath(relative(projectDir, pattern)) || '.'
    : toPosixPath(pattern).replace(/^\.\//, '')
  return normalizedPattern.length > 1 ? normalizedPattern.replace(/\/$/, '') : normalizedPattern
}

function toProjectPatterns(patterns: string[] | undefined, projectDir: string) {
  return (patterns || []).map((pattern) => toProjectPattern(pattern, projectDir))
}

function isPathPattern(pattern: string) {
  return !fg.isDynamicPattern(pattern)
}

/**
 * Whether a `@source` or source path pattern covers a file: a glob matches the file, and a
 * pattern without glob characters names the file or a directory containing it.
 */
function isIncludedPath(relativePath: string, patterns: string[]) {
  return patterns.some((pattern) => matchesGlob(relativePath, pattern)
    || (isPathPattern(pattern) && relativePath.startsWith(pattern + '/')))
}

/**
 * Whether a `@source not` pattern covers a file: it matches the file or any directory
 * containing it, as fast-glob's `ignore` skips a matched directory.
 */
function isExcludedPath(relativePath: string, patterns: string[]) {
  if (!patterns.length) return false
  for (let path = relativePath; path && path !== '.';) {
    if (patterns.some((pattern) => matchesGlob(path, pattern))) return true
    const parent = toPosixPath(dirname(path))
    if (parent === path) break
    path = parent
  }
  return false
}

function isDirectory(path: string) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/** Lists the files `isIncludedPath` accepts for the same patterns. */
function globIncludedFiles(patterns: string[], projectDir: string) {
  if (!patterns.length) return []
  const directoryPatterns = patterns
    .filter((pattern) => isPathPattern(pattern) && isDirectory(resolve(projectDir, pattern)))
    .map((pattern) => fg.escapePath(pattern) + '/**')
  return [
    ...fg.sync(patterns, { cwd: projectDir }),
    ...(directoryPatterns.length ? fg.sync(directoryPatterns, { cwd: projectDir, dot: true }) : [])
  ].map((file) => resolve(projectDir, file))
}

function withoutExcludedFiles(files: Iterable<string>, projectDir: string, excludePatterns: string[] | undefined) {
  const exclude = toProjectPatterns(excludePatterns, projectDir)
  return [...new Set(files)]
    .filter((file) => !isExcludedPath(toPosixPath(relative(projectDir, file)), exclude))
    .sort()
}

/** `@source` files of a scope minus its `@source not` files, without the base file set. */
export function resolveStylesheetIncludedFiles(scope: Pick<StylesheetSourceScope, 'projectDir' | 'include' | 'exclude'>) {
  if (!scope.include?.length) return []
  const projectDir = resolve(scope.projectDir)
  return withoutExcludedFiles(globIncludedFiles(toProjectPatterns(scope.include, projectDir), projectDir), projectDir, scope.exclude)
}

/**
 * Lists the files a scope reads classes from: the project's own source files (or the
 * `sources` patterns), plus `@source` files, minus `@source not` files.
 */
export async function resolveStylesheetScopeFiles(scope: StylesheetSourceScope) {
  const projectDir = resolve(scope.projectDir)
  return withoutExcludedFiles([
    ...(scope.sources ? globIncludedFiles(toProjectPatterns(scope.sources, projectDir), projectDir) : await findProjectSourceFiles(projectDir)),
    ...globIncludedFiles(toProjectPatterns(scope.include, projectDir), projectDir)
  ], projectDir, scope.exclude)
}

/**
 * Whether `file`, absolute or relative to the project root, belongs to a scope's file set;
 * agrees with `resolveStylesheetScopeFiles` for one path without listing the project.
 */
export function isStylesheetScopeFile(file: string, scope: StylesheetSourceScope) {
  const projectDir = resolve(scope.projectDir)
  const absoluteFile = resolve(projectDir, file)
  const relativePath = toPosixPath(relative(projectDir, absoluteFile))
  if (isExcludedPath(relativePath, toProjectPatterns(scope.exclude, projectDir))) return false
  const isBaseFile = scope.sources
    ? isIncludedPath(relativePath, toProjectPatterns(scope.sources, projectDir))
    : isProjectSourceFile(absoluteFile, projectDir)
  return isBaseFile || isIncludedPath(relativePath, toProjectPatterns(scope.include, projectDir))
}

async function readCandidates(file: string, adapters: readonly SourceAdapter[]) {
  let cache = candidateCaches.get(adapters)
  if (!cache) {
    cache = new Map()
    candidateCaches.set(adapters, cache)
  }
  let stats
  try {
    stats = statSync(file)
  } catch {
    cache.delete(file)
    return []
  }
  const cached = cache.get(file)
  if (cached && cached.mtimeMs === stats.mtimeMs && cached.ctimeMs === stats.ctimeMs && cached.size === stats.size) {
    return cached.candidates
  }
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    cache.delete(file)
    return []
  }
  const candidates = content
    ? await extractSourceClassCandidates({ source: file, content }, adapters)
    : []
  cache.set(file, {
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs,
    size: stats.size,
    candidates
  })
  return candidates
}

/**
 * The scope's class set: candidates extracted from its files, plus classes the caller
 * detected elsewhere, plus `@safelist`, minus `@blocklist`. Rendering keeps only candidates
 * that generate rules.
 */
export async function collectStylesheetScopeClasses(scope: StylesheetSourceScope, detectedClasses: Iterable<string> = []) {
  const adapters = scope.adapters?.length ? scope.adapters : NO_CUSTOM_ADAPTERS
  const classes = new Set([...detectedClasses, ...(scope.safelist || [])])
  for (const file of await resolveStylesheetScopeFiles(scope)) {
    for (const className of await readCandidates(file, adapters)) {
      classes.add(className)
    }
  }
  return filterExcludedClasses([...classes], scope.blocklist)
}
