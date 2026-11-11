import { type MasterCSS, type MasterCSSManifest } from '@stet-css/core'
import { createCSSWithNativeDeclarations } from '@stet-css/validator'
import { createRequire } from 'node:module'

export type { MasterCSS, MasterCSSManifest }
const require = createRequire(import.meta.url)
const defaultManifest = require('@stet-css/preset/default-manifest.json') as MasterCSSManifest
export { createCSSWithNativeDeclarations, defaultManifest }
