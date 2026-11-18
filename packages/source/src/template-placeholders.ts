import { isASCIIWhitespace } from '@stet-css/lexer'

const LINE_TERMINATORS = new Set(['\n', '\r', '\u2028', '\u2029'])
const QUOTES = new Set(['"', '\'', '`'])
/** The brace depth of an open placeholder's expression, or `IN_TEMPLATE` inside a template literal. */
const IN_TEMPLATE = -1

/** A character that joins the class touching a placeholder: neither a class-list separator nor a quote. */
function joinsClass(ch: string): boolean {
  return !isASCIIWhitespace(ch) && !QUOTES.has(ch)
}

/** Where the class fragment that ends at `index` starts, no earlier than `from`. */
function fragmentStart(content: string, from: number, index: number): number {
  while (index > from && joinsClass(content[index - 1])) index--
  return index
}

/** Where the class fragment that starts at `index` ends: before a separator, a quote or the next `${`. */
function fragmentEnd(content: string, index: number, to: number): number {
  while (index < to && joinsClass(content[index]) && !content.startsWith('${', index)) index++
  return index
}

/** The index after the `'` or `"` string that starts at `index`; an unterminated one ends at its line. */
function quotedStringEnd(content: string, index: number, to: number): number {
  const quote = content[index]
  for (index++; index < to; index++) {
    const ch = content[index]
    if (ch === quote) return index + 1
    if (LINE_TERMINATORS.has(ch)) return index
    if (ch === '\\') index++
  }
  return to
}

/**
 * The `}` that closes the placeholder whose expression starts at `index`, skipping the braces,
 * strings and template literals (with their own placeholders) inside it, or -1 when none does.
 */
function findPlaceholderEnd(content: string, index: number): number {
  const stack = [0]
  for (; index < content.length; index++) {
    const ch = content[index]
    const top = stack[stack.length - 1]
    if (top === IN_TEMPLATE) {
      if (ch === '\\') index++
      else if (ch === '`') stack.pop()
      else if (content.startsWith('${', index)) {
        stack.push(0)
        index++
      }
    } else if (ch === '"' || ch === '\'') {
      index = quotedStringEnd(content, index, content.length) - 1
    } else if (ch === '`') {
      stack.push(IN_TEMPLATE)
    } else if (ch === '{') {
      stack[stack.length - 1]++
    } else if (ch === '}') {
      if (top) stack[stack.length - 1]--
      else {
        stack.pop()
        if (!stack.length) return index
      }
    }
  }
  return -1
}

/**
 * Pushes the string literals and template literals of the closed placeholder expression
 * `content[index, end)` to `parts`, each followed by a space, with the placeholders of those
 * templates and their touching fragments left out as `removeTemplatePlaceholders` leaves them out.
 */
function pushExpressionStrings(content: string, index: number, end: number, parts: string[]) {
  const stack = [0]
  let textStart = index
  while (index < end) {
    const ch = content[index]
    const top = stack[stack.length - 1]
    if (top === IN_TEMPLATE) {
      if (ch === '\\') {
        index += 2
        continue
      }
      if (ch === '`') {
        parts.push(content.slice(textStart, index + 1), ' ')
        stack.pop()
      } else if (content.startsWith('${', index)) {
        parts.push(content.slice(textStart, fragmentStart(content, textStart, index)), ' ')
        stack.push(0)
        index++
      }
    } else if (ch === '"' || ch === '\'') {
      const stringEnd = quotedStringEnd(content, index, end)
      parts.push(content.slice(index, stringEnd), ' ')
      index = stringEnd
      continue
    } else if (ch === '`') {
      stack.push(IN_TEMPLATE)
      textStart = index
    } else if (ch === '{') {
      stack[stack.length - 1]++
    } else if (ch === '}') {
      if (top) stack[stack.length - 1]--
      else {
        // A nested placeholder closes back into its template; the outer one closes at `end`.
        stack.pop()
        index = textStart = fragmentEnd(content, index + 1, end)
        continue
      }
    }
    index++
  }
}

/**
 * Replaces each closed template-literal placeholder `${…}` with the strings its expression holds.
 * The expression is code the host fills in at runtime, and the text touching a placeholder is a
 * fragment of a class that only exists then (`grid-` in `grid-${size}`), so neither is a class
 * candidate; a string in the expression may be a whole class (`${on ? 'fg:red' : ''}`). A
 * fragment runs to ASCII whitespace or a quote, as a class does. An unclosed placeholder stays
 * text.
 */
export function removeTemplatePlaceholders(content: string): string {
  let start = content.indexOf('${')
  if (start < 0) return content
  const parts: string[] = []
  let pos = 0
  while (start >= 0) {
    const end = findPlaceholderEnd(content, start + 2)
    if (end < 0) break
    parts.push(content.slice(pos, fragmentStart(content, pos, start)), ' ')
    pushExpressionStrings(content, start + 2, end, parts)
    pos = fragmentEnd(content, end + 1, content.length)
    start = content.indexOf('${', pos)
  }
  parts.push(content.slice(pos))
  return parts.join('')
}
