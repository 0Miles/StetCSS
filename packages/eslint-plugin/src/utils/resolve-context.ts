import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { StetCSS, createCSSWithNativeDeclarations, defaultManifest } from './stet-css'
import { findCSSManifestEntryFilesSync, findStetCSSWorkspaceDirectoriesSync } from '@stet-css/project/entries'
import { loadProjectManifestSync, type LoadProjectManifestResult } from '@stet-css/project/manifest-sync'
import path from 'node:path'
import { existsSync } from 'node:fs'
import isSameOrChildPath from './is-same-or-child-path'

/**
 * CSS derived from a project manifest result. The cached load returns the same result while the
 * workspace's entries and every file they import keep their stamps, and a new one after an edit,
 * so a long-running ESLint (an editor, eslint_d) follows CSS entry edits without a restart.
 */
const cssByManifestResult = new WeakMap<LoadProjectManifestResult, StetCSS>()
const workspaceDirectoriesByCwd = new Map<string, string[]>()

function getContextFilename(context: RuleContext<any, any[]>) {
  const filename = context.physicalFilename || context.filename
  if (!filename || filename.startsWith('<')) return
  const resolvedFilename = path.isAbsolute(filename) ? filename : path.resolve(context.cwd, filename)
  return existsSync(resolvedFilename) ? resolvedFilename : undefined
}

function getWorkspaceDirectories(cwd: string) {
  let directories = workspaceDirectoriesByCwd.get(cwd)
  if (!directories) {
    directories = findStetCSSWorkspaceDirectoriesSync(cwd)
    workspaceDirectoriesByCwd.set(cwd, directories)
  }
  return directories
}

function findNearestPackageDirectory(filename: string) {
  let directory = path.dirname(filename)
  const root = path.parse(directory).root
  while (directory !== root) {
    if (existsSync(path.join(directory, 'package.json'))) return directory
    directory = path.dirname(directory)
  }
  return path.dirname(filename)
}

function resolveSearchDirectory(context: RuleContext<any, any[]>, filename: string) {
  const cwd = path.resolve(context.cwd || process.cwd())
  const root = path.parse(cwd).root
  if (cwd !== root && isSameOrChildPath(cwd, filename)) return cwd
  return findNearestPackageDirectory(filename)
}

function resolveWorkspaceDirectory(context: RuleContext<any, any[]>, filename: string) {
  const cwd = resolveSearchDirectory(context, filename)
  let closestDirectory: string | undefined
  for (const directory of getWorkspaceDirectories(cwd)) {
    if (
      isSameOrChildPath(directory, filename)
      && (!closestDirectory || directory.length > closestDirectory.length)
    ) {
      closestDirectory = directory
    }
  }
  return closestDirectory || cwd
}

/**
 * How long a workspace's discovered entry files are trusted. Discovery walks the whole workspace,
 * so it runs at most this often per workspace rather than once per linted file; a CSS entry added
 * in between reaches the lint after at most this long.
 */
export const ENTRY_DISCOVERY_TTL_MS = 5000

const entriesByWorkspaceDirectory = new Map<string, { entries: string[], discoveredAt: number }>()

function discoverEntries(workspaceDir: string) {
  const entries = findCSSManifestEntryFilesSync(workspaceDir)
  entriesByWorkspaceDirectory.set(workspaceDir, { entries, discoveredAt: Date.now() })
  return entries
}

function loadWorkspaceManifest(workspaceDir: string) {
  const known = entriesByWorkspaceDirectory.get(workspaceDir)
  if (!known || Date.now() - known.discoveredAt >= ENTRY_DISCOVERY_TTL_MS) {
    return loadProjectManifestSync(workspaceDir, { entries: discoverEntries(workspaceDir), cache: true })
  }
  try {
    return loadProjectManifestSync(workspaceDir, { entries: known.entries, cache: true })
  } catch (error) {
    // A known entry may be gone; only an error that fresh entries reproduce is the project's.
    const entries = discoverEntries(workspaceDir)
    if (entries.length === known.entries.length && entries.every((entry, index) => entry === known.entries[index])) throw error
    return loadProjectManifestSync(workspaceDir, { entries, cache: true })
  }
}

function getWorkspaceCSS(workspaceDir: string) {
  const result = loadWorkspaceManifest(workspaceDir)
  let css = cssByManifestResult.get(result)
  if (!css) {
    css = createCSSWithNativeDeclarations(result.entries.length ? result.manifest : defaultManifest)
    cssByManifestResult.set(result, css)
  }
  return css
}

/**
 * The CSS each linted file resolved, so every rule on one file reads the same manifest, and a file
 * linted in the seconds after a CSS edit, while the manifest cache will not yet keep the result,
 * compiles the project once rather than once per rule.
 */
const cssBySourceCode = new WeakMap<object, StetCSS>()

function getFileCSS(context: RuleContext<any, any[]>, filename: string) {
  const sourceCode = context.sourceCode as object | undefined
  let css = sourceCode && cssBySourceCode.get(sourceCode)
  if (!css) {
    css = getWorkspaceCSS(resolveWorkspaceDirectory(context, filename))
    if (sourceCode) cssBySourceCode.set(sourceCode, css)
  }
  return css
}

// Text without a file on disk has no workspace, so it never shares the per-workspace cache.
let defaultCSS: StetCSS | undefined
function getDefaultCSS() {
  defaultCSS ??= createCSSWithNativeDeclarations(defaultManifest)
  return defaultCSS
}

export default function resolveContext(context: RuleContext<any, any[]>) {
  const userSettings = context.settings?.['@stet-css']
  if ((userSettings as { manifest?: unknown } | undefined)?.manifest !== undefined) {
    throw new Error('The @stet-css "manifest" setting is no longer supported: remove it and define utilities, tokens, and variants in the project\'s CSS entry (the CSS file that imports "@stet-css/core"), which is where ESLint reads the manifest from.')
  }
  const resolvedSettings = Object.assign({}, settings, userSettings)
  const filename = getContextFilename(context)
  const css = filename
    ? getFileCSS(context, filename)
    : getDefaultCSS()

  return {
    settings: resolvedSettings,
    options: context.options[0] || {},
    css
  }
}
