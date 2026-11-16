import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import CSSRuntime, { type MasterCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export function startCSSRuntime(options: { manifest?: MasterCSSManifest } = {}) {
  return CSSRuntime.create({ manifest: options.manifest || defaultManifest }).observe()
}
