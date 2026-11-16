import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { findCSSManifestEntryFiles, STYLE_ENTRY_EXTENSIONS } from '@stet-css/project/entries'
import {
  cleanStyleRequest,
  createExtractedCSSResult,
  registerStyleCSSSource,
  type StyleCSSSource,
  type StyleCSSSources
} from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getStylesheetSourceContext } from './extracted-css'
import { normalizeFilePath } from './path'
import { getProjectDir } from './project-dir'
import { getScanner } from './scanner-context'

/** A discovered entry read from disk, reused while its source stays the same. */
interface DiscoveredEntry {
  source: string
  styleSource?: StyleCSSSource
  error?: string
}

const discoveredEntries = new WeakMap<PluginContext, Map<string, DiscoveredEntry>>()

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
  const cached = cache.get(file)
  if (cached?.source === source) return cached
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
  cache.set(file, entry)
  return entry
}

/**
 * A digest of what the generated CSS is made of, which a build puts in the placeholder so the
 * CSS asset's hashed file name follows the CSS spliced in later.
 *
 * It covers every stylesheet entry the project's discovery finds, read from disk, plus the
 * registered ones discovery misses, such as Vue style blocks. Transform order then cannot
 * change it: a stylesheet transformed before a lazily loaded chunk's entry was registered
 * still carries that entry. Over-covering is harmless, since an entry the build does not
 * import only renames the asset when it changes.
 */
export async function createBuildDigest(context: PluginContext) {
  const projectDir = getProjectDir(context)
  const entries = new Map<string, DiscoveredEntry>()
  for (const file of await findCSSManifestEntryFiles(projectDir, { extensions: STYLE_ENTRY_EXTENSIONS })) {
    entries.set(toEntryKey(file), await readDiscoveredEntry(context, file))
  }
  for (const [id, styleSource] of context.styleCSSSources ?? []) {
    const key = toEntryKey(id)
    if (!entries.has(key)) entries.set(key, { source: styleSource.source, styleSource })
  }
  const keys = [...entries.keys()].sort()
  const styleCSSSources: StyleCSSSources = new Map()
  for (const key of keys) {
    const styleSource = entries.get(key)?.styleSource
    if (styleSource) styleCSSSources.set(key, styleSource)
  }
  const { css } = await createExtractedCSSResult({
    ...getStylesheetSourceContext(context),
    styleCSSSources
  })
  const hash = createHash('sha256').update(css)
  // Paths relative to the project, so a checkout elsewhere (another CI runner) keeps the names.
  const root = normalizeFilePath(projectDir ?? process.cwd())
  for (const key of keys) {
    const entry = entries.get(key)!
    const name = relative(root, key).replace(/\\/g, '/')
    hash.update('\0' + name + '\0' + (entry.styleSource?.source ?? '') + '\0' + (entry.error ?? ''))
  }
  // An identifier, so CSS minifiers keep it as is: a leading digit would read as a number.
  return 'h' + hash.digest('hex').slice(0, 16)
}
