import { resolve } from 'node:path'
import { createFileStampCache, type FileStampCache } from '@stet-css/compiler'
import type { LoadProjectManifestOptions, LoadProjectManifestResult } from './options'

/** Project manifests by base manifest, then by project directory and entries. */
const projectManifestCaches = new WeakMap<object, FileStampCache<LoadProjectManifestResult>>()
const NO_BASE_MANIFEST = {}

/**
 * Runs `compile` for the project's manifest, or with `options.cache` returns the result an earlier
 * call compiled for the same directory, entries and base manifest while every entry and every file
 * they import keeps its stamp. The cached result is shared: read it, never change it. Its warnings
 * reach `onWarning` again on every call.
 */
export function loadCachedProjectManifest(
  projectDir: string,
  entries: string[],
  options: LoadProjectManifestOptions,
  compile: () => LoadProjectManifestResult
): LoadProjectManifestResult {
  if (!options.cache) return compile()
  const baseManifestKey = options.baseManifest ?? NO_BASE_MANIFEST
  let cache = projectManifestCaches.get(baseManifestKey)
  if (!cache) {
    cache = createFileStampCache()
    projectManifestCaches.set(baseManifestKey, cache)
  }
  const key = JSON.stringify([resolve(projectDir), entries])
  const cached = cache.get(key)
  if (cached) {
    for (const warning of cached.warnings) options.onWarning?.(warning)
    return cached
  }
  const startedAt = Date.now()
  const result = compile()
  cache.set(key, result, [...entries, ...result.dependencies], startedAt)
  return result
}
