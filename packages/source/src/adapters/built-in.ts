import { extractClassCandidates } from '../extract-class-candidates'
import { astroAdapter } from './astro'
import { htmlAdapter } from './html'
import { oxcAdapter } from './oxc'
import { svelteAdapter } from './svelte'
import { matchesSourceAdapter, type SourceAdapter, type SourceAdapterInput } from './types'
import { vueAdapter } from './vue'

/** Format-aware adapters tried after any custom adapters, in this order. */
const builtInSourceAdapters: readonly SourceAdapter[] = [
  vueAdapter(),
  svelteAdapter(),
  astroAdapter(),
  htmlAdapter(),
  oxcAdapter()
]

/** The first custom adapter, then built-in adapter, that matches `source`. */
export function resolveSourceAdapter(source: string, adapters: readonly SourceAdapter[] = []) {
  return adapters.find((adapter) => matchesSourceAdapter(adapter, source))
    ?? builtInSourceAdapters.find((adapter) => matchesSourceAdapter(adapter, source))
}

/**
 * Extracts class candidates with the adapter matching `source`, falling back to plain
 * text extraction when no adapter matches.
 */
export async function extractSourceClassCandidates(input: SourceAdapterInput, adapters: readonly SourceAdapter[] = []) {
  const adapter = resolveSourceAdapter(input.source, adapters)
  return adapter
    ? adapter.extract(input)
    : extractClassCandidates(input.content)
}
