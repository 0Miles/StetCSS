const HEX_DIGIT = /[0-9a-fA-F]/
const CSS_WHITESPACE = /[ \t\n\r\f]/

/**
 * The words of `@theme` prelude source text with CSS escapes decoded, as lightningcss reads them:
 * an escaped space stays in its word (`a\ b` is the one word `a b`), and the whitespace that ends
 * a hex escape belongs to the escape (`\31 a` is `1a`).
 */
function splitThemePreludeSource(source: string) {
  const words: string[] = []
  let word = ''
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (char === '\\' && index + 1 < source.length) {
      let end = index + 1
      while (end < source.length && end - index <= 6 && HEX_DIGIT.test(source[end])) end++
      if (end === index + 1) {
        word += source[end]
        index = end
        continue
      }
      const codePoint = parseInt(source.slice(index + 1, end), 16)
      word += codePoint === 0 || codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF)
        ? '\uFFFD'
        : String.fromCodePoint(codePoint)
      if (end < source.length && CSS_WHITESPACE.test(source[end])) end++
      index = end - 1
      continue
    }
    if (CSS_WHITESPACE.test(char)) {
      if (word) words.push(word)
      word = ''
      continue
    }
    word += char
  }
  if (word) words.push(word)
  return words
}

/**
 * Parses an `@theme` prelude such as `dark`, `inline` or `static` into its mode and modifiers.
 * Takes the prelude's source text, or its words already decoded by the CSS parser. A mode name
 * may hold escaped characters, a space included (`@theme a\ b` is the mode `a b`).
 */
export default function parseThemePrelude(prelude: string | string[] | undefined): { mode?: string, inline?: boolean, static?: boolean } {
  if (!prelude) return {}
  const parts = typeof prelude === 'string' ? splitThemePreludeSource(prelude) : prelude
  let mode: string | undefined
  let inline = false
  let isStatic = false
  for (const part of parts) {
    if (part === 'inline' || part === 'static') {
      if (part === 'inline') {
        if (inline) throw new Error('@theme inline modifier cannot be repeated')
        inline = true
      } else {
        if (isStatic) throw new Error('@theme static modifier cannot be repeated')
        isStatic = true
      }
      continue
    }
    if (mode) {
      throw new Error('@theme mode must be a single token')
    }
    mode = part
  }
  if (inline && isStatic) {
    throw new Error('@theme inline and static cannot be combined')
  }
  if (inline && mode) {
    throw new Error('@theme inline cannot be mode-specific')
  }
  return {
    ...(mode ? { mode } : {}),
    ...(inline ? { inline: true } : {}),
    ...(isStatic ? { static: true } : {})
  }
}
