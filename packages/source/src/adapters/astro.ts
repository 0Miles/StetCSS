import { decodeStetCSSHTMLAttributeValue } from '@stet-css/lexer/character-reference'
import { extractClassCandidates } from '../extract-class-candidates'
import { extractOxcClasses, extractParsedOxcClasses } from './oxc'
import type { SourceAdapter, SourceAdapterInput } from './types'

const SCRIPT_BLOCK = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
const STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi
// A static `class` attribute: quoted, or unquoted up to the characters that end an unquoted value.
const STATIC_CLASS_ATTRIBUTE = /(?<=\s)class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`{]+))/g

export const ASTRO_SOURCE_EXT = /\.astro(?:\?|$)/

function add(classes: Set<string>, classNames: string[]) {
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}

// The whitespace the Astro compiler skips before the opening fence.
const LEADING_SPACE = /[ \t\r\n\f]*/y
// TypeScript's "A 'return' statement can only be used within a function body."
const RETURN_OUTSIDE_FUNCTION = 'TS(1108)'
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

/**
 * Splits a component into its frontmatter script and its markup as the Astro
 * compiler does: the opening fence may follow a BOM, whitespace and HTML
 * comments, and the script closes at the first `---` outside a string,
 * template literal, comment or regular expression, wherever it stands on its
 * line. Without a closing fence the rest of the file is the script.
 */
function extractFrontmatter(content: string) {
  const start = getFrontmatterStart(content)
  if (start === undefined) return { frontmatter: '', markup: content }
  let lineStart = start
  for (let cursor = start; cursor < content.length; cursor++) {
    if (content.startsWith('---', cursor)) {
      return {
        frontmatter: content.slice(start, cursor),
        markup: content.slice(cursor + 3)
      }
    }
    if (content[cursor] === '\n') lineStart = cursor + 1
    else cursor = skipLiteral(content, cursor, lineStart)
  }
  return { frontmatter: content.slice(start), markup: '' }
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

/**
 * The Astro compiler decodes the character references in a static attribute value as the browser
 * does, while the markup text extraction reads them as written. Adds the decoded value of every
 * static class attribute written with a reference.
 */
function addDecodedClassAttributes(classes: Set<string>, markup: string) {
  for (const match of markup.matchAll(STATIC_CLASS_ATTRIBUTE)) {
    const value = match[1] ?? match[2] ?? match[3]!
    if (value.includes('&')) add(classes, extractClassCandidates(decodeStetCSSHTMLAttributeValue(value).value))
  }
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
  addDecodedClassAttributes(classes, template)

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
