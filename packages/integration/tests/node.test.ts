import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createVirtualDefaultManifestModulePathPattern,
  ensureVirtualManifestModulePath,
  ensureVirtualEmittedGlobalsModulePath,
  fromResolvedMasterCSSManifestId,
  toHashedManifestAssetFileName,
  toResolvedMasterCSSManifestId,
  toVirtualCSSModulePath,
  toVirtualCSSManifestAssetPath,
  toVirtualCSSManifestModulePath,
  toVirtualDefaultManifestModulePath,
  toVirtualEmittedGlobalsModulePath,
  toVirtualModulePackageJSONPath
} from '../src/node'
import { EMPTY_MANIFEST_JSON } from '../src/manifest-module'
import { toInlineManifestModule } from '../src/manifest-facade'
import { EMPTY_EMITTED_GLOBALS_MODULE } from '../src/emitted-globals-module'

let fixtureDir: string | undefined

function createFixtureDir() {
  fixtureDir = mkdtempSync(path.join(tmpdir(), 'master-css-integration-node-'))
  return fixtureDir
}

afterEach(() => {
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('@stet-css/integration/node', () => {
  it('encodes resolved and filesystem virtual module paths', () => {
    const root = path.resolve('/project')
    const file = path.join(root, 'src', 'theme.css')
    const id = toResolvedMasterCSSManifestId(file)

    expect(id).not.toContain('.css')
    expect(id).not.toContain('%2Ecss')
    expect(fromResolvedMasterCSSManifestId(id)).toBe(file)
    expect(toVirtualDefaultManifestModulePath(root)).toBe(path.join(root, 'node_modules', '.master-css', 'master-css-manifest.js'))
    expect(toVirtualCSSManifestModulePath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.manifest\.js$/)
    expect(toVirtualCSSManifestAssetPath(root, file)).toMatch(/node_modules[/\\]\.master-css[/\\].+\.manifest\.json$/)
    expect(toVirtualCSSModulePath(root)).toBe(path.join(root, 'node_modules', '.master-css', 'master-utilities.css'))
    expect(toVirtualEmittedGlobalsModulePath(root)).toBe(path.join(root, 'node_modules', '.master-css', 'master-css-emitted-globals.js'))
    expect(toVirtualModulePackageJSONPath(root)).toBe(path.join(root, 'node_modules', '.master-css', 'package.json'))
    expect(createVirtualDefaultManifestModulePathPattern().test(toVirtualDefaultManifestModulePath(root))).toBe(true)
  })

  it('keeps virtual manifest file names within the file system name limit for deep source paths', () => {
    const root = path.resolve('/project')
    const deepFile = path.join(root, ...Array.from({ length: 12 }, (_, index) => `nested-directory-${index}`), 'theme.css')
    const otherDeepFile = deepFile.replace('theme.css', 'other.css')
    const moduleName = path.basename(toVirtualCSSManifestModulePath(root, deepFile))
    const assetName = path.basename(toVirtualCSSManifestAssetPath(root, deepFile))

    expect(Buffer.byteLength(moduleName)).toBeLessThanOrEqual(255)
    expect(Buffer.byteLength(assetName)).toBeLessThanOrEqual(255)
    expect(moduleName).toMatch(/\.manifest\.js$/)
    expect(assetName).toMatch(/\.manifest\.json$/)
    expect(toVirtualCSSManifestModulePath(root, deepFile)).toBe(toVirtualCSSManifestModulePath(root, deepFile))
    expect(toVirtualCSSManifestModulePath(root, otherDeepFile)).not.toBe(toVirtualCSSManifestModulePath(root, deepFile))
    expect(path.basename(toVirtualCSSManifestModulePath(root, path.join(root, 'src', 'theme.css'))))
      .toBe(`${Buffer.from(path.join(root, 'src', 'theme.css')).toString('base64url')}.manifest.js`)
  })

  it('hashes manifest asset file names', () => {
    expect(toHashedManifestAssetFileName('{"version":1}')).toMatch(/^master-css-manifest\.[a-f0-9]{8}\.json$/)
    expect(toHashedManifestAssetFileName('{"version":1}', 'manifest')).toMatch(/^manifest\.[a-f0-9]{8}\.json$/)
  })

  it('updates stale virtual module placeholders', () => {
    const projectDir = createFixtureDir()
    const manifestPath = toVirtualDefaultManifestModulePath(projectDir)
    const emittedGlobalsPath = toVirtualEmittedGlobalsModulePath(projectDir)

    mkdirSync(path.dirname(manifestPath), { recursive: true })
    writeFileSync(manifestPath, 'export default { version: 1 };')
    writeFileSync(emittedGlobalsPath, 'export default {};')

    expect(ensureVirtualManifestModulePath(projectDir)).toBe(manifestPath)
    expect(ensureVirtualEmittedGlobalsModulePath(projectDir)).toBe(emittedGlobalsPath)
    expect(readFileSync(manifestPath, 'utf8')).toBe(toInlineManifestModule(EMPTY_MANIFEST_JSON))
    expect(readFileSync(emittedGlobalsPath, 'utf8')).toBe(EMPTY_EMITTED_GLOBALS_MODULE)
    expect(JSON.parse(readFileSync(toVirtualModulePackageJSONPath(projectDir), 'utf8'))).toEqual({ type: 'module' })
  })
})
