import { createRequire } from 'node:module'
import type { MasterCSSManifest } from '@stet-css/schema/manifest'

const require = createRequire(import.meta.url)
const defaultManifest = require('@stet-css/preset/default-manifest.json') as MasterCSSManifest

export default defaultManifest
