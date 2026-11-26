import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Position } from 'vscode-languageserver-protocol'
import findMatchingPairs from './find-matching-brackets'
import escapeRegexp from 'lodash.escaperegexp'
import { visitorKeys } from 'oxc-parser'
import {
  collectCSSDirectiveRanges,
  getStetCSSTemplateExpressionNeighbours,
  getStetCSSWholeClassRange,
  parseStetCSSClassList,
  type StetCSSCharacterReferenceDecoder,
  type StetCSSExpressionNeighbours,
  type StetCSSScriptStringQuote
} from '@stet-css/lexer'
import { getStetCSSAstroFrontmatter, getStetCSSAstroMarkupElements } from '@stet-css/lexer/astro'
import { decodeStetCSSHTMLAttributeValue, decodeStetCSSJSXAttributeString } from '@stet-css/lexer/character-reference'
import { parseOxcOnSourceStack } from './oxc-stack'

export interface ClassPosition {
  range: { start: number, end: number }
  contextRange: { start: number, end: number }
  raw: string
  token: string
  /**
   * Set when the context is the body of a JavaScript string literal or template quoted by this
   * character, where escapes and line continuations are decoded. Markup attribute values, JSX
   * attribute strings and CSS directives leave it unset.
   */
  scriptString?: StetCSSScriptStringQuote
  /**
   * Set when the context sits in a markup attribute value whose character references the build
   * decodes: the decoder for the host's rules, as `parseStetCSSClassList` takes it. `class`
   * attributes in the markup of HTML, Vue, Svelte and Astro files, JSX attribute strings that oxc
   * reads, and the strings of a Vue `:class` binding (with `scriptString`) set it; everything the
   * build reads as written (other files and attributes, scripts, frontmatter) leaves it unset.
   */
  characterReferences?: StetCSSCharacterReferenceDecoder
  /**
   * Set when the class touches a runtime expression with no whitespace between, as `-50` does in
   * Svelte's `bg:{color}-50` or `x` in `` `x${on ? 'a' : ''}` ``: it is part of a class that only
   * exists at runtime. Its context holds the fragment alone, so editing the whole classes beside
   * it never moves it; lint neither reports nor fixes it.
   */
  fragment?: true
}

export interface ClassPositionSettings {
  classAttributes?: string[]
  classFunctions?: string[]
  classDeclarations?: string[]
  classAttributeBindings?: Record<string, [string, string] | false>
  /**
   * Object keys whose values hold no classes, such as cva's `compoundVariants` and
   * `defaultVariants`: no class position is read anywhere inside them. Patterns, like
   * `classFunctions`.
   */
  ignoredKeys?: string[]
}

export interface GetClassPositionsOptions {
  position?: Position
  lookaroundLines?: number
  includeEmpty?: boolean
  provider?: ClassPositionProvider
  oxcMode?: OxcClassPositionMode
  positionMatch?: 'token' | 'context'
  cache?: ClassPositionCache
}

type ClassMatcher = [string, string, string?]
type ClassPositionProvider = 'all' | 'regex' | 'oxc'
type OxcClassPositionMode = 'auto' | 'cache-only' | false
type ClassPositionAccept = (start: number, end: number, contextRange: SourceRange) => boolean

interface CachedOxcClassPositions {
  version: number
  languageId: string
  parseFailed: boolean
  positions: ClassPosition[]
}

interface OxcClassPositionsResult {
  authoritative: boolean
  positions: ClassPosition[]
}

interface SourceRange {
  start: number
  end: number
}

interface OxcNode {
  type: string
  start?: number
  end?: number
  range?: [number, number]
  value?: unknown
  raw?: string
  name?: unknown
  key?: unknown
  id?: unknown
  left?: unknown
  right?: unknown
  init?: unknown
  callee?: unknown
  tag?: unknown
  quasi?: unknown
  arguments?: unknown[]
  expressions?: unknown[]
  quasis?: OxcTemplateElement[]
  [key: string]: unknown
}

interface OxcTemplateElement extends OxcNode {
  value?: {
    raw?: string
    cooked?: string | null
  }
  tail?: boolean
}

const JS_LANGUAGE_IDS = new Set([
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact'
])

/**
 * Files whose `class` attributes the build reads with character references decoded by HTML's
 * rules: the extensions `@stet-css/source`'s HTML, Vue, Svelte and Astro adapters match, which
 * this package does not import. The build extracts other files (PHP, Pug, Markdown, MDX, unknown
 * extensions) as plain text, as written, whatever language the editor or lint reads them as.
 */
const HTML_ATTRIBUTE_SOURCE_EXT = /\.(?:html?|vue|svelte|astro)$/
const VUE_SOURCE_EXT = /\.vue$/
const ASTRO_SOURCE_EXT = /\.astro$/

/** The bindings the build reads decoded: Vue compiles `:class` from the decoded attribute. */
const DECODED_CLASS_BINDINGS = new Set([':class', 'v-bind:class'])

/**
 * The rest of a tag after its name, through its `>`, as the HTML tokenizer reads it: attributes
 * need no whitespace between them, a name runs to whitespace, `/`, `>` or `=` (quotes included),
 * a quoted value to its closing quote and an unquoted one to whitespace or `>`. Whitespace is
 * HTML's: tab, line feed, form feed, carriage return and space. A tag left open runs to the end
 * of the file, as in the tokenizer, so no `<` is scanned twice.
 */
const TAG_REST = String.raw`(?:[\t\n\f\r /]+|[^\t\n\f\r />][^\t\n\f\r />=]*(?:[\t\n\f\r ]*=[\t\n\f\r ]*(?:"[^"]*"?|'[^']*'?|[^\t\n\f\r >]*))?)*(?:>|$)`

/**
 * What the HTML tokenizer reads before it reaches markup text in HTML, Vue and Svelte files:
 * comments, `<script>` and `<style>` elements (whose content the build reads as JavaScript or not
 * at all), and other tags with their attribute values. Scanned left to right, so a `<style>`
 * inside a comment or an attribute value opens nothing. Astro's build finds its elements by
 * pattern instead (`getStetCSSAstroMarkupElements`). Other tags capture their `/`, name and rest
 * so Vue's root `<template>` can be told apart.
 */
const MARKUP_TOKEN = new RegExp(String.raw`<!--[\s\S]*?(?:-->|$)|<(script|style)(?=[\t\n\f\r />]|$)(${TAG_REST})[\s\S]*?(?:<\/\1(?=[\t\n\f\r />]|$)${TAG_REST}|$)|<(\/?)([A-Za-z][^\t\n\f\r />]*)(${TAG_REST})`, 'gi')

/** One attribute of a tag's rest (`TAG_REST`): its name and its value as written, quotes included. */
const TAG_ATTRIBUTE = /([^\t\n\f\r />][^\t\n\f\r />=]*)(?:[\t\n\f\r ]*=[\t\n\f\r ]*("[^"]*"?|'[^']*'?|[^\t\n\f\r >]*))?/g

/** Where Vue's SFC tokenizer ends a root `<template>` it reads as raw text. */
const VUE_TEMPLATE_END = /<\/template(?=[\t\n\f\r />]|$)/gi

/**
 * Whether Vue reads a root `<template>` with this start tag rest as raw text, as its SFC
 * tokenizer does when a `lang` attribute (case-sensitive) holds a language other than `html`
 * (`lang="pug"`). The build then reads the template as written.
 */
function isRawVueTemplate(tagRest: string) {
  return [...tagRest.matchAll(TAG_ATTRIBUTE)].some(([, name, value]) => {
    const lang = value?.replace(/^(["'])([\s\S]*?)\1?$/, '$2')
    return name === 'lang' && !!lang && lang !== 'html'
  })
}

const OXC_CACHE_LIMIT = 20

const OXC_SOURCE_BY_LANGUAGE_ID: Record<string, string> = {
  javascript: 'document.js',
  typescript: 'document.ts',
  javascriptreact: 'document.jsx',
  typescriptreact: 'document.tsx'
}

const HTML_COMMENT_LANGUAGE_IDS = new Set([
  'html',
  'angular-html',
  'vue',
  'svelte',
  'astro',
  'markdown',
  'mdx'
])

const BLOCK_COMMENT_LANGUAGE_IDS = new Set([
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'css',
  'scss',
  'less',
  'vue',
  'svelte',
  'astro'
])

const LINE_COMMENT_LANGUAGE_IDS = new Set([
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'scss',
  'less',
  'vue',
  'svelte',
  'astro'
])

export class ClassPositionCache {
  private oxc = new Map<string, CachedOxcClassPositions>()

  getOxc(textDocument: TextDocument): CachedOxcClassPositions | undefined {
    const key = getOxcCacheKey(textDocument)
    const cached = this.oxc.get(key)
    if (!cached || cached.version !== textDocument.version || cached.languageId !== textDocument.languageId) {
      if (cached) this.oxc.delete(key)
      return
    }
    this.oxc.delete(key)
    this.oxc.set(key, cached)
    return cached
  }

  setOxc(textDocument: TextDocument, cached: CachedOxcClassPositions) {
    const key = getOxcCacheKey(textDocument)
    this.oxc.set(key, cached)
    while (this.oxc.size > OXC_CACHE_LIMIT) {
      const oldestKey = this.oxc.keys().next().value
      if (oldestKey === undefined) break
      this.oxc.delete(oldestKey)
    }
  }
}

function getOxcCacheKey(textDocument: TextDocument) {
  return `${textDocument.languageId}:${textDocument.uri}`
}

function isJavaScriptDocument(textDocument: TextDocument) {
  return JS_LANGUAGE_IDS.has(textDocument.languageId)
}

function getDocumentPath(textDocument: TextDocument) {
  return textDocument.uri.split(/[?#]/)[0]
}

function collectNonMarkupRanges(source: string, astro: boolean, vue: boolean) {
  const ranges: SourceRange[] = []
  if (astro) {
    // Astro's frontmatter and what precedes it, and its script and style elements, located with
    // the build's own scans.
    const markupStart = getStetCSSAstroFrontmatter(source)?.markupStart ?? 0
    if (markupStart) ranges.push({ start: 0, end: markupStart })
    for (const { start, end } of getStetCSSAstroMarkupElements(source.slice(markupStart)).elements) {
      ranges.push({ start: markupStart + start, end: markupStart + end })
    }
    return ranges
  }
  const token = new RegExp(MARKUP_TOKEN.source, MARKUP_TOKEN.flags)
  // How many Vue `<template>` elements are open: at 0, a `<template>` is the SFC's root one.
  let templateDepth = 0
  for (let match = token.exec(source); match; match = token.exec(source)) {
    const [element, name, startTagRest, closing, tagName, tagRest] = match
    if (name) {
      // The element's content, after its start tag.
      ranges.push({ start: match.index + 1 + name.length + startTagRest.length, end: match.index + element.length })
      continue
    }
    if (!vue || tagName !== 'template') continue
    if (closing) {
      templateDepth = Math.max(0, templateDepth - 1)
    } else if (templateDepth === 0 && isRawVueTemplate(tagRest)) {
      // Raw text up to the first `</template`, which the scan then reads as the closing tag.
      VUE_TEMPLATE_END.lastIndex = token.lastIndex
      const end = VUE_TEMPLATE_END.exec(source)?.index ?? source.length
      ranges.push({ start: token.lastIndex, end })
      token.lastIndex = end
      templateDepth++
    } else if (!tagRest.endsWith('/>')) {
      templateDepth++
    }
  }
  return ranges
}

/** How a context's source spelling decodes into its classes; `ClassPosition` carries the same fields. */
type ClassListDecoding = Pick<ClassPosition, 'scriptString' | 'characterReferences'>

/** `decoding` without its unset fields, so positions only carry the ones that apply. */
function compactDecoding({ scriptString, characterReferences }: ClassListDecoding): ClassListDecoding {
  return {
    ...(scriptString ? { scriptString } : {}),
    ...(characterReferences ? { characterReferences } : {})
  }
}

function isOxcNode(value: unknown): value is OxcNode {
  return !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string'
}

function getNodeRange(node: OxcNode): [number, number] | undefined {
  if (Array.isArray(node.range) && node.range.length === 2) return node.range
  if (typeof node.start === 'number' && typeof node.end === 'number') return [node.start, node.end]
}

function getIdentifierName(node: unknown): string | undefined {
  if (!isOxcNode(node)) return
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    return typeof node.name === 'string' ? node.name : undefined
  }
  if (node.type === 'Literal') {
    return typeof node.value === 'string' ? node.value : undefined
  }
}

function getJSXAttributeName(node: unknown): string | undefined {
  if (!isOxcNode(node)) return
  const directName = getIdentifierName(node)
  if (directName) return directName
  if (node.type === 'JSXNamespacedName') {
    const namespace = getJSXAttributeName(node.namespace)
    const name = getJSXAttributeName(node.name)
    if (namespace && name) return `${namespace}:${name}`
  }
  if (node.type === 'JSXMemberExpression') {
    const object = getJSXAttributeName(node.object)
    const property = getJSXAttributeName(node.property)
    if (object && property) return `${object}.${property}`
  }
}

function createExactMatchers(patterns: string[] | undefined) {
  return (patterns ?? []).flatMap((pattern) => {
    try {
      return [new RegExp(`^(?:${pattern})$`)]
    } catch {
      return []
    }
  })
}

/** `key`, `'key'` and `['key']` name a property statically; `[key]` reads a variable. */
function getStaticPropertyKey(node: OxcNode) {
  const key = node.key
  if (!isOxcNode(key)) return
  if (key.type === 'Identifier') return !node.computed && typeof key.name === 'string' ? key.name : undefined
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value
}

function createIgnoredKeyValuePattern(ignoredKeys: string[] | undefined) {
  if (!ignoredKeys?.length) return
  try {
    const keys = `(?:${ignoredKeys.join('|')})`
    return new RegExp(`(?:^|[\\s{,(])(?:(['"]?)${keys}\\1|\\[\\s*(['"])${keys}\\2\\s*\\])\\s*:\\s*`, 'g')
  } catch {
    return
  }
}

const VALUE_CLOSERS: Record<string, string> = { '{': '}', '[': ']', '"': '"', '\'': '\'', '`': '`' }

/** Ranges of `expression` holding an ignored key and its value, for the regex scan. */
function collectIgnoredKeyValueRanges(expression: string, pattern: RegExp | undefined) {
  const ranges: SourceRange[] = []
  if (!pattern) return ranges
  for (const match of expression.matchAll(pattern)) {
    if (match.index === undefined) continue
    const valueStart = match.index + match[0].length
    const opener = expression[valueStart]
    const closer = VALUE_CLOSERS[opener]
    if (!closer) continue
    const valueEnd = findMatchingPairs(expression, valueStart + 1, opener, closer)
    if (valueEnd === undefined) continue
    // From the key on: a quoted key is a string the scan would read too.
    ranges.push({ start: match.index, end: valueEnd + 1 })
  }
  return ranges
}

function matchesAny(source: string | undefined, matchers: RegExp[]) {
  if (!source) return false
  const trimmedSource = source.trim()
  return matchers.some((matcher) => matcher.test(trimmedSource))
}

/**
 * The static names a callee ends with: `document.body.classList?.add` gives
 * `['document', 'body', 'classList', 'add']` and `getElement().classList.add` gives
 * `['classList', 'add']`. Keep in step with `getCalleeNames` in @stet-css/eslint-plugin's
 * define-visitors.ts.
 */
function getCalleeNames(node: unknown): string[] {
  if (!isOxcNode(node)) return []
  if (node.type === 'TSNonNullExpression') return getCalleeNames(node.expression)
  if (node.type === 'Identifier') return typeof node.name === 'string' ? [node.name] : []
  if (node.type !== 'MemberExpression') return []
  const property = node.property
  if (!isOxcNode(property)) return []
  const name = node.computed
    ? property.type === 'Literal' && typeof property.value === 'string' ? property.value : undefined
    : property.type === 'Identifier' && typeof property.name === 'string' ? property.name : undefined
  return name === undefined ? [] : [...getCalleeNames(node.object), name]
}

/**
 * A callee is a class function when a dotted suffix of its names matches, as the regex scan's
 * `(?:\s|\.)` boundary does: `element.classList.add` matches `classList.add` and `utils.clsx`
 * matches `clsx`.
 */
function matchesCallee(callee: unknown, matchers: RegExp[]) {
  const names = getCalleeNames(callee)
  return names.some((_, index) => matchesAny(names.slice(index).join('.'), matchers))
}

function collectClassPositions(
  className: string,
  classNameStart: number,
  escapeCharacter: string,
  includeEmpty: boolean,
  accept?: ClassPositionAccept,
  contextRange: SourceRange = {
    start: classNameStart,
    end: classNameStart + className.length
  },
  decoding: ClassListDecoding = {}
) {
  const classPositions: ClassPosition[] = []
  // Script strings keep their quote unescaping here; lint decodes them by `scriptString`.
  for (const item of parseStetCSSClassList(className, {
    includeEmpty,
    unescape: escapeCharacter || false,
    characterReferences: decoding.characterReferences
  })) {
    if (item.type !== 'class') continue
    if (!item.raw && !includeEmpty) continue
    const classStartIndex = classNameStart + item.start
    const classEndIndex = classNameStart + item.end
    if (accept && !accept(classStartIndex, classEndIndex, contextRange)) continue
    if (!item.raw && classStartIndex !== classEndIndex) continue
    classPositions.push({
      range: { start: classStartIndex, end: classEndIndex },
      contextRange,
      raw: item.raw,
      token: item.token,
      ...compactDecoding(decoding)
    })
  }
  return classPositions
}

/**
 * Class positions of `text`, a static part of a class list whose ends may touch runtime
 * expressions. Classes touching one are fragments, each its own context; the whole classes
 * between them share one context. Splits on ASCII whitespace, as the lexer does.
 */
function collectSegmentClassPositions(
  text: string,
  start: number,
  escapeCharacter: string,
  includeEmpty: boolean,
  accept: ClassPositionAccept | undefined,
  neighbours: StetCSSExpressionNeighbours = {},
  decoding: ClassListDecoding = {}
) {
  const [wholeStart, wholeEnd] = getStetCSSWholeClassRange(text, neighbours)
  const collect = (from: number, to: number, fragment: boolean) => {
    // An empty text still yields its empty class for completion; empty parts of a longer one do not.
    if (from === to && (fragment || text.length)) return []
    const positions = collectClassPositions(
      text.slice(from, to),
      start + from,
      escapeCharacter,
      includeEmpty,
      accept,
      { start: start + from, end: start + to },
      decoding
    )
    return fragment ? positions.map((position) => ({ ...position, fragment: true as const })) : positions
  }
  return [
    ...collect(0, wholeStart, true),
    ...collect(wholeStart, wholeEnd, false),
    ...collect(wholeEnd, text.length, true)
  ]
}

/**
 * `[start, end)` spans of runtime expressions in a class list: Svelte's `{…}` in markup or a
 * template literal's `${…}`. An unclosed span runs to the end.
 */
function collectExpressionSpans(text: string, opener: '{' | '${') {
  const spans: [number, number][] = []
  for (let index = 0; index < text.length; index++) {
    if (!text.startsWith(opener, index) || text[index - 1] === '\\') continue
    const end = findMatchingPairs(text, index + opener.length, '{', '}')
    spans.push([index, end === undefined ? text.length : end + 1])
    if (end === undefined) break
    index = end
  }
  return spans
}

/** Class positions of a class list whose expression spans are skipped; text beside a span is a fragment. */
function collectSpannedClassPositions(
  text: string,
  start: number,
  spans: [number, number][],
  escapeCharacter: string,
  includeEmpty: boolean,
  accept: ClassPositionAccept | undefined,
  decoding: ClassListDecoding = {}
) {
  if (!spans.length) {
    return collectClassPositions(text, start, escapeCharacter, includeEmpty, accept, undefined, decoding)
  }
  const classPositions: ClassPosition[] = []
  let segmentStart = 0
  for (const [spanStart, spanEnd] of [...spans, [text.length, text.length] as [number, number]]) {
    if (spanStart > segmentStart) {
      classPositions.push(...collectSegmentClassPositions(
        text.slice(segmentStart, spanStart),
        start + segmentStart,
        escapeCharacter,
        includeEmpty,
        accept,
        { before: segmentStart > 0, after: spanStart < text.length },
        decoding
      ))
    }
    segmentStart = spanEnd
  }
  return classPositions
}

function sortAndDeduplicate(classPositions: ClassPosition[]) {
  const seen = new Set<string>()
  return classPositions
    .sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end)
    .filter((classPosition) => {
      const id = `${classPosition.range.start}:${classPosition.range.end}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
}

function filterClassPositions(
  classPositions: ClassPosition[],
  includeEmpty: boolean,
  accept?: ClassPositionAccept
) {
  return classPositions.filter(({ range, contextRange, raw }) => {
    if (!raw && !includeEmpty) return false
    return !accept || accept(range.start, range.end, contextRange)
  })
}

function getOxcSource(textDocument: TextDocument) {
  const sourceByLanguageId = OXC_SOURCE_BY_LANGUAGE_ID[textDocument.languageId]
  if (sourceByLanguageId) return sourceByLanguageId
  return textDocument.uri.split(/[?#]/)[0] || 'document.js'
}

// JavaScript files commonly hold JSX, which OXC parses only in `jsx` mode, and
// that mode still accepts plain JavaScript. Mirrors `getParserLang` in
// `@stet-css/source`'s OXC adapter, which this package does not import.
const JSX_JAVASCRIPT_EXT = /\.[cm]?js$/

function getParserLang(filename: string) {
  return JSX_JAVASCRIPT_EXT.test(filename) ? 'jsx' as const : undefined
}

function hasClassPositionLookaround(text: string, settings: ClassPositionSettings) {
  for (const eachClassAttribute of settings.classAttributes ?? []) {
    if (new RegExp(`${escapeRegexp(eachClassAttribute)}\\s*=`).test(text)) return true
  }

  for (const eachClassAttribute in settings.classAttributeBindings ?? {}) {
    const eachClassAttributeBinding = settings.classAttributeBindings?.[eachClassAttribute]
    if (eachClassAttributeBinding === false) continue
    if (new RegExp(`${escapeRegexp(eachClassAttribute)}\\s*=`).test(text)) return true
  }

  for (const eachClassDeclaration of settings.classDeclarations ?? []) {
    try {
      if (new RegExp(`(?:^|[\\s{,])${eachClassDeclaration}\\s*(?::|=)`).test(text)) return true
    } catch {
      continue
    }
  }

  for (const eachClassFunction of settings.classFunctions ?? []) {
    try {
      if (new RegExp(`(?:^|[\\s.])${eachClassFunction}\\s*(?:\\(|\`)`).test(text)) return true
    } catch {
      continue
    }
  }

  return false
}

function collectDelimitedRanges(source: string, startDelimiter: string, endDelimiter: string) {
  const ranges: SourceRange[] = []
  let searchStart = 0
  while (searchStart < source.length) {
    const start = source.indexOf(startDelimiter, searchStart)
    if (start < 0) break
    const endIndex = source.indexOf(endDelimiter, start + startDelimiter.length)
    const end = endIndex < 0 ? source.length : endIndex + endDelimiter.length
    ranges.push({ start, end })
    searchStart = end
  }
  return ranges
}

function collectSlashCommentRanges(source: string, includeLineComments: boolean, includeBlockComments: boolean) {
  const ranges: SourceRange[] = []
  let quote: '"' | '\'' | '`' | undefined
  let escaped = false
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = undefined
      }
      continue
    }
    if (char === '"' || char === '\'' || char === '`') {
      quote = char
      continue
    }
    if (includeLineComments && char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', i + 2)
      const end = lineEnd < 0 ? source.length : lineEnd
      ranges.push({ start: i, end })
      i = end
      continue
    }
    if (includeBlockComments && char === '/' && next === '*') {
      const blockEnd = source.indexOf('*/', i + 2)
      const end = blockEnd < 0 ? source.length : blockEnd + 2
      ranges.push({ start: i, end })
      i = end - 1
    }
  }
  return ranges
}

function collectCommentRanges(source: string, languageId: string) {
  const ranges: SourceRange[] = []
  if (HTML_COMMENT_LANGUAGE_IDS.has(languageId)) {
    ranges.push(...collectDelimitedRanges(source, '<!--', '-->'))
  }
  const includeBlockComments = BLOCK_COMMENT_LANGUAGE_IDS.has(languageId)
  const includeLineComments = LINE_COMMENT_LANGUAGE_IDS.has(languageId)
  if (includeBlockComments || includeLineComments) {
    ranges.push(...collectSlashCommentRanges(source, includeLineComments, includeBlockComments))
  }
  return ranges.sort((a, b) => a.start - b.start || a.end - b.end)
}

function collectCSSDirectiveClassPositions(
  source: string,
  includeEmpty: boolean,
  accept?: ClassPositionAccept
) {
  const classPositions: ClassPosition[] = []
  for (const directive of collectCSSDirectiveRanges(source)) {
    if (directive.name !== 'compose') continue
    if (directive.blockRange || directive.quotedStringRanges.length) continue
    let start = directive.preludeRange.start
    let end = directive.preludeRange.end
    while (start < end && /\s/.test(source[start] || '')) start++
    while (end > start && /\s/.test(source[end - 1] || '')) end--
    const raw = source.slice(start, end)
    classPositions.push(...collectClassPositions(
      raw,
      start,
      '',
      includeEmpty,
      accept,
      { start, end }
    ))
  }
  return classPositions
}

function overlapsCommentRange(start: number, end: number, commentRanges: SourceRange[]) {
  const normalizedEnd = start === end ? end + 1 : end
  return commentRanges.some((range) => start < range.end && normalizedEnd > range.start)
}

function collectOxcStringLiteral(
  source: string,
  node: OxcNode,
  includeEmpty: boolean,
  accept?: ClassPositionAccept,
  jsxAttribute = false,
  neighbours?: StetCSSExpressionNeighbours
) {
  if (typeof node.value !== 'string') return []
  const range = getNodeRange(node)
  if (!range) return []
  const quote = source[range[0]]
  if (quote !== '"' && quote !== '\'') return []
  const classNameStart = range[0] + 1
  const classNameEnd = range[1] - 1
  if (classNameEnd < classNameStart) return []
  return collectSegmentClassPositions(
    source.slice(classNameStart, classNameEnd),
    classNameStart,
    quote,
    includeEmpty,
    accept,
    neighbours,
    // JSX attribute strings hold character references, not JavaScript escapes.
    jsxAttribute ? { characterReferences: decodeStetCSSJSXAttributeString } : { scriptString: quote }
  )
}

function collectOxcTemplateLiteral(
  source: string,
  node: OxcNode,
  includeEmpty: boolean,
  accept?: ClassPositionAccept,
  neighbours: StetCSSExpressionNeighbours = {}
) {
  const classPositions: ClassPosition[] = []
  const quasis = node.quasis ?? []
  quasis.forEach((eachQuasi, index) => {
    const range = getNodeRange(eachQuasi)
    const raw = eachQuasi.value?.raw
    if (!range || raw === undefined) return
    const classNameStart = range[0] + 1
    classPositions.push(...collectSegmentClassPositions(
      source.slice(classNameStart, classNameStart + raw.length),
      classNameStart,
      '`',
      includeEmpty,
      accept,
      {
        before: index > 0 || neighbours.before,
        after: index < quasis.length - 1 || neighbours.after
      },
      { scriptString: '`' }
    ))
  })
  return classPositions
}

function collectOxcClassStrings(
  source: string,
  node: unknown,
  includeEmpty: boolean,
  accept?: ClassPositionAccept,
  ignoredKeyMatchers: RegExp[] = []
) {
  const classPositions: ClassPosition[] = []
  /**
   * `neighbours` says which ends of the node's string value touch template text, as in
   * `` `x${on ? 'a b' : ''}` ``. Only branches that yield the string itself carry them; anything
   * else in such a place is skipped.
   */
  const visit = (eachNode: unknown, neighbours?: StetCSSExpressionNeighbours) => {
    if (!isOxcNode(eachNode)) return
    if (eachNode.type === 'Property' && matchesAny(getStaticPropertyKey(eachNode), ignoredKeyMatchers)) return
    if (eachNode.type === 'Literal') {
      classPositions.push(...collectOxcStringLiteral(source, eachNode, includeEmpty, accept, false, neighbours))
      return
    }
    if (eachNode.type === 'TemplateLiteral') {
      classPositions.push(...collectOxcTemplateLiteral(source, eachNode, includeEmpty, accept, neighbours))
      const expressionNeighbours = getStetCSSTemplateExpressionNeighbours(
        (eachNode.quasis ?? []).map((quasi) => quasi.value?.cooked),
        neighbours
      )
      eachNode.expressions?.forEach((expression, index) => visit(expression, expressionNeighbours[index]))
      return
    }
    if (neighbours?.before || neighbours?.after) {
      if (eachNode.type === 'ConditionalExpression') {
        visit(eachNode.consequent, neighbours)
        visit(eachNode.alternate, neighbours)
      } else if (eachNode.type === 'LogicalExpression') {
        visit(eachNode.right, neighbours)
      } else if (eachNode.type === 'ParenthesizedExpression') {
        visit(eachNode.expression, neighbours)
      }
      return
    }
    const keys = visitorKeys[eachNode.type] || []
    for (const key of keys) {
      const value = eachNode[key]
      if (Array.isArray(value)) {
        for (const child of value) visit(child)
      } else {
        visit(value)
      }
    }
  }
  visit(node)
  return classPositions
}

function createOxcClassPositions(
  textDocument: TextDocument,
  settings: ClassPositionSettings
): CachedOxcClassPositions {
  const source = textDocument.getText()
  const failedResult: CachedOxcClassPositions = {
    version: textDocument.version,
    languageId: textDocument.languageId,
    parseFailed: true,
    positions: []
  }
  const filename = getOxcSource(textDocument)
  const lang = getParserLang(filename)
  const program = parseOxcOnSourceStack(filename, source, {
    range: true,
    sourceType: 'unambiguous',
    ...lang && { lang }
  })
  if (!program) return failedResult

  const classPositions: ClassPosition[] = []
  const classAttributes = new Set(settings.classAttributes ?? [])
  const classAttributeBindings = new Set(Object
    .entries(settings.classAttributeBindings ?? {})
    .filter(([, value]) => value !== false)
    .map(([key]) => key))
  const classFunctionMatchers = createExactMatchers(settings.classFunctions)
  const classDeclarationMatchers = createExactMatchers(settings.classDeclarations)
  const ignoredKeyMatchers = createExactMatchers(settings.ignoredKeys)

  const collect = (node: unknown) => {
    classPositions.push(...collectOxcClassStrings(source, node, true, undefined, ignoredKeyMatchers))
  }

  const visit = (node: unknown) => {
    if (!isOxcNode(node)) return

    if (node.type === 'JSXAttribute') {
      const attributeName = getJSXAttributeName(node.name)
      const attributeValue = node.value
      if (attributeName && classAttributes.has(attributeName) && isOxcNode(attributeValue) && attributeValue.type === 'Literal') {
        classPositions.push(...collectOxcStringLiteral(source, attributeValue, true, undefined, true))
      }
      if (attributeName && classAttributeBindings.has(attributeName) && isOxcNode(attributeValue) && attributeValue.type === 'JSXExpressionContainer') {
        collect(attributeValue.expression)
      }
    } else if (node.type === 'CallExpression') {
      if (matchesCallee(node.callee, classFunctionMatchers)) {
        for (const eachArgument of node.arguments ?? []) {
          collect(eachArgument)
        }
      }
    } else if (node.type === 'TaggedTemplateExpression') {
      if (matchesCallee(node.tag, classFunctionMatchers)) {
        collect(node.quasi)
      }
    } else if (node.type === 'VariableDeclarator') {
      if (matchesAny(getIdentifierName(node.id), classDeclarationMatchers)) {
        collect(node.init)
      }
    } else if (node.type === 'AssignmentExpression') {
      if (matchesAny(getIdentifierName(node.left), classDeclarationMatchers)) {
        collect(node.right)
      }
    } else if (node.type === 'Property') {
      if (matchesAny(getIdentifierName(node.key), classDeclarationMatchers)) {
        collect(node.value)
      }
    }

    const keys = visitorKeys[node.type] || []
    for (const key of keys) {
      const value = node[key]
      if (Array.isArray(value)) {
        for (const child of value) visit(child)
      } else {
        visit(value)
      }
    }
  }

  try {
    visit(program)
  } catch (error) {
    // A tree nested deeper than the JS stack can walk: fall back to the regex scan.
    if (error instanceof RangeError && error.message.includes('call stack')) return failedResult
    throw error
  }
  return { ...failedResult, parseFailed: false, positions: sortAndDeduplicate(classPositions) }
}

function getOxcClassPositions(
  textDocument: TextDocument,
  settings: ClassPositionSettings,
  options: GetClassPositionsOptions,
  lookaroundText: string,
  accept?: ClassPositionAccept
): OxcClassPositionsResult {
  if (!isJavaScriptDocument(textDocument) || options.oxcMode === false) {
    return { authoritative: false, positions: [] }
  }
  if (options.position && !hasClassPositionLookaround(lookaroundText, settings)) {
    return { authoritative: false, positions: [] }
  }

  const cached = options.cache?.getOxc(textDocument)
  if (cached) {
    return cached.parseFailed
      ? { authoritative: false, positions: [] }
      : { authoritative: true, positions: filterClassPositions(cached.positions, options.includeEmpty ?? false, accept) }
  }
  if (options.oxcMode === 'cache-only') {
    return { authoritative: false, positions: [] }
  }

  const created = createOxcClassPositions(textDocument, settings)
  options.cache?.setOxc(textDocument, created)
  return created.parseFailed
    ? { authoritative: false, positions: [] }
    : { authoritative: true, positions: filterClassPositions(created.positions, options.includeEmpty ?? false, accept) }
}

export default function getClassPositions(
  textDocument: TextDocument,
  settings: ClassPositionSettings,
  options: GetClassPositionsOptions = {}
): ClassPosition[] {
  const sourceText = textDocument.getText()
  const includeEmpty = options.includeEmpty ?? false
  const provider = options.provider ?? 'all'
  const onlyOxc = provider === 'oxc'
  const positionIndex = options.position && textDocument.offsetAt(options.position)
  const positionMatch = options.positionMatch ?? 'token'
  const lookaroundLines = options.lookaroundLines ?? 100
  const startIndex = options.position
    ? textDocument.offsetAt({ line: options.position.line - lookaroundLines, character: 0 })
    : 0
  const endIndex = options.position
    ? textDocument.offsetAt({ line: options.position.line + lookaroundLines, character: 0 })
    : undefined
  const text = sourceText.substring(startIndex, endIndex)
  let commentRanges: SourceRange[] | undefined
  const classPositions: ClassPosition[] = []
  const { classAttributeBindings, classAttributes, classDeclarations, classFunctions } = settings
  const acceptsPosition = (start: number, end: number) => {
    if (positionIndex === undefined) return true
    return start <= positionIndex && positionIndex <= end
  }
  const acceptsClassRange: ClassPositionAccept = (start, end, contextRange) => {
    const acceptedRange = positionMatch === 'context' ? contextRange : { start, end }
    if (!acceptsPosition(acceptedRange.start, acceptedRange.end)) return false
    commentRanges ??= collectCommentRanges(sourceText, textDocument.languageId)
    return !overlapsCommentRange(start, end, commentRanges)
  }

  classPositions.push(...collectCSSDirectiveClassPositions(sourceText, includeEmpty, acceptsClassRange))

  if (provider !== 'regex') {
    const oxcClassPositions = getOxcClassPositions(textDocument, settings, options, text, acceptsClassRange)
    if (onlyOxc || oxcClassPositions.authoritative) {
      return sortAndDeduplicate(oxcClassPositions.positions)
    }
  }

  if (onlyOxc) return []

  const resolve = (
    classMatchers: ClassMatcher[],
    handle: (eachAttrStart: number, eachClassPositionEnd: number, eachClassMatcher: ClassMatcher) => void
  ) => {
    for (const eachClassMatcher of classMatchers) {
      let [eachPattern, start, end] = eachClassMatcher
      end = end ?? start
      for (const eachClassPositionMatch of text.matchAll(new RegExp(`(?:\\s|\\.)${eachPattern}${escapeRegexp(start)}`, 'g'))) {
        if (eachClassPositionMatch.index === undefined) continue
        const eachClassAttributeString = eachClassPositionMatch[0]
        const eachAttrStart = startIndex + eachClassPositionMatch.index + eachClassAttributeString.length
        const localAttrStart = eachAttrStart - startIndex
        const eachClassPositionEnd = findMatchingPairs(text, localAttrStart, start, end)
        if (!eachClassPositionEnd) continue
        const absoluteClassPositionEnd = startIndex + eachClassPositionEnd
        if (positionIndex !== undefined) {
          if (eachAttrStart <= positionIndex && absoluteClassPositionEnd >= positionIndex) {
            handle(eachAttrStart, absoluteClassPositionEnd, eachClassMatcher)
          } else if (eachClassPositionMatch.index > positionIndex - startIndex) {
            break
          }
        } else {
          handle(eachAttrStart, absoluteClassPositionEnd, eachClassMatcher)
        }
      }
    }
  }

  const stringExpressions: ClassMatcher[] = []
  const assignmentExpressions: ClassMatcher[] = []

  // The build decodes character references only in markup it reads as markup: a `class`
  // attribute, or a Vue `:class` binding, in an HTML, Vue, Svelte or Astro file, outside its
  // scripts. In JS/TS documents only oxc tells a JSX attribute from a string, so this scan reads
  // every match there as written.
  const documentPath = getDocumentPath(textDocument)
  const decodesMarkup = HTML_ATTRIBUTE_SOURCE_EXT.test(documentPath)
  let nonMarkupRanges: SourceRange[] | undefined
  const isMarkup = (index: number) => {
    nonMarkupRanges ??= collectNonMarkupRanges(sourceText, ASTRO_SOURCE_EXT.test(documentPath), VUE_SOURCE_EXT.test(documentPath))
    return !nonMarkupRanges.some((range) => range.start <= index && index < range.end)
  }

  const markupStringExpressions = new Set<ClassMatcher>()
  const decodedMarkupExpressions = new Set<ClassMatcher>()
  classAttributes?.forEach((eachClassAttribute) => {
    const doubleQuoted: ClassMatcher = [eachClassAttribute + '=', '"', '"']
    const singleQuoted: ClassMatcher = [eachClassAttribute + '=', '\'', '\'']
    markupStringExpressions.add(doubleQuoted).add(singleQuoted)
    if (decodesMarkup && eachClassAttribute === 'class') decodedMarkupExpressions.add(doubleQuoted).add(singleQuoted)
    stringExpressions.push(doubleQuoted, singleQuoted)
  })

  classDeclarations?.forEach((eachClassDeclaration) => {
    stringExpressions.push(
      [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '"', '"'],
      [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '`', '`'],
      [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '\'', '\''],
    )

    assignmentExpressions.push(
      [eachClassDeclaration + '(?:\\s+)?(?::|=)(?:\\s+)?', '{', '}'],
    )
  })

  classFunctions?.forEach((eachClassFunction) => {
    stringExpressions.push(
      [eachClassFunction, '`', '`'],
    )

    assignmentExpressions.push(
      [eachClassFunction, '(', ')'],
    )
  })

  if (stringExpressions.length) {
    resolve(stringExpressions, (eachAttrStart, eachClassPositionEnd, eachClassMatcher) => {
      const [, pair] = eachClassMatcher
      const eachClassName = sourceText.substring(eachAttrStart, eachClassPositionEnd)
      const markup = markupStringExpressions.has(eachClassMatcher)
      // Svelte reads `{…}` in an attribute value as an expression; elsewhere markup text is literal.
      const spans = markup
        ? textDocument.languageId === 'svelte' ? collectExpressionSpans(eachClassName, '{') : []
        : pair === '`' ? collectExpressionSpans(eachClassName, '${') : []
      classPositions.push(...collectSpannedClassPositions(
        eachClassName,
        eachAttrStart,
        spans,
        pair,
        includeEmpty,
        acceptsClassRange,
        markup
          ? {
            characterReferences: decodedMarkupExpressions.has(eachClassMatcher) && isMarkup(eachAttrStart)
              ? decodeStetCSSHTMLAttributeValue
              : undefined
          }
          : { scriptString: pair as StetCSSScriptStringQuote }
      ))
    })
  }

  // A Vue `:class` binding quoted like an attribute value is one: the template compiler decodes
  // its character references before it parses the expression.
  const decodedBindingExpressions = new Set<ClassMatcher>()
  // The decoded bindings found: the class function and string scans read the same text as
  // written, and a reference splitting a string gives their positions other ranges.
  const decodedBindingRanges: SourceRange[] = []
  const decodesBindings = VUE_SOURCE_EXT.test(documentPath)
  if (classAttributeBindings) {
    const bindingExpressions: ClassMatcher[] = []
    for (const eachClassAttribute in classAttributeBindings) {
      const eachClassAttributeBinding = classAttributeBindings[eachClassAttribute]
      if (eachClassAttributeBinding === false) continue
      const binding: ClassMatcher = [eachClassAttribute + '=', eachClassAttributeBinding[0], eachClassAttributeBinding[1]]
      const quoted = binding[1] === '"' || binding[1] === '\''
      if (decodesBindings && quoted && DECODED_CLASS_BINDINGS.has(eachClassAttribute)) decodedBindingExpressions.add(binding)
      bindingExpressions.push(binding)
    }
    // First, so a range both scans find keeps the binding's reading.
    assignmentExpressions.unshift(...bindingExpressions)
  }

  if (assignmentExpressions.length) {
    const ignoredKeyValuePattern = createIgnoredKeyValuePattern(settings.ignoredKeys)
    resolve(assignmentExpressions, (eachAttrStart, eachClassPositionEnd, eachClassMatcher) => {
      const characterReferences = decodedBindingExpressions.has(eachClassMatcher) && isMarkup(eachAttrStart)
        ? decodeStetCSSHTMLAttributeValue
        : undefined
      const eachClassPositionExpression = sourceText.substring(eachAttrStart, eachClassPositionEnd)
      const ignoredRanges = collectIgnoredKeyValueRanges(eachClassPositionExpression, ignoredKeyValuePattern)
      const isIgnored = (index: number) => ignoredRanges.some((range) => range.start <= index && index < range.end)
      if (['""', '\'\'', '``'].includes(eachClassPositionExpression)) {
        const contextRange = { start: eachAttrStart + 1, end: eachAttrStart + 1 }
        if (includeEmpty && acceptsClassRange(eachAttrStart + 1, eachAttrStart + 1, contextRange)) {
          classPositions.push({
            range: { start: eachAttrStart + 1, end: eachAttrStart + 1 },
            contextRange,
            raw: '',
            token: ''
          })
        }
        return
      }
      if (characterReferences) decodedBindingRanges.push({ start: eachAttrStart, end: eachClassPositionEnd })

      // Strings inside a template's `${…}` join its text at runtime; this scan cannot tell which
      // ends touch it, so it leaves them out.
      const templateMatches = [...eachClassPositionExpression.matchAll(/(?<!\\)`([\s\S]*?)(?<!\\)`/g)]
      const templateRanges = templateMatches
        .map((match) => ({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }))
      const isInTemplate = (index: number) => templateRanges.some((range) => range.start < index && index < range.end)

      for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)"([\s\S]*?)(?<!\\)"/g)) {
        if (classExpressionMatch.index === undefined || isIgnored(classExpressionMatch.index) || isInTemplate(classExpressionMatch.index)) continue
        const eachClassName = classExpressionMatch[1]
        const classNameStart = eachAttrStart + classExpressionMatch.index + 1
        classPositions.push(...collectClassPositions(
          eachClassName,
          classNameStart,
          '"',
          includeEmpty,
          acceptsClassRange,
          { start: classNameStart, end: classNameStart + eachClassName.length },
          { scriptString: '"', characterReferences }
        ))
      }

      for (const classExpressionMatch of eachClassPositionExpression.matchAll(/(?<!\\)'([\s\S]*?)(?<!\\)'/g)) {
        if (classExpressionMatch.index === undefined || isIgnored(classExpressionMatch.index) || isInTemplate(classExpressionMatch.index)) continue
        const eachClassName = classExpressionMatch[1]
        const classNameStart = eachAttrStart + classExpressionMatch.index + 1
        classPositions.push(...collectClassPositions(
          eachClassName,
          classNameStart,
          '\'',
          includeEmpty,
          acceptsClassRange,
          { start: classNameStart, end: classNameStart + eachClassName.length },
          { scriptString: '\'', characterReferences }
        ))
      }

      for (const classExpressionMatch of templateMatches) {
        if (classExpressionMatch.index === undefined || isIgnored(classExpressionMatch.index)) continue
        const eachClassName = classExpressionMatch[1]
        const classNameStart = eachAttrStart + classExpressionMatch.index + 1
        classPositions.push(...collectSpannedClassPositions(
          eachClassName,
          classNameStart,
          collectExpressionSpans(eachClassName, '${'),
          '`',
          includeEmpty,
          acceptsClassRange,
          { scriptString: '`', characterReferences }
        ))
      }
    })
  }

  // Inside a decoded binding only the binding's own reading counts.
  const inDecodedBinding = ({ range }: ClassPosition) => decodedBindingRanges.some((binding) => binding.start <= range.start && range.end <= binding.end)
  return sortAndDeduplicate(decodedBindingRanges.length
    ? classPositions.filter((position) => position.characterReferences || !inDecodedBinding(position))
    : classPositions)
}
