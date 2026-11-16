import CSSRuntime from './core'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/schema/manifest'

CSSRuntime.create({ manifest: defaultManifestJSON as unknown as MasterCSSManifest }).observe()
