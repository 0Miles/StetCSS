import { type StetCSS, type StetCSSManifest } from '@stet-css/core'
import { createCSSWithNativeDeclarations } from '@stet-css/validator'
import { createRequire } from 'node:module'

export type { StetCSS, StetCSSManifest }
const require = createRequire(import.meta.url)
const defaultManifest = require('@stet-css/preset/default-manifest.json') as StetCSSManifest
export { createCSSWithNativeDeclarations, defaultManifest }
