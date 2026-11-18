/** Style languages whose blocks hold StetCSS directives. */
export const CSS_STYLE_LANGUAGE_IDS: ReadonlySet<string> = new Set(['css', 'scss', 'less'])

/** Single-file component languages whose `<style>` blocks `collectSFCStyleBlocks` reads. */
export const SFC_LANGUAGE_IDS: ReadonlySet<string> = new Set(['vue', 'svelte', 'astro'])

// quoted attribute values may contain `>`, so they are matched whole
const STYLE_BLOCK_RE = /<style\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/style>/gi

export interface SFCStyleBlock {
  /** The text between the opening and closing `<style>` tags. */
  content: string
  /** Offset of `content` in the SFC source. */
  start: number
}

function getStyleLanguage(attributes: string) {
  const match = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(attributes)
  return (match?.[1] || match?.[2] || match?.[3] || 'css').toLowerCase()
}

/**
 * Collects the CSS-family (`lang` css, scss, or less; css when absent) `<style>` blocks of a Vue,
 * Svelte, or Astro source. A block's content starts right after its opening tag, so an
 * opening-tag attribute repeating the content never takes its place.
 * An opening tag with an unclosed quote (malformed HTML) is not reliably recognised.
 */
export function collectSFCStyleBlocks(source: string): SFCStyleBlock[] {
  const blocks: SFCStyleBlock[] = []
  for (const match of source.matchAll(STYLE_BLOCK_RE)) {
    const attributes = match[1]
    if (!CSS_STYLE_LANGUAGE_IDS.has(getStyleLanguage(attributes))) continue
    blocks.push({
      content: match[2],
      start: match.index + '<style'.length + attributes.length + '>'.length
    })
  }
  return blocks
}
