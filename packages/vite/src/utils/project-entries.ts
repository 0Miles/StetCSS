import { readFileSync } from 'node:fs'
import { findCSSManifestEntryFiles, STYLE_ENTRY_EXTENSIONS } from '@stet-css/project/entries'
import {
  cleanStyleRequest,
  registerStyleCSSSource,
  resolveStyleCSSImportGraph,
  type StyleCSSSource,
  type StyleCSSSources
} from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { normalizeFilePath } from './path'
import { getProjectDir } from './project-dir'
import { getScanner } from './scanner-context'

/** A discovered entry read from disk, reused while its import graph stays the same. */
export interface DiscoveredEntry {
  source: string
  styleSource?: StyleCSSSource
  error?: string
}

const discoveredEntries = new WeakMap<PluginContext, Map<string, { graph: string, entry: DiscoveredEntry }>>()

/**
 * The entry with the stylesheets it imports inlined: what its registration, leading layers
 * included, is read from. A failed resolution keys on its error, which registration repeats.
 */
function readEntryGraph(context: PluginContext, file: string, source: string) {
  try {
    return resolveStyleCSSImportGraph(file, source, getProjectDir(context), { expandStetCSSPackage: false }).source
  } catch (error) {
    return source + '\0' + String(error)
  }
}

/** The entry's file path, with the request's query kept: a Vue style block is one of several. */
function toEntryKey(id: string) {
  return normalizeFilePath(cleanStyleRequest(id)) + id.slice(cleanStyleRequest(id).length)
}
async function readDiscoveredEntry(context: PluginContext, file: string): Promise<DiscoveredEntry> {
  let cache = discoveredEntries.get(context)
  if (!cache) discoveredEntries.set(context, cache = new Map())
  let source: string
  try {
    source = readFileSync(file, 'utf8')
  } catch (error) {
    return { source: '', error: String(error) }
  }
  // Keyed on the whole import graph, not the entry's own text: editing a file the entry imports
  // ahead of `@import '@stet-css/core'` changes its leading layers (#250).
  const graph = readEntryGraph(context, file, source)
  const cached = cache.get(file)
  if (cached?.graph === graph) return cached.entry
  const styleCSSSources: StyleCSSSources = new Map()
  let entry: DiscoveredEntry
  try {
    await registerStyleCSSSource(getScanner(context), styleCSSSources, file, source, {
      projectDir: getProjectDir(context)
    })
    entry = { source, styleSource: styleCSSSources.get(file) }
  } catch (error) {
    // An entry this build never imports must not fail it; its error still marks the digest.
    entry = { source, error: error instanceof Error ? error.message : String(error) }
  }
  cache.set(file, { graph, entry })
  return entry
}

/**
 * Every stylesheet entry the project's discovery finds, read from disk, plus the registered ones
 * discovery misses, such as Vue style blocks, by key in path order. Transform order cannot change
 * it: a stylesheet transformed before a lazily loaded chunk's entry was registered still sees that
 * entry. `styleCSSSources` holds the entries that registered without an error.
 */
export async function collectProjectEntries(context: PluginContext) {
  const entries = new Map<string, DiscoveredEntry>()
  for (const file of await findCSSManifestEntryFiles(getProjectDir(context), { extensions: STYLE_ENTRY_EXTENSIONS })) {
    entries.set(toEntryKey(file), await readDiscoveredEntry(context, file))
  }
  for (const [id, styleSource] of context.styleCSSSources ?? []) {
    const key = toEntryKey(id)
    if (!entries.has(key)) entries.set(key, { source: styleSource.source, styleSource })
  }
  const sorted = new Map([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
  const styleCSSSources: StyleCSSSources = new Map()
  for (const [key, entry] of sorted) {
    if (entry.styleSource) styleCSSSources.set(key, entry.styleSource)
  }
  return { entries: sorted, styleCSSSources }
}

/**
 * The layers every project entry writes before `@import '@stet-css/core'`, in entry order, over the
 * same entries as `collectProjectEntries`: what extracted CSS leads with once every entry has
 * registered (#250).
 */
export async function collectProjectLeadingLayers(context: PluginContext) {
  const { styleCSSSources } = await collectProjectEntries(context)
  return [...new Set(Array.from(styleCSSSources.values(), (styleSource) => styleSource.leadingLayers ?? []).flat())]
}
