import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import CSSRuntime, { type StetCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest

export function startCSSRuntime(options: { manifest?: StetCSSManifest, root?: Document | ShadowRoot } = {}) {
  return CSSRuntime.create({ manifest: options.manifest || defaultManifest, root: options.root }).observe()
}
