import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

export interface ResolvedMasterCSSWorkspacePackage {
  name: string
  entry: string
  directory: string
  packageJSON?: string
  version?: string
}

export interface MasterCSSWorkspacePackageResolution {
  workspaceDir: string
  css?: ResolvedMasterCSSWorkspacePackage
  engine?: ResolvedMasterCSSWorkspacePackage
  presetManifest?: ResolvedMasterCSSWorkspacePackage
  utilityType?: ResolvedMasterCSSWorkspacePackage
  languageServer?: ResolvedMasterCSSWorkspacePackage
  errors: MasterCSSWorkspacePackageResolutionError[]
}

export interface MasterCSSWorkspacePackageResolutionError {
  name: string
  message: string
}

interface PackageJSON {
  name?: unknown
  version?: unknown
}

function readPackageJSON(file: string): PackageJSON | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as PackageJSON
  } catch {
    return
  }
}

function findPackageDir(entry: string, packageName: string) {
  let current = statSync(entry).isDirectory() ? entry : dirname(entry)
  while (current !== dirname(current)) {
    const packageJSONPath = join(current, 'package.json')
    if (existsSync(packageJSONPath)) {
      const packageJSON = readPackageJSON(packageJSONPath)
      if (packageJSON?.name === packageName) {
        return {
          directory: current,
          packageJSONPath,
          version: typeof packageJSON.version === 'string' ? packageJSON.version : undefined
        }
      }
    }
    current = dirname(current)
  }
}

function resolvePackage(
  name: string,
  resolver: NodeJS.Require
): ResolvedMasterCSSWorkspacePackage {
  const entry = resolver.resolve(name)
  const packageName = name.startsWith('@stet-css/preset/') ? '@stet-css/preset'
    : name.startsWith('@stet-css/schema/') ? '@stet-css/schema'
      : name.startsWith('@stet-css/language-server/') ? '@stet-css/language-server'
        : name
  const packageRoot = findPackageDir(entry, packageName)
  if (!packageRoot) {
    throw new Error(`Unable to find package root for ${name} from ${entry}`)
  }
  return {
    name,
    entry,
    directory: packageRoot.directory,
    packageJSON: packageRoot.packageJSONPath,
    version: packageRoot.version
  }
}

function tryResolvePackage(
  name: string,
  resolver: NodeJS.Require,
  errors: MasterCSSWorkspacePackageResolutionError[]
) {
  try {
    return resolvePackage(name, resolver)
  } catch (error) {
    errors.push({
      name,
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function createWorkspaceRequire(workspaceDir: string) {
  return createRequire(join(resolve(workspaceDir), 'package.json'))
}

function createPackageRequire(resolvedPackage: ResolvedMasterCSSWorkspacePackage) {
  return createRequire(resolvedPackage.packageJSON || join(resolvedPackage.directory, 'package.json'))
}

export function resolveMasterCSSWorkspacePackages(workspaceDir = process.cwd()): MasterCSSWorkspacePackageResolution {
  const errors: MasterCSSWorkspacePackageResolutionError[] = []
  const workspaceRequire = createWorkspaceRequire(workspaceDir)
  const css = tryResolvePackage('@stet-css/core', workspaceRequire, errors)
  const result: MasterCSSWorkspacePackageResolution = {
    workspaceDir: resolve(workspaceDir),
    errors,
    ...(css ? { css } : {})
  }

  if (css) {
    const cssRequire = createPackageRequire(css)
    const engine = tryResolvePackage('@stet-css/engine', cssRequire, errors)
    if (engine) {
      result.engine = engine
      const engineRequire = createPackageRequire(engine)
      result.utilityType = tryResolvePackage('@stet-css/schema/utility-type', engineRequire, errors)
    }
    result.presetManifest = tryResolvePackage('@stet-css/preset/default-manifest.json', cssRequire, errors)
  }

  const languageServer = tryResolvePackage('@stet-css/language-server/server', workspaceRequire, errors)
  if (languageServer) result.languageServer = languageServer

  return result
}

function parseVersionMajor(version: string | undefined) {
  if (!version) return
  const match = /^\D*(\d+)/.exec(version)
  return match ? Number(match[1]) : undefined
}

export function isCompatibleMasterCSSPackageVersion(actualVersion: string | undefined, expectedVersion: string | undefined) {
  const actualMajor = parseVersionMajor(actualVersion)
  const expectedMajor = parseVersionMajor(expectedVersion)
  return actualMajor === undefined || expectedMajor === undefined || actualMajor === expectedMajor
}
