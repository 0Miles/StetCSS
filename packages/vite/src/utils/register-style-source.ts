import { readFileSync } from 'node:fs'
import {
  cleanStyleRequest,
  collectStyleCSSDependencies,
  isStyleCSSRequest,
  registerStyleCSSSource as registerStylesheetCSSSource,
  resolveStetStyleSource
} from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getProjectDir } from './project-dir'
import { includesFile } from './path'

// Typed through the stylesheet function: the inferred type would name @stet-css/schema, which
// this package does not depend on.
export async function registerStyleCSSSource(
  context: PluginContext,
  id: string,
  source: string
): ReturnType<typeof registerStylesheetCSSSource> {
  context.styleCSSSources ??= new Map()
  return registerStylesheetCSSSource(getScanner(context), context.styleCSSSources, id, source, {
    projectDir: getProjectDir(context)
  })
}

/**
 * A registration as comparable text. A wildcard `@blocklist` pattern is held as a RegExp,
 * which plain JSON writes as `{}`, so it is written as its source and flags.
 */
function serializeStyleCSSSource(context: PluginContext, key: string) {
  return JSON.stringify(context.styleCSSSources?.get(key), (_, value: unknown) =>
    value instanceof RegExp ? { regexp: value.source, flags: value.flags } : value)
}

/** Registers `source` for `id`, and tells whether that changed what the entry contributes. */
export async function updateStyleCSSSource(context: PluginContext, id: string, source: string) {
  const key = cleanStyleRequest(id)
  const previous = serializeStyleCSSSource(context, key)
  const result = await registerStyleCSSSource(context, id, source)
  return { result, changed: serializeStyleCSSSource(context, key) !== previous }
}

/**
 * Registers again, from disk, each registered entry that `file` belongs to (the entry or a
 * stylesheet it imports), so an extraction sees the edit before the entry's own transform
 * runs again. Returns whether any registration changed. An entry registered under a file
 * that is not a stylesheet (a Vue style block) is left to its transform, as is one that no
 * longer reads as an entry or fails to compile: the transform reports that.
 */
export async function registerEditedStyleEntries(context: PluginContext, file: string) {
  if (!isStyleCSSRequest(file) || !context.styleCSSSources?.size) return false
  const projectDir = getProjectDir(context)
  let changed = false
  for (const entry of [...context.styleCSSSources.keys()]) {
    if (!isStyleCSSRequest(entry)) continue
    if (!includesFile(collectStyleCSSDependencies(entry, undefined, projectDir), file)) continue
    try {
      const source = readFileSync(entry, 'utf8')
      if (!resolveStetStyleSource(entry, source, projectDir)) continue
      if ((await updateStyleCSSSource(context, entry, source)).changed) changed = true
    } catch {
      continue
    }
  }
  return changed
}
