import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import { MasterCSS, createCSSWithNativeDeclarations, defaultManifest } from './master-css'
import { findMasterCSSWorkspaceDirectoriesSync } from '@stet-css/project/entries'
import { loadProjectManifestSync } from '@stet-css/project/manifest-sync'
import path from 'node:path'
import { existsSync } from 'node:fs'
import isSameOrChildPath from './is-same-or-child-path'

const cssByWorkspaceDirectory = new Map<string, MasterCSS>()
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
    directories = findMasterCSSWorkspaceDirectoriesSync(cwd)
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

function resolvePlan(workspaceDir: string) {
  const result = loadProjectManifestSync(workspaceDir)
  return result.entries.length ? result.manifest : undefined
}

export default function resolveContext(context: RuleContext<any, any[]>) {
  const userSettings = context.settings?.['@stet-css']
  if ((userSettings as { manifest?: unknown } | undefined)?.manifest !== undefined) {
    throw new Error('The "manifest" setting of @stet-css is no longer supported; ESLint reads the manifest from the project\'s CSS entry (the CSS file that imports "@stet-css/core"), so define utilities, tokens, and variants there.')
  }
  const resolvedSettings = Object.assign({}, settings, userSettings)
  const filename = getContextFilename(context)
  const workspaceDir = filename ? resolveWorkspaceDirectory(context, filename) : context.cwd || process.cwd()
  let css = cssByWorkspaceDirectory.get(workspaceDir)

  if (!css) {
    const manifest = filename ? resolvePlan(workspaceDir) : undefined
    css = createCSSWithNativeDeclarations(manifest || defaultManifest)
    cssByWorkspaceDirectory.set(workspaceDir, css)
  }

  return {
    settings: resolvedSettings,
    options: context.options[0] || {},
    css
  }
}
