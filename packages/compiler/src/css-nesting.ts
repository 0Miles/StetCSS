import { findCSSCommentEnd } from '@stet-css/lexer'

/**
 * The deepest nesting of `{`, `(` and `[` a stylesheet may have before it reaches lightningcss.
 * lightningcss 1.32 recurses once per nested rule, selector function and media-query parenthesis,
 * and overflowing the native stack kills the process, which no try/catch can stop.
 * Measured on Node 24 with the compiler's visitors: about 300 nested rules throw an unnamed
 * `Maximum call stack size exceeded` and 1,000 kill the process on an 8 MB main thread; about 900
 * nested `@media` blocks kill a 4 MB worker thread; 128 nested `:is()` kill a 0.5 MB worker
 * thread. 64 levels of every measured shape compile on a 0.5 MB worker thread, and the deepest
 * stylesheet found in real packages nests 12.
 */
const CSS_NESTING_LIMIT = 64

const TAB = 0x09
const LINE_FEED = 0x0A
const FORM_FEED = 0x0C
const CARRIAGE_RETURN = 0x0D
const SPACE = 0x20
const DOUBLE_QUOTE = 0x22
const HASH = 0x23
const SINGLE_QUOTE = 0x27
const OPEN_PAREN = 0x28
const CLOSE_PAREN = 0x29
const ASTERISK = 0x2A
const HYPHEN = 0x2D
const SLASH = 0x2F
const AT = 0x40
const OPEN_BRACKET = 0x5B
const BACKSLASH = 0x5C
const CLOSE_BRACKET = 0x5D
const UNDERSCORE = 0x5F
const OPEN_BRACE = 0x7B
const CLOSE_BRACE = 0x7D

function isNewline(code: number) {
  return code === LINE_FEED || code === CARRIAGE_RETURN || code === FORM_FEED
}

function isWhitespace(code: number) {
  return code === SPACE || code === TAB || isNewline(code)
}

function isDigit(code: number) {
  return code >= 0x30 && code <= 0x39
}

function isHexDigit(code: number) {
  return isDigit(code) || ((code | 0x20) >= 0x61 && (code | 0x20) <= 0x66)
}

function isNameCode(code: number) {
  return isDigit(code) || ((code | 0x20) >= 0x61 && (code | 0x20) <= 0x7A) || code === HYPHEN || code === UNDERSCORE || code >= 0x80
}

/** Whether the `\` at `index` starts an escape: anything but a newline or the end of input follows. */
function startsEscape(source: string, index: number) {
  return index + 1 < source.length && !isNewline(source.charCodeAt(index + 1))
}

/**
 * Reads the name (identifier characters and escapes) starting at `start`. Returns its end and
 * whether it spells `url` once escapes are decoded, as `\75rl` does.
 */
function readName(source: string, start: number) {
  let index = start
  let name = ''
  while (index < source.length) {
    const code = source.charCodeAt(index)
    let char: number
    if (code === BACKSLASH && startsEscape(source, index)) {
      index++
      if (isHexDigit(source.charCodeAt(index))) {
        const hexStart = index
        while (index < hexStart + 6 && isHexDigit(source.charCodeAt(index))) index++
        char = parseInt(source.slice(hexStart, index), 16)
        if (source.charCodeAt(index) === CARRIAGE_RETURN && source.charCodeAt(index + 1) === LINE_FEED) index += 2
        else if (isWhitespace(source.charCodeAt(index))) index++
      } else {
        char = source.charCodeAt(index++)
      }
    } else if (isNameCode(code)) {
      char = code
      index++
    } else {
      break
    }
    if (name.length < 4) name += char < 0x80 ? String.fromCharCode(char).toLowerCase() : '?'
  }
  return { end: index, isURL: name === 'url' }
}

/** Returns the index after the string whose opening quote is at `start`; a newline ends it too, as in CSS. */
function skipString(source: string, start: number) {
  const quote = source.charCodeAt(start)
  for (let index = start + 1; index < source.length; index++) {
    const code = source.charCodeAt(index)
    if (code === quote) return index + 1
    if (isNewline(code)) return index
    if (code !== BACKSLASH) continue
    // An escaped CRLF is one line continuation.
    if (source.charCodeAt(index + 1) === CARRIAGE_RETURN && source.charCodeAt(index + 2) === LINE_FEED) index++
    index++
  }
  return source.length
}

/** Returns the index after the unquoted URL whose text starts at `start`: past its `)`, which a `\` can escape. */
function skipUnquotedURL(source: string, start: number) {
  for (let index = start; index < source.length; index++) {
    const code = source.charCodeAt(index)
    if (code === BACKSLASH) index++
    else if (code === CLOSE_PAREN) return index + 1
  }
  return source.length
}

/**
 * Returns the index of the bracket that takes `source` past the nesting limit, or -1.
 *
 * It tokenizes as CSS does, because any difference that counts short lets a crashing stylesheet
 * through: a closing bracket closes a level only when it matches the innermost open one, since CSS
 * ignores the others; comments, strings and escapes hold no brackets; an unquoted `url(...)` is one
 * token up to its `)`, so a `}`, `/*` or quote inside it is plain text. A stylesheet ending inside a
 * comment, string or URL has nothing after it to count, as CSS reads it to the end as well.
 */
function findCSSNestingLimitExceeded(source: string) {
  // The closing bracket each open level waits for.
  const closers = new Uint8Array(CSS_NESTING_LIMIT)
  let depth = 0
  let index = 0
  while (index < source.length) {
    const code = source.charCodeAt(index)
    switch (code) {
      case OPEN_PAREN:
      case OPEN_BRACKET:
      case OPEN_BRACE:
        if (depth === CSS_NESTING_LIMIT) return index
        closers[depth++] = code === OPEN_PAREN ? CLOSE_PAREN : code + 2
        index++
        continue
      case CLOSE_PAREN:
      case CLOSE_BRACKET:
      case CLOSE_BRACE:
        if (depth > 0 && closers[depth - 1] === code) depth--
        index++
        continue
      case SLASH:
        if (source.charCodeAt(index + 1) !== ASTERISK) break
        index = findCSSCommentEnd(source, index)
        continue
      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
        index = skipString(source, index)
        continue
    }
    if (!isNameCode(code) && !(code === BACKSLASH && startsEscape(source, index))) {
      index++
      continue
    }
    // `12url(`, `#url(` and `@url(` are a dimension, a hash and an at-keyword followed by a block.
    const previous = source.charCodeAt(index - 1)
    const isIdent = !isDigit(code) && previous !== HASH && previous !== AT
    const name = readName(source, index)
    index = name.end
    if (!isIdent || !name.isURL || source.charCodeAt(index) !== OPEN_PAREN) continue
    let urlStart = index + 1
    while (isWhitespace(source.charCodeAt(urlStart))) urlStart++
    const first = source.charCodeAt(urlStart)
    // `url("...")` is an ordinary function holding a string.
    if (first !== DOUBLE_QUOTE && first !== SINGLE_QUOTE) index = skipUnquotedURL(source, urlStart)
  }
  return -1
}

/**
 * Throws when `source` nests deeper than lightningcss can parse without overflowing its stack.
 * Call it before any lightningcss transform of a stylesheet; `filename` names the file in the error.
 */
export function assertCSSNestingDepth(source: string, filename: string) {
  const index = findCSSNestingLimitExceeded(source)
  if (index === -1) return
  const line = source.slice(0, index).split('\n').length
  throw new Error(`CSS nests deeper than ${CSS_NESTING_LIMIT} levels at line ${line}: ${filename}`)
}
