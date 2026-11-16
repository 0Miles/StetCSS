// Keep this import first: it sets the reveal fallback before the other modules evaluate.
import { cancelRevealFallback } from './reveal-fallback'
import CSSRuntime from './core'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'

// `create` and `observe` reveal the page themselves, also when they throw.
CSSRuntime.create({ manifest: defaultManifestJSON as unknown as StetCSSManifest }).observe()
cancelRevealFallback()
