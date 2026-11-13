import { readFileSync, statSync } from 'node:fs'

const MiB = 1024 * 1024
/** The largest stylesheet an import graph reads. */
const MAX_CSS_FILE_BYTES = 16 * MiB

/** Reads a stylesheet the import graph inlines. Devices and FIFOs would read or block forever. */
function readCSSFile(file: string) {
  const stats = statSync(file)
  if (!stats.isFile()) throw new Error(`CSS file is not a regular file: ${file}`)
  if (stats.size > MAX_CSS_FILE_BYTES) throw new Error(`CSS file is larger than ${MAX_CSS_FILE_BYTES / MiB} MiB: ${file}`)
  return readFileSync(file, 'utf-8')
}

/**
 * The most stylesheets one import graph inlines. Every `@import` inlines its file again, so a few
 * files that each import the next one twice would otherwise grow exponentially.
 */
const MAX_CSS_IMPORT_INCLUSIONS = 10_000
/** The most source one import graph inlines, counting every inclusion; it bounds the output. */
const MAX_CSS_IMPORT_GRAPH_BYTES = 64 * MiB

/**
 * Creates the reader one CSS import graph inlines every stylesheet through, so every `@import`
 * expansion applies the same file checks and limits. Pass `source` when the caller already holds
 * the text; it still counts toward the graph's limits. Each file is read from disk once per graph.
 */
export function createCSSImportGraphReader() {
  const sources = new Map<string, string>()
  let inclusions = 0
  let bytes = 0
  return (file: string, source?: string) => {
    inclusions++
    if (inclusions > MAX_CSS_IMPORT_INCLUSIONS) {
      throw new Error(`CSS imports inline more than ${MAX_CSS_IMPORT_INCLUSIONS} stylesheets, counting repeated imports of the same file: ${file}`)
    }
    let text = source ?? sources.get(file)
    if (text === undefined) {
      text = readCSSFile(file)
      sources.set(file, text)
    }
    bytes += Buffer.byteLength(text)
    if (bytes > MAX_CSS_IMPORT_GRAPH_BYTES) {
      throw new Error(`CSS imports inline more than ${MAX_CSS_IMPORT_GRAPH_BYTES / MiB} MiB: ${file}`)
    }
    return text
  }
}

export type CSSImportGraphReader = ReturnType<typeof createCSSImportGraphReader>
