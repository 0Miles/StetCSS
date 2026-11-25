import { createHash } from 'node:crypto'
import { relative } from 'node:path'
import { createExtractedCSSResult } from '@stet-css/stylesheet'
import type { PluginContext } from '../core'
import { getStylesheetSourceContext } from './extracted-css'
import { normalizeFilePath } from './path'
import { getProjectDir } from './project-dir'
import { collectProjectEntries } from './project-entries'

/**
 * A digest of what the generated CSS is made of, which a build puts in the placeholder so the
 * CSS asset's hashed file name follows the CSS spliced in later.
 *
 * It covers the entries `collectProjectEntries` returns, so transform order cannot change it:
 * a stylesheet transformed before a lazily loaded chunk's entry was registered still carries
 * that entry. Over-covering is harmless, since an entry the build does not import only renames
 * the asset when it changes.
 *
 * Also returns the extracted CSS the digest was made from: the CSS spliced in later, as far as
 * transform order allows knowing it, whose layers a host source declares ahead of a kept import.
 */
export async function createBuildExtraction(context: PluginContext) {
  const projectDir = getProjectDir(context)
  const { entries, styleCSSSources } = await collectProjectEntries(context)
  const { css } = await createExtractedCSSResult({
    ...getStylesheetSourceContext(context),
    styleCSSSources
  })
  const hash = createHash('sha256').update(css)
  // Paths relative to the project, so a checkout elsewhere (another CI runner) keeps the names.
  const root = normalizeFilePath(projectDir ?? process.cwd())
  for (const [key, entry] of entries) {
    const name = relative(root, key).replace(/\\/g, '/')
    hash.update('\0' + name + '\0' + (entry.styleSource?.source ?? '') + '\0' + (entry.error ?? ''))
  }
  // An identifier, so CSS minifiers keep it as is: a leading digit would read as a number.
  return { css, digest: 'h' + hash.digest('hex').slice(0, 16) }
}

/** The build digest alone; see `createBuildExtraction`. */
export async function createBuildDigest(context: PluginContext) {
  return (await createBuildExtraction(context)).digest
}
