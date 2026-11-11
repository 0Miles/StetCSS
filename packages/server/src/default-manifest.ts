import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'

const defaultManifest = defaultManifestJSON as MasterCSSManifest

export default function getDefaultManifest() {
  return defaultManifest
}
