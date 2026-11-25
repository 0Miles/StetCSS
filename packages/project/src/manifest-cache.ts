import { resolve } from 'node:path'
import { createFileStampCache } from '@stet-css/compiler'
import type { LoadProjectManifestOptions, LoadProjectManifestResult } from './options'

/** Project manifests by base manifest, then by project directory and entries. */
const projectManifestCache = createFileStampCache<LoadProjectManifestResult>(16)

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
  const key = JSON.stringify([resolve(projectDir), entries])
  const cached = projectManifestCache.get(key, options.baseManifest)
  if (cached) {
    for (const warning of cached.warnings) options.onWarning?.(warning)
    if (options.onDependency) {
      for (const file of new Set([...entries, ...cached.dependencies])) options.onDependency(file)
    }
    return cached
  }
  const startedAt = Date.now()
  const result = compile()
  projectManifestCache.set(key, result, [...entries, ...result.dependencies], startedAt, options.baseManifest)
  return result
}
