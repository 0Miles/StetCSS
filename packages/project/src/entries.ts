import { readFileSync, readdirSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  inspectCSS,
  resolveMasterCSSPackageEntryFile
} from '@stet-css/compiler'
import {
  collectCSSDirectiveRanges,
  createMasterCSSManifestEntryPattern,
  hasMasterCSSManifestEntrypoint as hasMasterCSSManifestEntrypointFallback,
  isMasterCSSModuleId,
  normalizeMasterCSSModuleIds
} from '@stet-css/lexer'
import { stripResourceQuery } from '@stet-css/integration/manifest-module'
import { isIgnoredProjectDirectory } from './sources'

const MASTER_CSS_PACKAGE_NAME_PATTERN = /^@stet-css\/(?!eslint-|create$)/

const PACKAGE_JSON_DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
] as const

type PackageJSON = Partial<Record<typeof PACKAGE_JSON_DEPENDENCY_FIELDS[number], unknown>>

/** Extensions manifest discovery reads: manifests load from plain CSS only. */
export const CSS_MANIFEST_ENTRY_EXTENSIONS: readonly string[] = ['.css']

/**
 * Extensions a stylesheet entry may have: a Sass file importing `@stet-css/core` is an entry
 * for static CSS too, compiled with the project's own `sass`.
 */
export const STYLE_ENTRY_EXTENSIONS: readonly string[] = ['.css', '.scss', '.sass']

export interface FindCSSManifestEntryFilesOptions {
  /** File extensions that can be entries; defaults to `CSS_MANIFEST_ENTRY_EXTENSIONS`. */
  extensions?: readonly string[]
}

export function cleanCSSManifestRequest(id: string) {
  return stripResourceQuery(id)
}

export function isCSSManifestRequest(id: string) {
  return extname(cleanCSSManifestRequest(id)) === '.css'
}

export {
  createMasterCSSManifestEntryPattern,
  isMasterCSSModuleId,
  normalizeMasterCSSModuleIds,
  resolveMasterCSSPackageEntryFile
}

export function hasMasterCSSManifestEntrypoint(source: string) {
  try {
    return inspectCSS(source).hasMasterEntry
  } catch {
    return hasMasterCSSManifestEntrypointFallback(source)
  }
}

/**
 * Whether discovery lists `source`: an entry (`@import '@stet-css/core'`), or a stylesheet that
 * still holds a removed `@master` at-rule. The latter is no entry, but listing it lets every tool
 * that compiles the entries (CLI scan and inspect, the language server, the bundlers) fail with
 * the compiler's replacement message instead of silently finding no entries.
 */
function isDiscoveredCSSManifestEntry(source: string) {
  return hasMasterCSSManifestEntrypoint(source)
    || (source.includes('@master') && collectCSSDirectiveRanges(source).some((range) => range.name === 'master'))
}

async function collectCSSManifestEntryFiles(root: string, directory: string, entries: string[], extensions: readonly string[]) {
  try {
    for (const dirent of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (isIgnoredProjectDirectory(relative(root, file))) continue
        await collectCSSManifestEntryFiles(root, file, entries, extensions)
        continue
      }
      if (!dirent.isFile() || !extensions.includes(extname(dirent.name))) continue
      try {
        if (isDiscoveredCSSManifestEntry(await readFile(file, 'utf8'))) {
          entries.push(file)
        }
      } catch {
        // Ignore files that disappear or become unreadable while scanning.
      }
    }
  } catch {
    // Ignore directories that disappear or are unreadable while scanning.
  }
}

function collectCSSManifestEntryFilesSync(root: string, directory: string, entries: string[], extensions: readonly string[]) {
  try {
    for (const dirent of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (isIgnoredProjectDirectory(relative(root, file))) continue
        collectCSSManifestEntryFilesSync(root, file, entries, extensions)
        continue
      }
      if (!dirent.isFile() || !extensions.includes(extname(dirent.name))) continue
      try {
        if (isDiscoveredCSSManifestEntry(readFileSync(file, 'utf8'))) {
          entries.push(file)
        }
      } catch {
        // Ignore files that disappear or become unreadable while scanning.
      }
    }
  } catch {
    // Ignore directories that disappear or are unreadable while scanning.
  }
}

export async function findCSSManifestEntryFiles(projectDir = process.cwd(), options: FindCSSManifestEntryFilesOptions = {}) {
  const entries: string[] = []
  const root = resolve(projectDir)
  await collectCSSManifestEntryFiles(root, root, entries, options.extensions ?? CSS_MANIFEST_ENTRY_EXTENSIONS)
  return entries.sort()
}

export function findCSSManifestEntryFilesSync(projectDir = process.cwd(), options: FindCSSManifestEntryFilesOptions = {}) {
  const entries: string[] = []
  const root = resolve(projectDir)
  collectCSSManifestEntryFilesSync(root, root, entries, options.extensions ?? CSS_MANIFEST_ENTRY_EXTENSIONS)
  return entries.sort()
}

export async function findCSSManifestEntryFile(projectDir = process.cwd()) {
  return (await findCSSManifestEntryFiles(projectDir))[0]
}

export function findCSSManifestEntryFileSync(projectDir = process.cwd()) {
  return findCSSManifestEntryFilesSync(projectDir)[0]
}

function isMasterCSSDependencyName(dependency: string) {
  return MASTER_CSS_PACKAGE_NAME_PATTERN.test(dependency)
}

function hasMasterCSSDependency(packageJSON: PackageJSON) {
  return PACKAGE_JSON_DEPENDENCY_FIELDS.some((field) => {
    const dependencies = packageJSON[field]
    if (!dependencies || typeof dependencies !== 'object') return false
    return Object.keys(dependencies).some(isMasterCSSDependencyName)
  })
}

async function collectMasterCSSPackageWorkspaceDirectories(root: string, directory: string, directories: Set<string>) {
  try {
    for (const dirent of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (isIgnoredProjectDirectory(relative(root, file))) continue
        await collectMasterCSSPackageWorkspaceDirectories(root, file, directories)
        continue
      }
      if (!dirent.isFile() || dirent.name !== 'package.json') continue
      try {
        if (hasMasterCSSDependency(JSON.parse(await readFile(file, 'utf8')) as PackageJSON)) {
          directories.add(dirname(file))
        }
      } catch {
        // Ignore invalid or disappearing package.json files.
      }
    }
  } catch {
    // Ignore directories that disappear or are unreadable while scanning.
  }
}

function collectMasterCSSPackageWorkspaceDirectoriesSync(root: string, directory: string, directories: Set<string>) {
  try {
    for (const dirent of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (isIgnoredProjectDirectory(relative(root, file))) continue
        collectMasterCSSPackageWorkspaceDirectoriesSync(root, file, directories)
        continue
      }
      if (!dirent.isFile() || dirent.name !== 'package.json') continue
      try {
        if (hasMasterCSSDependency(JSON.parse(readFileSync(file, 'utf8')) as PackageJSON)) {
          directories.add(dirname(file))
        }
      } catch {
        // Ignore invalid or disappearing package.json files.
      }
    }
  } catch {
    // Ignore directories that disappear or are unreadable while scanning.
  }
}

function isSameOrChildPath(parentPath: string, childPath: string) {
  const relativePath = relative(parentPath, childPath)
  return relativePath === ''
    || (
      !!relativePath
      && relativePath !== '..'
      && !relativePath.startsWith(`..${sep}`)
      && !isAbsolute(relativePath)
    )
}

function resolveWorkspaceDirectoryForEntry(cssFile: string, workspaceDirectories: Set<string>) {
  let closestDirectory: string | undefined
  const absoluteCSSFile = resolve(cssFile)
  for (const workspaceDir of workspaceDirectories) {
    const absoluteWorkspaceDir = resolve(workspaceDir)
    if (
      isSameOrChildPath(absoluteWorkspaceDir, absoluteCSSFile)
      && (!closestDirectory || absoluteWorkspaceDir.length > closestDirectory.length)
    ) {
      closestDirectory = absoluteWorkspaceDir
    }
  }
  return closestDirectory || dirname(absoluteCSSFile)
}

export async function findMasterCSSWorkspaceDirectories(rootDir = process.cwd()) {
  const root = resolve(rootDir)
  const directories = new Set<string>([root])
  const packageDirectories = new Set<string>()
  await collectMasterCSSPackageWorkspaceDirectories(root, root, packageDirectories)
  for (const directory of packageDirectories) {
    directories.add(directory)
  }
  for (const entry of await findCSSManifestEntryFiles(root)) {
    directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
  }
  return [...directories].sort()
}

export function findMasterCSSWorkspaceDirectoriesSync(rootDir = process.cwd()) {
  const root = resolve(rootDir)
  const directories = new Set<string>([root])
  const packageDirectories = new Set<string>()
  collectMasterCSSPackageWorkspaceDirectoriesSync(root, root, packageDirectories)
  for (const directory of packageDirectories) {
    directories.add(directory)
  }
  for (const entry of findCSSManifestEntryFilesSync(root)) {
    directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
  }
  return [...directories].sort()
}
