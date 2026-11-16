import type { CompileCSSManifestResult, CompileProjectManifestResult } from '@stet-css/compiler'
import type { StetCSSManifest } from '@stet-css/schema/manifest'

export interface LoadManifestOptions {
  baseManifest?: StetCSSManifest
  classes?: string[]
  onWarning?: (warning: string) => void
}

export type LoadManifestResult = CompileCSSManifestResult

export interface LoadProjectManifestOptions extends LoadManifestOptions {
  entries?: string[]
}

export type LoadProjectManifestResult = CompileProjectManifestResult
