import { readFileSync, readdirSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  inspectCSS,
  resolveStetCSSPackageEntryFile
} from '@stet-css/compiler'
import {
  createStetCSSManifestEntryPattern,
  findMasterAtRule,
  hasStetCSSManifestEntrypoint as hasStetCSSManifestEntrypointFallback,
  isStetCSSModuleId,
  normalizeStetCSSModuleIds
} from '@stet-css/lexer'
import { stripResourceQuery } from '@stet-css/integration/manifest-module'
import { isIgnoredProjectDirectory } from './sources'

const STET_CSS_PACKAGE_NAME_PATTERN = /^@stet-css\/(?!eslint-|create$)/

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
  createStetCSSManifestEntryPattern,
  isStetCSSModuleId,
  normalizeStetCSSModuleIds,
  resolveStetCSSPackageEntryFile
}

export function hasStetCSSManifestEntrypoint(source: string) {
  try {
    return inspectCSS(source).hasStetEntry
  } catch {
    return hasStetCSSManifestEntrypointFallback(source)
  }
}

/**
 * Whether discovery lists `source`: an entry (`@import '@stet-css/core'`), or a stylesheet that
 * still holds a removed `@master` at-rule. The latter is no entry, but listing it lets every tool
 * that compiles the entries (CLI scan and inspect, the language server, the bundlers) fail with
 * the compiler's replacement message instead of silently finding no entries.
 */
function isDiscoveredCSSManifestEntry(source: string) {
  return hasStetCSSManifestEntrypoint(source) || Boolean(findMasterAtRule(source))
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

function isStetCSSDependencyName(dependency: string) {
  return STET_CSS_PACKAGE_NAME_PATTERN.test(dependency)
}

function hasStetCSSDependency(packageJSON: PackageJSON) {
  return PACKAGE_JSON_DEPENDENCY_FIELDS.some((field) => {
    const dependencies = packageJSON[field]
    if (!dependencies || typeof dependencies !== 'object') return false
    return Object.keys(dependencies).some(isStetCSSDependencyName)
  })
}

async function collectStetCSSPackageWorkspaceDirectories(root: string, directory: string, directories: Set<string>) {
  try {
    for (const dirent of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (isIgnoredProjectDirectory(relative(root, file))) continue
        await collectStetCSSPackageWorkspaceDirectories(root, file, directories)
        continue
      }
      if (!dirent.isFile() || dirent.name !== 'package.json') continue
      try {
        if (hasStetCSSDependency(JSON.parse(await readFile(file, 'utf8')) as PackageJSON)) {
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

function collectStetCSSPackageWorkspaceDirectoriesSync(root: string, directory: string, directories: Set<string>) {
  try {
    for (const dirent of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (isIgnoredProjectDirectory(relative(root, file))) continue
        collectStetCSSPackageWorkspaceDirectoriesSync(root, file, directories)
        continue
      }
      if (!dirent.isFile() || dirent.name !== 'package.json') continue
      try {
        if (hasStetCSSDependency(JSON.parse(readFileSync(file, 'utf8')) as PackageJSON)) {
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

export async function findStetCSSWorkspaceDirectories(rootDir = process.cwd()) {
  const root = resolve(rootDir)
  const directories = new Set<string>([root])
  const packageDirectories = new Set<string>()
  await collectStetCSSPackageWorkspaceDirectories(root, root, packageDirectories)
  for (const directory of packageDirectories) {
    directories.add(directory)
  }
  for (const entry of await findCSSManifestEntryFiles(root)) {
    directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
  }
  return [...directories].sort()
}

export function findStetCSSWorkspaceDirectoriesSync(rootDir = process.cwd()) {
  const root = resolve(rootDir)
  const directories = new Set<string>([root])
  const packageDirectories = new Set<string>()
  collectStetCSSPackageWorkspaceDirectoriesSync(root, root, packageDirectories)
  for (const directory of packageDirectories) {
    directories.add(directory)
  }
  for (const entry of findCSSManifestEntryFilesSync(root)) {
    directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
  }
  return [...directories].sort()
}
