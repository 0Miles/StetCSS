// Keep this import first: it sets the reveal fallback before the other modules evaluate.
import { cancelRevealFallback } from './reveal-fallback'
import CSSRuntime from './core'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'

try {
  CSSRuntime.create({ manifest: defaultManifestJSON as unknown as MasterCSSManifest }).observe()
} finally {
  // `create` and `observe` reveal the page on success and on failure.
  cancelRevealFallback()
}
