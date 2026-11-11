import { createMasterCSSHandle } from './lib/server.js'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@stet-css/core'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export const handle = createMasterCSSHandle({ manifest: defaultManifest })
