import { readdir, realpath, stat } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

/**
 * File extensions read as project sources. Stylesheets are excluded: CSS reaches the
 * class set only through stylesheet entries.
 */
export const PROJECT_SOURCE_EXTENSIONS: readonly string[] = [
  '.html',
  '.htm',
  '.js',
  '.jsx',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.svelte',
  '.astro',
  '.vue',
  '.md',
  '.mdx',
  '.pug',
  '.php'
]

/**
 * Directories skipped at any depth when looking for project sources and CSS entries:
 * dependencies, version control, build outputs, and tool caches.
 */
export const PROJECT_IGNORED_DIRECTORIES: readonly string[] = [
  'node_modules',
  'vendor',
  '.git',
  '.hg',
  '.svn',
  'build',
  'dist',
  'out',
  '.astro',
  '.next',
  '.nuxt',
  '.output',
  '.svelte-kit',
  '.vercel',
  '.netlify',
  '.wrangler',
  '.serverless',
  '.docusaurus',
  '.cache',
  '.vite',
  '.turbo',
  '.parcel-cache',
  '.yarn',
  '.pnpm-store',
  '.npm',
  '.bun',
  '.nx/cache',
  '.vitepress/cache',
  '.vitepress/dist'
]

const sourceExtensions = new Set(PROJECT_SOURCE_EXTENSIONS)
const ignoredDirectoryNames = new Set(PROJECT_IGNORED_DIRECTORIES.filter((directory) => !directory.includes('/')))
const ignoredNestedDirectories = PROJECT_IGNORED_DIRECTORIES.filter((directory) => directory.includes('/'))

function toSegments(relativePath: string) {
  return relativePath.split(/[\\/]/).filter(Boolean)
}

function isIgnoredDirectorySegments(segments: string[]) {
  const name = segments[segments.length - 1]
  if (name === undefined) return false
  if (ignoredDirectoryNames.has(name)) return true
  const path = segments.join('/')
  return ignoredNestedDirectories.some((directory) => path === directory || path.endsWith('/' + directory))
}

/**
 * Whether a directory, given relative to the project root, is skipped by source and
 * entry discovery.
 */
export function isIgnoredProjectDirectory(relativeDirectory: string) {
  return isIgnoredDirectorySegments(toSegments(relativeDirectory))
}

function isIgnoredSourceFileName(name: string) {
  return name.endsWith('.d.ts')
    || name.includes('.test.')
    || name.endsWith('README.md')
}

function isWithinProject(relativePath: string) {
  return relativePath !== ''
    && relativePath !== '..'
    && !relativePath.startsWith('..' + sep)
    && !isAbsolute(relativePath)
}

/**
 * Whether `file` is one of the project's own source files: inside `projectDir`, with a
 * source extension, and outside every ignored directory.
 */
export function isProjectSourceFile(file: string, projectDir: string) {
  const relativePath = relative(resolve(projectDir), resolve(file))
  if (!isWithinProject(relativePath)) return false
  const name = basename(relativePath)
  if (!sourceExtensions.has(extname(name)) || isIgnoredSourceFileName(name)) return false
  const segments = toSegments(relativePath).slice(0, -1)
  for (let index = 1; index <= segments.length; index++) {
    if (isIgnoredDirectorySegments(segments.slice(0, index))) return false
  }
  return true
}

async function getEntryType(path: string, dirent: { isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean }) {
  if (!dirent.isSymbolicLink()) {
    return dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : undefined
  }
  try {
    const stats = await stat(path)
    return stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : undefined
  } catch {
    // Ignore broken symlinks.
    return undefined
  }
}

async function collectProjectSourceFiles(root: string, segments: string[], files: string[], ancestors: readonly string[]) {
  const directory = join(root, ...segments)
  let dirents
  let realDirectory: string
  try {
    // Symlinked directories are followed, except a link back to a directory on the current path.
    realDirectory = await realpath(directory)
    if (ancestors.includes(realDirectory)) return
    dirents = await readdir(directory, { withFileTypes: true })
  } catch {
    // Ignore directories that disappear or are unreadable while scanning.
    return
  }
  await Promise.all(dirents.map(async (dirent) => {
    const path = join(directory, dirent.name)
    const type = await getEntryType(path, dirent)
    if (type === 'directory') {
      const directorySegments = [...segments, dirent.name]
      if (isIgnoredDirectorySegments(directorySegments)) return
      await collectProjectSourceFiles(root, directorySegments, files, [...ancestors, realDirectory])
      return
    }
    if (type !== 'file') return
    if (!sourceExtensions.has(extname(dirent.name)) || isIgnoredSourceFileName(dirent.name)) return
    files.push(path)
  }))
}

/**
 * Lists the project's own source files under `projectDir` as sorted absolute paths,
 * following symlinked files and directories.
 */
export async function findProjectSourceFiles(projectDir = process.cwd()) {
  const files: string[] = []
  await collectProjectSourceFiles(resolve(projectDir), [], files, [])
  return files.sort()
}
