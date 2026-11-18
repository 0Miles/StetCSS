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
  /**
   * Reuse the manifest an earlier call loaded for the same directory, entries and base manifest
   * while every entry and every file it imports keeps its modification time, change time and size.
   * The result is then shared between callers: read it, never change it. A result that differs
   * from the last one is a new object, so callers can key their own derived state on it.
   */
  cache?: boolean
}

export type LoadProjectManifestResult = CompileProjectManifestResult
