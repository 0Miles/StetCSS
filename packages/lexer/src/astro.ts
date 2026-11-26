/**
 * Where an Astro component's script is: its frontmatter, located as the Astro compiler does, and
 * the `<script>` and `<style>` elements of its markup, located as `@stet-css/source` reads them.
 * `@stet-css/source` splits a component with these for extraction, and `@stet-css/language` to
 * tell markup from script, so the build and the editor agree on where markup text is.
 */

import type { SourceRange } from './source'

// The whitespace the Astro compiler skips before the opening fence.
const LEADING_SPACE = /[ \t\r\n\f]*/y
// A `/` after one of these words starts a regular expression, not a division.
const REGEX_KEYWORD = /(?:^|[^\p{ID_Continue}$])(?:await|case|delete|do|else|in|instanceof|new|of|return|throw|typeof|void|yield)$/u
const VALUE_END = /[\p{ID_Continue}$)\]'"`]$/u

/**
 * The index right after the opening fence, or `undefined` when the component
 * has no frontmatter. Like the Astro compiler, the fence may follow a BOM,
 * whitespace and HTML comments, and opens on its first three dashes.
 */
function getFrontmatterStart(content: string) {
  let cursor = content.startsWith('\uFEFF') ? 1 : 0
  for (;;) {
    LEADING_SPACE.lastIndex = cursor
    cursor += LEADING_SPACE.exec(content)![0].length
    if (content.startsWith('---', cursor)) return cursor + 3
    if (!content.startsWith('<!--', cursor)) return
    const commentEnd = content.indexOf('-->', cursor + 4)
    if (commentEnd === -1) return
    cursor = commentEnd + 3
  }
}

/** Whether a `/` after `before`, the script on its line so far, starts a regular expression. */
function startsRegex(before: string) {
  const code = before.trimEnd()
  return !VALUE_END.test(code) || REGEX_KEYWORD.test(code)
}

/**
 * The index of the last character of the string, template literal, comment or
 * regular expression that starts at `cursor`, or `cursor` when none does. A
 * quoted string or a regular expression stops before a line break, as the
 * Astro compiler reads them.
 */
function skipLiteral(content: string, cursor: number, lineStart: number) {
  const char = content[cursor]
  let end = cursor + 1
  if (char === '\'' || char === '"') {
    while (end < content.length && content[end] !== char && content[end] !== '\n') {
      end += content[end] === '\\' ? 2 : 1
    }
    return content[end] === char ? end : end - 1
  }
  if (char === '`') {
    while (end < content.length && content[end] !== '`') end += content[end] === '\\' ? 2 : 1
    return end
  }
  if (char !== '/') return cursor
  if (content[end] === '/') {
    const lineEnd = content.indexOf('\n', end)
    return (lineEnd === -1 ? content.length : lineEnd) - 1
  }
  if (content[end] === '*') {
    const commentEnd = content.indexOf('*/', end + 1)
    return commentEnd === -1 ? content.length : commentEnd + 1
  }
  if (!startsRegex(content.slice(lineStart, cursor))) return cursor
  let inClass = false
  while (end < content.length && content[end] !== '\n') {
    const regexChar = content[end]
    if (regexChar === '\\') {
      end += 2
      continue
    }
    if (regexChar === '/' && !inClass) return end
    if (regexChar === '[') inClass = true
    else if (regexChar === ']') inClass = false
    end++
  }
  return end - 1
}

export interface StetCSSAstroFrontmatter {
  /** Where the script starts, right after the opening fence. */
  start: number
  /** Where the script ends: at the closing fence, or at the end of a file without one. */
  end: number
  /** Where the markup starts: after the closing fence, or at the end of a file without one. */
  markupStart: number
}

/**
 * The frontmatter of an Astro component, or `undefined` when it has none. As in the Astro
 * compiler, the opening fence may follow a BOM, whitespace and HTML comments, and the script
 * closes at the first `---` outside a string, template literal, comment or regular expression,
 * wherever it stands on its line. Without a closing fence the rest of the file is the script.
 */
export function getStetCSSAstroFrontmatter(content: string): StetCSSAstroFrontmatter | undefined {
  const start = getFrontmatterStart(content)
  if (start === undefined) return
  let lineStart = start
  for (let cursor = start; cursor < content.length; cursor++) {
    if (content.startsWith('---', cursor)) return { start, end: cursor, markupStart: cursor + 3 }
    if (content[cursor] === '\n') lineStart = cursor + 1
    else cursor = skipLiteral(content, cursor, lineStart)
  }
  return { start, end: content.length, markupStart: content.length }
}

// A closed element, its start tag up to the first `>` and its content up to the first closing tag.
const SCRIPT_ELEMENT = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
const STYLE_ELEMENT = /<style\b[^>]*>[\s\S]*?<\/style>/gi

export interface StetCSSAstroMarkupElements {
  /** The content of each `<script>` element, in order: script, not markup. */
  scripts: SourceRange[]
  /**
   * Every `<script>` and `<style>` element, from its `<` to the end of its closing tag, sorted and
   * not overlapping: the markup text is what lies between them.
   */
  elements: SourceRange[]
}

/**
 * The `<script>` and `<style>` elements of Astro markup (the component after its frontmatter).
 * Like the build, each is found by a pattern on the raw text, not by the HTML tokenizer: an
 * element needs its closing tag, may open inside an HTML comment or an attribute value, and its
 * start tag ends at the first `>`. Scripts are taken out first, so a `<style>` is found in the
 * text without them.
 */
export function getStetCSSAstroMarkupElements(markup: string): StetCSSAstroMarkupElements {
  const scripts: SourceRange[] = []
  const scriptElements: SourceRange[] = []
  // The markup without its scripts, and where each of its pieces starts in `markup`.
  const pieces: { start: number, origin: number }[] = []
  let withoutScripts = ''
  let cursor = 0
  for (const match of markup.matchAll(SCRIPT_ELEMENT)) {
    const start = match.index
    const end = start + match[0].length
    const contentEnd = end - '</script>'.length
    scripts.push({ start: contentEnd - match[1].length, end: contentEnd })
    scriptElements.push({ start, end })
    pieces.push({ start: withoutScripts.length, origin: cursor })
    withoutScripts += markup.slice(cursor, start)
    cursor = end
  }
  pieces.push({ start: withoutScripts.length, origin: cursor })
  withoutScripts += markup.slice(cursor)

  let piece = 0
  const toMarkup = (index: number) => {
    while (piece + 1 < pieces.length && pieces[piece + 1].start <= index) piece++
    return pieces[piece].origin + index - pieces[piece].start
  }
  const styleElements = [...withoutScripts.matchAll(STYLE_ELEMENT)].map((match) => ({
    start: toMarkup(match.index),
    end: toMarkup(match.index + match[0].length - 1) + 1
  }))
  // A script inside a style element is part of it.
  const elements: SourceRange[] = []
  for (const element of [...scriptElements, ...styleElements].sort((a, b) => a.start - b.start)) {
    if (element.end > (elements.at(-1)?.end ?? -1)) elements.push(element)
  }
  return { scripts, elements }
}
