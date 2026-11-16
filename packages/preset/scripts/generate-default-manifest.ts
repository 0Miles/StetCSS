import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MasterCSS } from '@stet-css/engine'
import { normalizeStetCSSManifestForJSON, stringifyStetCSSManifestJSON } from '@stet-css/schema/manifest-json'
import type { StetCSSManifest } from '@stet-css/schema/manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const manifestOutputFile = resolve(packageRoot, 'src/default-manifest.json')
const nativeCSSOutputFile = resolve(packageRoot, 'src/default-native.css')
const defaultEngineSettings = MasterCSS.create({ manifest: { version: 1 } }).settings
const { compileCSSManifestFile } = await import(new URL('../../compiler/src/index.ts', import.meta.url).href) as typeof import('@stet-css/compiler')
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isDefaultSettingValue(value: unknown, defaultValue: unknown) {
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return value.length === defaultValue.length
      && value.every((item, index) => item === defaultValue[index])
  }
  return value === defaultValue
}

function createDefaultManifestSettings(settings: StetCSSManifest['settings']): StetCSSManifest['settings'] {
  if (!settings) return
  const entries = Object.entries(settings).filter(([key, value]) =>
    !isDefaultSettingValue(value, defaultEngineSettings[key as keyof typeof defaultEngineSettings])
  )
  return entries.length ? Object.fromEntries(entries) as StetCSSManifest['settings'] : undefined
}

export function createDefaultManifest(cssManifest: StetCSSManifest): StetCSSManifest {
  const settings = createDefaultManifestSettings(cssManifest.settings)
  return normalizeStetCSSManifestForJSON({
    version: 1,
    ...(settings ? { settings } : {}),
    ...(cssManifest.variables ? { variables: clone(cssManifest.variables) } : {}),
    ...(cssManifest.animations ? { animations: clone(cssManifest.animations) } : {}),
    ...(cssManifest.variants ? { variants: clone(cssManifest.variants) } : {}),
    ...(cssManifest.conditions ? { conditions: clone(cssManifest.conditions) } : {}),
    ...(cssManifest.breakpointConditions ? { breakpointConditions: clone(cssManifest.breakpointConditions) } : {}),
    ...(cssManifest.containerConditions ? { containerConditions: clone(cssManifest.containerConditions) } : {}),
    ...(cssManifest.selectors ? { selectors: clone(cssManifest.selectors) } : {}),
    ...(cssManifest.utilities ? { utilities: clone(cssManifest.utilities) } : {})
  })
}

export function createDefaultManifestFromSourceFile(file = sourceFile) {
  return createDefaultManifest(compileCSSManifestFile(file).manifest)
}

export function createDefaultNativeCSSFromSourceFile(file = sourceFile) {
  return compileCSSManifestFile(file, {
    preserveNativeCSS: true
  }).directives.nativeCSS
}

export function createDefaultManifestJSON(manifest: StetCSSManifest) {
  return stringifyStetCSSManifestJSON(manifest)
}

export function writeDefaultManifest(file = manifestOutputFile) {
  writeFileSync(file, createDefaultManifestJSON(createDefaultManifestFromSourceFile()))
}

export function writeDefaultNativeCSS(file = nativeCSSOutputFile) {
  writeFileSync(file, createDefaultNativeCSSFromSourceFile())
}

export function writeDefaultPresetArtifacts() {
  writeDefaultManifest()
  writeDefaultNativeCSS()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeDefaultPresetArtifacts()
}
