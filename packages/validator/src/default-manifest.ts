import { createRequire } from 'node:module'
import type { StetCSSManifest } from '@stet-css/schema/manifest'

const require = createRequire(import.meta.url)
const defaultManifest = require('@stet-css/preset/default-manifest.json') as StetCSSManifest

export default defaultManifest
