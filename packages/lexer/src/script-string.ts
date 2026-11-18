export type StetCSSScriptStringQuote = '"' | '\'' | '`'

/**
 * Decoded text of a source span, with the source range that spells each decoded UTF-16 unit.
 * Source text that decodes to nothing (a line continuation) belongs to no unit.
 */
export interface StetCSSDecodedSource {
  value: string
  /** `starts[i]` is the source offset where decoded unit `i` begins. */
  starts: number[]
  /** `ends[i]` is the source offset where decoded unit `i` ends. */
  ends: number[]
}

const SINGLE_ESCAPES: Record<string, string> = {
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v'
}

const HEX_RE = /^[0-9A-Fa-f]+$/

function isLineTerminator(char: string | undefined) {
  return char === '\n' || char === '\r' || char === ' ' || char === ' '
}

function isOctalDigit(char: string | undefined) {
  return char !== undefined && char >= '0' && char <= '7'
}

function readHex(source: string, start: number, length: number) {
  const hex = source.slice(start, start + length)
  return hex.length === length && HEX_RE.test(hex) ? parseInt(hex, 16) : undefined
}

/**
 * Decodes the body of a JavaScript string literal or template (the text between its quotes, as
 * written in the source) the way the parser cooks it, and records where each decoded unit is
 * spelled. Returns `undefined` when the body is not a valid one for `quote`: an unescaped quote,
 * a line break in a quoted string, `${` in a template, or a malformed escape.
 */
export function decodeStetCSSScriptString(source: string, quote: StetCSSScriptStringQuote): StetCSSDecodedSource | undefined {
  const template = quote === '`'
  let value = ''
  const starts: number[] = []
  const ends: number[] = []
  const push = (text: string, start: number, end: number) => {
    value += text
    for (let index = 0; index < text.length; index++) {
      starts.push(start)
      ends.push(end)
    }
  }

  for (let index = 0; index < source.length;) {
    const char = source[index]
    if (char === quote) return
    if (char === '\r' || char === '\n') {
      if (!template) return
      const end = char === '\r' && source[index + 1] === '\n' ? index + 2 : index + 1
      push('\n', index, end)
      index = end
      continue
    }
    if (template && char === '$' && source[index + 1] === '{') return
    if (char !== '\\') {
      push(char, index, index + 1)
      index++
      continue
    }

    const start = index
    const next = source[index + 1]
    if (next === undefined) return
    if (isLineTerminator(next)) {
      index += next === '\r' && source[index + 2] === '\n' ? 3 : 2
      continue
    }
    if (next in SINGLE_ESCAPES) {
      push(SINGLE_ESCAPES[next], start, index + 2)
      index += 2
      continue
    }
    if (next === 'x') {
      const code = readHex(source, index + 2, 2)
      if (code === undefined) return
      push(String.fromCharCode(code), start, index + 4)
      index += 4
      continue
    }
    if (next === 'u') {
      let code: number | undefined
      let end: number
      if (source[index + 2] === '{') {
        const close = source.indexOf('}', index + 3)
        code = close === -1 ? undefined : readHex(source, index + 3, close - index - 3)
        end = close + 1
      } else {
        code = readHex(source, index + 2, 4)
        end = index + 6
      }
      if (code === undefined || code > 0x10FFFF) return
      push(String.fromCodePoint(code), start, end)
      index = end
      continue
    }
    if (next === '0' && !(source[index + 2] >= '0' && source[index + 2] <= '9')) {
      push('\0', start, index + 2)
      index += 2
      continue
    }
    if (next >= '0' && next <= '9') {
      // Legacy octal and \8 \9 escapes: allowed in sloppy-mode strings, never in templates.
      if (template) return
      if (next === '8' || next === '9') {
        push(next, start, index + 2)
        index += 2
        continue
      }
      let end = index + 2
      const maxLength = next <= '3' ? 3 : 2
      while (end - index - 1 < maxLength && isOctalDigit(source[end])) end++
      push(String.fromCharCode(parseInt(source.slice(index + 1, end), 8)), start, end)
      index = end
      continue
    }
    const codePoint = source.codePointAt(index + 1)!
    const escaped = String.fromCodePoint(codePoint)
    push(escaped, start, index + 1 + escaped.length)
    index += 1 + escaped.length
  }

  return { value, starts, ends }
}
