import { extractClassCandidates } from '../extract-class-candidates'
import { extractOxcClasses, extractParsedOxcClasses } from './oxc'
import type { SourceAdapter, SourceAdapterInput } from './types'

const SCRIPT_BLOCK = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
const STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi

export const ASTRO_SOURCE_EXT = /\.astro(?:\?|$)/

function add(classes: Set<string>, classNames: string[]) {
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}

// Whitespace, and a BOM, the Astro compiler skips before the opening fence.
const LEADING_SPACE = /^[\uFEFF\s]*/
const FENCE_SPACE = /^[ \t]*/
// TypeScript's "A 'return' statement can only be used within a function body."
const RETURN_OUTSIDE_FUNCTION = 'TS(1108)'

/**
 * The index of the last character of the string, template literal or comment
 * that starts at `cursor`, or `cursor` when none does. A quoted string stops
 * before a line break, so the fence on the next line still closes the script.
 */
function skipLiteral(content: string, cursor: number) {
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
  if (char === '/' && content[end] === '/') {
    const lineEnd = content.indexOf('\n', end)
    return (lineEnd === -1 ? content.length : lineEnd) - 1
  }
  if (char === '/' && content[end] === '*') {
    const commentEnd = content.indexOf('*/', end + 1)
    return commentEnd === -1 ? content.length : commentEnd + 1
  }
  return cursor
}

/**
 * Splits a component into its frontmatter script and its markup as the Astro
 * compiler does: the opening fence may follow a BOM or blank lines, either
 * fence may carry trailing spaces, and the script closes at the first `---`
 * that starts a line outside a string, template literal or comment, which may
 * end the file or run into markup on the same line.
 */
function extractFrontmatter(content: string) {
  const none = { frontmatter: '', markup: content }
  const open = LEADING_SPACE.exec(content)![0].length
  if (!content.startsWith('---', open)) return none
  const start = open + 3 + FENCE_SPACE.exec(content.slice(open + 3))![0].length
  if (start < content.length && content[start] !== '\n' && !content.startsWith('\r\n', start)) return none
  for (let cursor = start; cursor < content.length; cursor++) {
    if (content[cursor] === '\n' && content.startsWith('---', cursor + 1)) {
      return {
        frontmatter: content.slice(start, cursor + 1),
        markup: content.slice(cursor + 4)
      }
    }
    cursor = skipLiteral(content, cursor)
  }
  return none
}

/**
 * Astro compiles the frontmatter into the body of an async render function,
 * so it may `await` at the top level and `return` early. oxc parses such a
 * `return` into the program and only reports where it stands.
 */
function extractFrontmatterClasses(source: string, frontmatter: string) {
  return extractParsedOxcClasses(`${source}.ts`, frontmatter, {
    sourceType: 'module',
    allowsError: error => error.labels.length === 1 &&
      !!error.codeframe?.includes(RETURN_OUTSIDE_FUNCTION) &&
      frontmatter.slice(error.labels[0]!.start, error.labels[0]!.end) === 'return'
  })
}

export function extractAstroClasses(source: string, content: string): string[] {
  const classes = new Set<string>()
  const { frontmatter, markup } = extractFrontmatter(content)

  if (frontmatter) {
    add(classes, extractFrontmatterClasses(source, frontmatter))
  }

  let template = markup
  template = template.replace(SCRIPT_BLOCK, (_, scriptContent: string) => {
    // Astro processes every `<script>` but `is:inline` ones as TypeScript; an
    // inline script is plain JavaScript, which parses as TypeScript as well.
    add(classes, extractOxcClasses(`${source}.ts`, scriptContent))
    return ''
  })
  template = template.replace(STYLE_BLOCK, '')
  add(classes, extractClassCandidates(template))

  return [...classes]
}

export function astroAdapter(): SourceAdapter {
  return {
    name: 'astro',
    test: ASTRO_SOURCE_EXT,
    async extract({ source, content }: SourceAdapterInput) {
      return extractAstroClasses(source, content)
    }
  }
}
