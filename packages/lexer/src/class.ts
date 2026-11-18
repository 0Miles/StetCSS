import { decodeStetCSSScriptString, type StetCSSDecodedSource, type StetCSSScriptStringQuote } from './script-string'
import { STET_CSS_VALUE_UNITS } from './units'

export type StetCSSLexicalTokenType =
  | 'class'
  | 'enumMember'
  | 'property'
  | 'variable'
  | 'function'
  | 'number'
  | 'string'
  | 'keyword'
  | 'modifier'
  | 'operator'
  | 'type'

export type StetCSSLexicalTokenModifier =
  | 'declaration'
  | 'defaultLibrary'
  | 'component'
  | 'directive'
  | 'important'
  | 'pseudoClass'
  | 'pseudoElement'
  | 'query'
  | 'quoted'
  | 'selector'
  | 'unit'

export type StetCSSLexicalTokenRole =
  | 'block.brace'
  | 'declaration.property'
  | 'declaration.separator'
  | 'declaration.terminator'
  | 'directive.keyword'
  | 'directive.modifier'
  | 'directive.parameter'
  | 'directive.terminator'
  | 'query.keyword'
  | 'query.feature'
  | 'query.operator'
  | 'query.punctuation'
  | 'query.value'
  | 'query.number'
  | 'query.unit'
  | 'selector.attribute'
  | 'selector.attribute.bracket'
  | 'selector.attribute.operator'
  | 'selector.attribute.value'
  | 'selector.class'
  | 'selector.class.delimiter'
  | 'selector.combinator'
  | 'selector.function.punctuation'
  | 'selector.id'
  | 'selector.id.delimiter'
  | 'selector.nth'
  | 'selector.pseudoClass.delimiter'
  | 'selector.pseudoClass.name'
  | 'selector.pseudoElement.delimiter'
  | 'selector.pseudoElement.name'
  | 'selector.punctuation'
  | 'selector.separator'
  | 'selector.type'
  | 'theme.variable'
  | 'utility.component'
  | 'utility.semantic'
  | 'value.color'
  | 'value.function.name'
  | 'value.function.punctuation'
  | 'value.important'
  | 'value.keyword'
  | 'value.number'
  | 'value.operator'
  | 'value.separator'
  | 'value.string'
  | 'value.string.quote'
  | 'value.unit'
  | 'value.variable'

export interface StetCSSLexicalTokenItem {
  start: number
  end: number
  type: StetCSSLexicalTokenType
  role: StetCSSLexicalTokenRole
  modifiers?: StetCSSLexicalTokenModifier[]
}

export interface StetCSSSplitPart {
  start: number
  end: number
  separatorStart?: number
}

export type StetCSSClassListItemType = 'class' | 'space'

export interface StetCSSClassListItem {
  type: StetCSSClassListItemType
  start: number
  end: number
  raw: string
  token: string
}

export interface StetCSSClassListTokenRange {
  start: number
  end: number
  token: string
}

export interface StetCSSClassListParseOptions {
  preserveSpaces?: boolean
  includeEmpty?: boolean
  unescape?: string | readonly string[] | false
  /**
   * Treats the class list as the source body of a JavaScript string literal or template quoted by
   * this character: classes split on the decoded text and carry decoded tokens, while `start`,
   * `end` and `raw` stay in source, so joining every item's `raw` rebuilds the source spelling.
   * A body that does not decode falls back to `unescape: scriptString`.
   */
  scriptString?: StetCSSScriptStringQuote
}

export interface StetCSSValueTokenizeOptions {
  isKnownVariable?: (name: string) => boolean
}

const IDENTIFIER_RE = /^[A-Za-z_][\w-]*/
const CSS_CUSTOM_FUNCTION_RE = /^--[A-Za-z_][\w-]*/
const HASH_RE = /^#[\w-]+/
const VARIABLE_RE = /^\$[A-Za-z0-9-]+(?:\/[+-]?(?:\d+\.\d+|\.\d+|\d+|[A-Za-z0-9_.%-]+))?/
const NUMERIC_RE = /^([+-]?(?:\d+\.\d+|\.\d+|\d+))([A-Za-z%]+)?/
const SIZE_PAIR_RE = /^([+-]?(?:\d+\.\d+|\.\d+|\d+))x([+-]?(?:\d+\.\d+|\.\d+|\d+))(?![0-9A-Za-z])/

const STET_CSS_VALUE_UNIT_SET = new Set<string>(STET_CSS_VALUE_UNITS)
const ASCII_WHITESPACE = new Set(['\t', '\n', '\f', '\r', ' '])

/** Whether `char` separates classes in a class list: HTML's ASCII whitespace, not NBSP or other Unicode spaces. */
export function isASCIIWhitespace(char: string | undefined) {
  return char !== undefined && ASCII_WHITESPACE.has(char)
}

const ASCII_WHITESPACE_RUN = /[\t\n\f\r ]+/

/** The non-empty runs of `value` between ASCII whitespace: the classes of a class list, as the DOM splits it. */
export function splitASCIIWhitespace(value: string): string[] {
  return value.split(ASCII_WHITESPACE_RUN).filter(Boolean)
}

export function unescapeStetCSSClassListToken(raw: string, unescape: StetCSSClassListParseOptions['unescape']) {
  if (!unescape) return raw
  const characters = Array.isArray(unescape) ? unescape : [unescape]
  let token = raw
  for (const character of characters) {
    token = token.replace(new RegExp('\\\\' + character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), character)
  }
  return token
}

export function pushStetCSSLexicalToken(
  tokens: StetCSSLexicalTokenItem[],
  start: number,
  length: number,
  type: StetCSSLexicalTokenType,
  role: StetCSSLexicalTokenRole,
  modifiers?: StetCSSLexicalTokenModifier[]
) {
  if (length <= 0) return
  tokens.push({ start, end: start + length, type, role, modifiers })
}

export function findStetCSSClosingQuote(source: string, start: number, quote: string) {
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === '\\') {
      i++
      continue
    }
    if (source[i] === quote) return i
  }
  return source.length - 1
}

export function findStetCSSClosingParen(source: string, open: number) {
  let quote = ''
  let depth = 0
  for (let i = open; i < source.length; i++) {
    const char = source[i]
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '(') {
      depth++
      continue
    }
    if (char === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return source.length - 1
}

export function splitStetCSSTopLevel(source: string, separator: string): StetCSSSplitPart[] {
  const parts: StetCSSSplitPart[] = []
  let quote = ''
  let depth = 0
  let start = 0
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '(' || char === '[' || char === '{') {
      depth++
      continue
    }
    if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (depth === 0 && char === separator) {
      parts.push({ start, end: i, separatorStart: i })
      start = i + 1
    }
  }
  parts.push({ start, end: source.length })
  return parts
}

export function collectStetCSSClassListTokenRanges(classList: string): StetCSSClassListTokenRange[] {
  return parseStetCSSClassList(classList)
    .filter((item) => item.type === 'class' && item.raw)
    .map(({ start, end, token }) => ({ start, end, token }))
}

export function parseStetCSSClassList(
  classList: string,
  options: StetCSSClassListParseOptions = {}
): StetCSSClassListItem[] {
  if (options.scriptString) {
    const decoded = decodeStetCSSScriptString(classList, options.scriptString)
    if (decoded) return parseDecodedStetCSSClassList(classList, decoded, options)
    return parseStetCSSClassList(classList, { ...options, scriptString: undefined, unescape: options.scriptString })
  }
  const items: StetCSSClassListItem[] = []
  const pushClass = (start: number, end: number) => {
    const raw = classList.slice(start, end)
    items.push({
      type: 'class',
      start,
      end,
      raw,
      token: unescapeStetCSSClassListToken(raw, options.unescape)
    })
  }
  const pushSpace = (start: number, end: number) => {
    const raw = classList.slice(start, end)
    items.push({
      type: 'space',
      start,
      end,
      raw,
      token: raw
    })
  }

  if (!classList) {
    if (options.includeEmpty) pushClass(0, 0)
    return items
  }

  for (let index = 0; index < classList.length;) {
    const start = index
    if (isASCIIWhitespace(classList[index])) {
      while (isASCIIWhitespace(classList[index])) {
        if (options.includeEmpty) pushClass(index, index)
        index++
      }
      if (options.preserveSpaces) pushSpace(start, index)
      continue
    }

    while (index < classList.length && !isASCIIWhitespace(classList[index])) index++
    pushClass(start, index)
  }

  if (options.includeEmpty) pushClass(classList.length, classList.length)
  return items
}

/**
 * Splits `decoded.value` like `parseStetCSSClassList` and maps each item back onto `source`.
 * Source text that decodes to nothing (a line continuation) joins the neighbouring space, or the
 * class it leads or trails at either end of the list, so no source text falls between items.
 */
function parseDecodedStetCSSClassList(
  source: string,
  decoded: StetCSSDecodedSource,
  options: StetCSSClassListParseOptions
): StetCSSClassListItem[] {
  const { value, starts, ends } = decoded
  const items: StetCSSClassListItem[] = []
  const sourceOffsetAt = (index: number) => index < value.length ? starts[index] : source.length
  const push = (type: StetCSSClassListItem['type'], start: number, end: number, sourceStart: number, sourceEnd: number) => {
    items.push({
      type,
      start: sourceStart,
      end: sourceEnd,
      raw: source.slice(sourceStart, sourceEnd),
      token: value.slice(start, end)
    })
  }

  if (!value) {
    if (options.includeEmpty) push('class', 0, 0, 0, source.length)
    return items
  }

  let sourceStart = 0
  for (let index = 0; index < value.length;) {
    const start = index
    if (isASCIIWhitespace(value[index])) {
      while (isASCIIWhitespace(value[index])) {
        if (options.includeEmpty) {
          const offset = sourceOffsetAt(index)
          push('class', index, index, offset, offset)
        }
        index++
      }
      const sourceEnd = sourceOffsetAt(index)
      if (options.preserveSpaces) push('space', start, index, sourceStart, sourceEnd)
      sourceStart = sourceEnd
      continue
    }

    while (index < value.length && !isASCIIWhitespace(value[index])) index++
    const sourceEnd = index < value.length ? ends[index - 1] : source.length
    push('class', start, index, sourceStart, sourceEnd)
    sourceStart = sourceEnd
  }

  if (options.includeEmpty) push('class', value.length, value.length, source.length, source.length)
  return items
}

function withUnitModifier(modifiers: StetCSSLexicalTokenModifier[] = []) {
  return [...modifiers, 'unit' as const]
}

function pushNumberOrKeyword(
  tokens: StetCSSLexicalTokenItem[],
  absoluteStart: number,
  raw: string,
  modifiers?: StetCSSLexicalTokenModifier[],
  options?: StetCSSValueTokenizeOptions
) {
  if (!raw) return
  if (options?.isKnownVariable?.(raw)) {
    pushStetCSSLexicalToken(tokens, absoluteStart, raw.length, 'variable', 'value.variable', modifiers)
    return
  }

  const numeric = NUMERIC_RE.exec(raw)
  if (!numeric || numeric[0].length !== raw.length) {
    pushStetCSSLexicalToken(tokens, absoluteStart, raw.length, 'enumMember', raw.startsWith('#') ? 'value.color' : 'value.keyword', modifiers)
    return
  }

  const [, numberText, unit] = numeric
  if (unit && !STET_CSS_VALUE_UNIT_SET.has(unit)) {
    pushStetCSSLexicalToken(tokens, absoluteStart, raw.length, 'enumMember', 'value.keyword', modifiers)
    return
  }

  pushStetCSSLexicalToken(tokens, absoluteStart, numberText.length, 'number', 'value.number', modifiers)
  if (unit) {
    pushStetCSSLexicalToken(tokens, absoluteStart + numberText.length, unit.length, 'enumMember', 'value.unit', withUnitModifier(modifiers))
  }
}

function pushQueryNumberOrValue(tokens: StetCSSLexicalTokenItem[], absoluteStart: number, raw: string) {
  const numeric = NUMERIC_RE.exec(raw)
  if (!numeric || numeric[0].length !== raw.length) {
    pushStetCSSLexicalToken(tokens, absoluteStart, raw.length, 'enumMember', 'query.value', ['query'])
    return
  }
  const [, numberText, unit] = numeric
  pushStetCSSLexicalToken(tokens, absoluteStart, numberText.length, 'number', 'query.number', ['query'])
  if (unit) {
    pushStetCSSLexicalToken(tokens, absoluteStart + numberText.length, unit.length, 'enumMember', 'query.unit', ['query', 'unit'])
  }
}

function pushSlashSeparatedValue(
  tokens: StetCSSLexicalTokenItem[],
  absoluteStart: number,
  raw: string,
  options?: StetCSSValueTokenizeOptions
) {
  let segmentStart = 0
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '/') continue
    pushNumberOrKeyword(tokens, absoluteStart + segmentStart, raw.slice(segmentStart, i), undefined, options)
    pushStetCSSLexicalToken(tokens, absoluteStart + i, 1, 'operator', 'value.separator')
    segmentStart = i + 1
  }
  pushNumberOrKeyword(tokens, absoluteStart + segmentStart, raw.slice(segmentStart), undefined, options)
}

export function tokenizeStetCSSValue(
  valueText: string,
  valueStart: number,
  options?: StetCSSValueTokenizeOptions
): StetCSSLexicalTokenItem[] {
  const tokens: StetCSSLexicalTokenItem[] = []

  for (let i = 0; i < valueText.length;) {
    const char = valueText[i]

    if (/\s/.test(char)) {
      i++
      continue
    }

    if (char === '"' || char === '\'') {
      const end = findStetCSSClosingQuote(valueText, i, char)
      pushStetCSSLexicalToken(tokens, valueStart + i, 1, 'string', 'value.string.quote', ['quoted'])
      if (end > i + 1) {
        pushStetCSSLexicalToken(tokens, valueStart + i + 1, end - i - 1, 'string', 'value.string', ['quoted'])
      }
      pushStetCSSLexicalToken(tokens, valueStart + end, 1, 'string', 'value.string.quote', ['quoted'])
      i = end + 1
      continue
    }

    if (char === '$') {
      const match = valueText.slice(i).match(VARIABLE_RE)
      if (match) {
        const variable = match[0]
        const slash = variable.lastIndexOf('/')
        if (slash > 0) {
          pushStetCSSLexicalToken(tokens, valueStart + i, slash, 'variable', 'value.variable')
          pushStetCSSLexicalToken(tokens, valueStart + i + slash, 1, 'operator', 'value.separator')
          pushNumberOrKeyword(tokens, valueStart + i + slash + 1, variable.slice(slash + 1))
        } else {
          pushStetCSSLexicalToken(tokens, valueStart + i, variable.length, 'variable', 'value.variable')
        }
        i += variable.length
        continue
      }
    }

    if (char === '#') {
      const match = valueText.slice(i).match(HASH_RE)
      if (match) {
        pushStetCSSLexicalToken(tokens, valueStart + i, match[0].length, 'enumMember', 'value.color')
        i += match[0].length
        continue
      }
    }

    if (char === '-' && valueText[i + 1] === '-') {
      const customFunction = valueText.slice(i).match(CSS_CUSTOM_FUNCTION_RE)
      if (customFunction) {
        const word = customFunction[0]
        const wordEnd = i + word.length
        if (word === '--value' && valueText[wordEnd] === '(') {
          pushStetCSSLexicalToken(tokens, valueStart + i, word.length, 'function', 'value.function.name')
          pushStetCSSLexicalToken(tokens, valueStart + wordEnd, 1, 'operator', 'value.function.punctuation')
          i = wordEnd + 1
          continue
        }
      }
    }

    const pair = valueText.slice(i).match(SIZE_PAIR_RE)
    if (pair) {
      pushStetCSSLexicalToken(tokens, valueStart + i, pair[1].length, 'number', 'value.number')
      pushStetCSSLexicalToken(tokens, valueStart + i + pair[1].length, 1, 'operator', 'value.separator', ['unit'])
      pushStetCSSLexicalToken(tokens, valueStart + i + pair[1].length + 1, pair[2].length, 'number', 'value.number')
      i += pair[0].length
      continue
    }

    if (/[+-]?(?:\d|\.)/.test(char)) {
      const match = valueText.slice(i).match(NUMERIC_RE)
      if (match) {
        const raw = match[0]
        pushNumberOrKeyword(tokens, valueStart + i, raw, undefined, options)
        i += raw.length
        continue
      }
    }

    const identifier = valueText.slice(i).match(IDENTIFIER_RE)
    if (identifier) {
      const word = identifier[0]
      const wordEnd = i + word.length
      if (valueText[wordEnd] === '(') {
        pushStetCSSLexicalToken(tokens, valueStart + i, word.length, 'function', 'value.function.name')
        pushStetCSSLexicalToken(tokens, valueStart + wordEnd, 1, 'operator', 'value.function.punctuation')
        if (word === 'url') {
          const close = findStetCSSClosingParen(valueText, wordEnd)
          const innerStart = wordEnd + 1
          const innerEnd = Math.max(innerStart, close)
          const inner = valueText.slice(innerStart, innerEnd)
          if (inner) {
            if (inner[0] === '"' || inner[0] === '\'') {
              tokens.push(...tokenizeStetCSSValue(inner, valueStart + innerStart, options))
            } else {
              pushStetCSSLexicalToken(tokens, valueStart + innerStart, inner.length, 'string', 'value.string')
            }
          }
          if (valueText[close] === ')') {
            pushStetCSSLexicalToken(tokens, valueStart + close, 1, 'operator', 'value.function.punctuation')
            i = close + 1
          } else {
            i = innerEnd
          }
        } else {
          i = wordEnd + 1
        }
        continue
      }

      let end = wordEnd
      while (end < valueText.length && /[A-Za-z0-9.%/-]/.test(valueText[end])) end++
      pushSlashSeparatedValue(tokens, valueStart + i, valueText.slice(i, end), options)
      i = end
      continue
    }

    if (char === '|' || char === '_' || char === ',' || char === '/') {
      pushStetCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.separator')
      i++
      continue
    }

    if (char === '(' || char === ')') {
      pushStetCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.function.punctuation')
      i++
      continue
    }

    if (char === '+' || char === '*' || char === '-') {
      pushStetCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.operator')
      i++
      continue
    }

    if (char === '!') {
      pushStetCSSLexicalToken(tokens, valueStart + i, 1, 'operator', 'value.important', ['important'])
      i++
      continue
    }

    pushStetCSSLexicalToken(tokens, valueStart + i, 1, 'enumMember', 'value.keyword')
    i++
  }

  return tokens
}

function startsAtFeatureOperator(value: string) {
  return value[0] === ':'
    || value.startsWith('>=')
    || value.startsWith('<=')
    || value[0] === '>'
    || value[0] === '<'
    || value[0] === '='
}

function pushAtWord(tokens: StetCSSLexicalTokenItem[], start: number, value: string, next: string) {
  if (startsAtFeatureOperator(next)) {
    pushStetCSSLexicalToken(tokens, start, value.length, 'property', 'query.feature', ['query'])
  } else {
    pushQueryNumberOrValue(tokens, start, value)
  }
}

function startsNamedQueryRange(value: string) {
  return value[0] === '&' || value[0] === ','
}

export function tokenizeStetCSSAtQuery(queryText: string, queryStart: number): StetCSSLexicalTokenItem[] {
  const tokens: StetCSSLexicalTokenItem[] = []
  let i = 0
  const keyword = queryText.match(/^@[A-Za-z0-9-]+/)
  if (keyword) {
    const [keywordText] = keyword
    if (startsNamedQueryRange(queryText.slice(keywordText.length))) {
      pushStetCSSLexicalToken(tokens, queryStart, 1, 'keyword', 'query.keyword', ['query'])
      pushQueryNumberOrValue(tokens, queryStart + 1, keywordText.slice(1))
    } else {
      pushStetCSSLexicalToken(tokens, queryStart, keywordText.length, 'keyword', 'query.keyword', ['query'])
    }
    i += keyword[0].length
  } else if (queryText[i] === '@') {
    pushStetCSSLexicalToken(tokens, queryStart, 1, 'keyword', 'query.keyword', ['query'])
    i++
  }

  while (i < queryText.length) {
    const twoChars = queryText.slice(i, i + 2)
    if (twoChars === '>=' || twoChars === '<=') {
      pushStetCSSLexicalToken(tokens, queryStart + i, 2, 'operator', 'query.operator', ['query'])
      i += 2
      continue
    }

    const char = queryText[i]
    if (char === '(' || char === ')') {
      pushStetCSSLexicalToken(tokens, queryStart + i, 1, 'operator', 'query.punctuation', ['query'])
      i++
      continue
    }
    if (char === ',' || char === ':' || char === '|') {
      pushStetCSSLexicalToken(tokens, queryStart + i, 1, 'operator', 'query.punctuation', ['query'])
      i++
      continue
    }
    if (char === '&' || char === '!' || char === '>' || char === '<' || char === '=') {
      pushStetCSSLexicalToken(tokens, queryStart + i, 1, 'operator', 'query.operator', ['query'])
      i++
      continue
    }
    if (/\s/.test(char)) {
      i++
      continue
    }

    const word = queryText.slice(i).match(/^[#A-Za-z0-9_.%-]+/)
    if (word) {
      const next = queryText.slice(i + word[0].length, i + word[0].length + 2)
      pushAtWord(tokens, queryStart + i, word[0], next)
      i += word[0].length
    } else {
      i++
    }
  }

  return tokens
}

const NTH_PSEUDO_CLASSES = new Set(['nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type', 'nth-col', 'nth-last-col'])
// The argument ends at `)` or at `_of_` (the `of S` form); `_` is a word character, so a bare
// `(?![\w-])` would reject `2n+1_of_li`.
const NTH_AN_PLUS_B_RE = /^(?:[+-]?\d*n(?:[+-]\d+)?|[+-]?\d+)(?=_of_|[^\w-]|$)/i
const NTH_PARITY_RE = /^(?:odd|even)(?=_of_|[^\w-]|$)/i
const NTH_OF_RE = /^_of_/i
const TYPE_SELECTOR_RE = /^\*?[A-Za-z][\w-]*/
const ATTRIBUTE_NAME_RE = /^[A-Za-z_-][\w-]*/
const ATTRIBUTE_OPERATOR_RE = /^[~|^$*]?=/
const ATTRIBUTE_UNQUOTED_VALUE_RE = /^[^\]"']+/

function pushTypeSelector(tokens: StetCSSLexicalTokenItem[], token: string, start: number, offset: number) {
  const match = token.slice(start).match(TYPE_SELECTOR_RE)
  if (!match) return start
  pushStetCSSLexicalToken(tokens, offset + start, match[0].length, 'type', 'selector.type', ['selector'])
  return start + match[0].length
}

/**
 * Tokenizes the argument of an `:nth-*()` pseudo-class from just after its `(`. Native CSS colours
 * the whole `an+b` expression as one number, so `+` and `-` inside it are not combinators.
 */
function tokenizeNthArgument(tokens: StetCSSLexicalTokenItem[], token: string, start: number, offset: number) {
  const rest = token.slice(start)
  const anPlusB = rest.match(NTH_AN_PLUS_B_RE)
  const parity = anPlusB ? undefined : rest.match(NTH_PARITY_RE)
  const match = anPlusB ?? parity
  if (!match) return start
  pushStetCSSLexicalToken(tokens, offset + start, match[0].length, anPlusB ? 'number' : 'enumMember', 'selector.nth', ['selector'])
  let i = start + match[0].length
  const of = token.slice(i).match(NTH_OF_RE)
  if (of) i = pushTypeSelector(tokens, token, i + of[0].length, offset)
  return i
}

function findAttributeSelectorClose(token: string, start: number) {
  const close = token.indexOf(']', start)
  return close === -1 ? token.length : close
}

/**
 * Tokenizes an attribute selector from just after its `[` and returns the offset of its `]`, which
 * the caller tokenizes. Text after the value, such as `_i`, gets no tokens: the engine keeps `_`
 * inside brackets as written, so it is neither a combinator nor a case flag.
 */
function tokenizeAttributeSelector(tokens: StetCSSLexicalTokenItem[], token: string, start: number, offset: number) {
  const name = token.slice(start).match(ATTRIBUTE_NAME_RE)
  if (!name) return findAttributeSelectorClose(token, start)
  pushStetCSSLexicalToken(tokens, offset + start, name[0].length, 'property', 'selector.attribute', ['selector'])
  let i = start + name[0].length
  const operator = token.slice(i).match(ATTRIBUTE_OPERATOR_RE)
  if (!operator) return findAttributeSelectorClose(token, i)
  pushStetCSSLexicalToken(tokens, offset + i, operator[0].length, 'operator', 'selector.attribute.operator', ['selector'])
  i += operator[0].length
  const quote = token[i]
  if (quote === '"' || quote === '\'') {
    const end = findStetCSSClosingQuote(token, i, quote)
    pushStetCSSLexicalToken(tokens, offset + i, 1, 'string', 'value.string.quote', ['quoted'])
    if (token[end] !== quote || end === i) return token.length
    pushStetCSSLexicalToken(tokens, offset + i + 1, end - i - 1, 'string', 'value.string', ['quoted'])
    pushStetCSSLexicalToken(tokens, offset + end, 1, 'string', 'value.string.quote', ['quoted'])
    return findAttributeSelectorClose(token, end + 1)
  }
  const value = token.slice(i).match(ATTRIBUTE_UNQUOTED_VALUE_RE)
  if (value) {
    pushStetCSSLexicalToken(tokens, offset + i, value[0].length, 'string', 'selector.attribute.value', ['selector'])
    i += value[0].length
  }
  return findAttributeSelectorClose(token, i)
}

export function tokenizeStetCSSState(token: string, stateStart: number, offset: number): StetCSSLexicalTokenItem[] {
  const tokens: StetCSSLexicalTokenItem[] = []
  for (let i = stateStart; i < token.length;) {
    const char = token[i]
    if (char === '!') {
      pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', 'value.important', ['important'])
      i++
    } else if (char === '_' || char === '>' || char === '+' || char === '~') {
      pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', 'selector.combinator', ['selector'])
      i++
      const match = token.slice(i).match(/^\*?[A-Za-z][\w-]*/)
      if (match) {
        pushStetCSSLexicalToken(tokens, offset + i, match[0].length, 'type', 'selector.type', ['selector'])
        i += match[0].length
      }
    } else if (char === '.' || char === '#') {
      const role = char === '.' ? 'selector.class' : 'selector.id'
      pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', char === '.' ? 'selector.class.delimiter' : 'selector.id.delimiter', ['selector'])
      const nameStart = i + 1
      const match = token.slice(nameStart).match(/^[\w-]+/)
      if (match) {
        pushStetCSSLexicalToken(tokens, offset + nameStart, match[0].length, char === '.' ? 'class' : 'variable', role, ['selector'])
        i = nameStart + match[0].length
      } else {
        i = nameStart
      }
    } else if (char === '(' || char === ',') {
      pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', char === '(' ? 'selector.function.punctuation' : 'selector.separator', ['selector'])
      i++
      const match = token.slice(i).match(/^\*?[A-Za-z][\w-]*/)
      if (match) {
        pushStetCSSLexicalToken(tokens, offset + i, match[0].length, 'type', 'selector.type', ['selector'])
        i += match[0].length
      }
    } else if (char === '[') {
      pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', 'selector.attribute.bracket', ['selector'])
      i = tokenizeAttributeSelector(tokens, token, i + 1, offset)
    } else if (char === ')' || char === ']') {
      pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', char === ')' ? 'selector.function.punctuation' : 'selector.attribute.bracket', ['selector'])
      i++
    } else if (char === '@') {
      const nextAt = token.indexOf('@', i + 1)
      const end = nextAt >= 0 ? nextAt : token.length
      tokens.push(...tokenizeStetCSSAtQuery(token.slice(i, end), offset + i))
      i = end
    } else if (char === ':') {
      const colonLength = token[i + 1] === ':' ? 2 : 1
      const pseudoModifier = colonLength === 2 ? 'pseudoElement' : 'pseudoClass'
      const delimiterRole = colonLength === 2 ? 'selector.pseudoElement.delimiter' : 'selector.pseudoClass.delimiter'
      const nameRole = colonLength === 2 ? 'selector.pseudoElement.name' : 'selector.pseudoClass.name'
      pushStetCSSLexicalToken(tokens, offset + i, colonLength, 'operator', delimiterRole, ['selector', pseudoModifier])
      const nameStart = i + colonLength
      const match = token.slice(nameStart).match(/^[\w-]+/)
      if (match) {
        pushStetCSSLexicalToken(tokens, offset + nameStart, match[0].length, 'modifier', nameRole, [pseudoModifier])
        i = nameStart + match[0].length
        if (colonLength === 1 && token[i] === '(' && NTH_PSEUDO_CLASSES.has(match[0].toLowerCase())) {
          pushStetCSSLexicalToken(tokens, offset + i, 1, 'operator', 'selector.function.punctuation', ['selector'])
          i = tokenizeNthArgument(tokens, token, i + 1, offset)
        }
      } else {
        i = nameStart
      }
    } else {
      i++
    }
  }
  return tokens
}

function findStetCSSGroupedClassClose(token: string) {
  let quote = ''
  let depth = 0
  for (let i = 1; i < token.length; i++) {
    const char = token[i]
    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '(' || char === '[' || char === '{') {
      depth++
      continue
    }
    if (char === ')' || char === ']') {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (char === '}') {
      if (depth === 0) return i
      depth--
    }
  }
}

export function tokenizeStetCSSGroupedClassToken(
  token: string,
  offset: number,
  tokenizeClassToken: (token: string, offset: number) => StetCSSLexicalTokenItem[]
): StetCSSLexicalTokenItem[] | undefined {
  const startsWithGroup = token.startsWith('{')
  const groupClose = startsWithGroup ? findStetCSSGroupedClassClose(token) : undefined
  const bodyStart = startsWithGroup ? 1 : 0
  const bodyEnd = groupClose ?? token.length
  const body = token.slice(bodyStart, bodyEnd)
  if (!startsWithGroup && !body.includes(';')) return

  const tokens: StetCSSLexicalTokenItem[] = []
  if (startsWithGroup) pushStetCSSLexicalToken(tokens, offset, 1, 'operator', 'block.brace')
  for (const part of splitStetCSSTopLevel(body, ';')) {
    const partText = body.slice(part.start, part.end).trim()
    if (partText) {
      const leadingWhitespace = body.slice(part.start, part.end).search(/\S/)
      tokens.push(...tokenizeClassToken(partText, offset + bodyStart + part.start + Math.max(0, leadingWhitespace)))
    }
    if (part.separatorStart !== undefined) {
      pushStetCSSLexicalToken(tokens, offset + bodyStart + part.separatorStart, 1, 'operator', 'declaration.terminator')
    }
  }
  if (groupClose !== undefined) {
    pushStetCSSLexicalToken(tokens, offset + groupClose, 1, 'operator', 'block.brace')
    tokens.push(...tokenizeStetCSSState(token, groupClose + 1, offset))
  }
  return tokens
}
