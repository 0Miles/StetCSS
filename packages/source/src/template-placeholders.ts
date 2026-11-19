import { isASCIIWhitespace } from '@stet-css/lexer'
import { LINE_TERMINATORS } from './extraction-scans'

const QUOTES = new Set(['"', '\'', '`'])

/** An open template literal, or the code of an open placeholder with its unclosed `{` count. */
type Frame = { template: true } | { template: false, braces: number }

/** What `walkPlaceholder` meets inside a placeholder expression, by index into the content. */
interface PlaceholderVisitor {
  /** A `'` or `"` string in code, `[start, end)`. */
  string(start: number, end: number): void
  /** The opening backtick of a template literal in code. */
  templateStart(index: number): void
  /** The closing backtick of a template literal. */
  templateEnd(index: number): void
  /** The `$` of a placeholder in a template literal. */
  placeholderStart(index: number): void
  /** The `}` that closes a placeholder in a template literal. */
  placeholderEnd(index: number): void
}

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
function fragmentEnd(content: string, index: number): number {
  while (index < content.length && joinsClass(content[index]) && !content.startsWith('${', index)) index++
  return index
}

/** The index after the `'` or `"` string that starts at `index`; an unterminated one ends at its line. */
function quotedStringEnd(content: string, index: number): number {
  const quote = content[index]
  for (index++; index < content.length; index++) {
    const ch = content[index]
    if (ch === quote) return index + 1
    if (LINE_TERMINATORS.has(ch)) return index
    if (ch === '\\') index++
  }
  return content.length
}

/**
 * Walks the expression of a placeholder from `index`, just after its `${`, through the strings,
 * braces and template literals (with their own placeholders) inside it, and returns the index of
 * the `}` that closes it. Returns -1 when none does, or at a `${` in code, which JavaScript never
 * has there: an unclosed `${` in prose ends at the next one instead of reading on to the end.
 */
function walkPlaceholder(content: string, index: number, visitor: PlaceholderVisitor): number {
  const frames: Frame[] = [{ template: false, braces: 0 }]
  for (; index < content.length; index++) {
    const ch = content[index]
    const frame = frames[frames.length - 1]
    if (frame.template) {
      if (ch === '\\') {
        index++
      } else if (ch === '`') {
        frames.pop()
        visitor.templateEnd(index)
      } else if (content.startsWith('${', index)) {
        visitor.placeholderStart(index)
        frames.push({ template: false, braces: 0 })
        index++
      }
    } else if (content.startsWith('${', index)) {
      return -1
    } else if (ch === '"' || ch === '\'') {
      const end = quotedStringEnd(content, index)
      visitor.string(index, end)
      index = end - 1
    } else if (ch === '`') {
      frames.push({ template: true })
      visitor.templateStart(index)
    } else if (ch === '{') {
      frame.braces++
    } else if (ch === '}') {
      if (frame.braces) {
        frame.braces--
      } else {
        frames.pop()
        if (!frames.length) return index
        visitor.placeholderEnd(index)
      }
    }
  }
  return -1
}

/**
 * Pushes to `parts` the strings and template literals of the placeholder whose `$` is at `start`,
 * each followed by a space, with the placeholders of those templates and the fragments touching
 * them left out. Returns the index of its closing `}`, or -1 with `unclosed` holding the
 * placeholders still open inside it.
 */
function readPlaceholder(content: string, start: number, parts: string[], unclosed: number[]): number {
  let textStart = start
  return walkPlaceholder(content, start + 2, {
    string(stringStart, stringEnd) {
      parts.push(content.slice(stringStart, stringEnd), ' ')
    },
    templateStart(index) {
      textStart = index
    },
    templateEnd(index) {
      parts.push(content.slice(textStart, index + 1), ' ')
    },
    placeholderStart(index) {
      parts.push(content.slice(textStart, fragmentStart(content, textStart, index)), ' ')
      unclosed.push(index)
    },
    placeholderEnd(index) {
      unclosed.pop()
      textStart = fragmentEnd(content, index + 1)
    }
  })
}

/**
 * `text`, the static text of a template literal beside its placeholders, without the class
 * fragments touching them: `before` and `after` say which of its ends a placeholder touches. Uses
 * the fragment rule of `removeTemplatePlaceholders`, so a parsed template literal yields the
 * candidates text extraction finds in the same one.
 */
export function removeTemplateFragments(text: string, before: boolean, after: boolean): string {
  const start = before ? fragmentEnd(text, 0) : 0
  const end = after ? fragmentStart(text, start, text.length) : text.length
  return text.slice(start, end)
}

/**
 * Replaces each closed template-literal placeholder `${…}` with the strings its expression holds.
 * The expression is code the host fills in at runtime, and the text touching a placeholder is a
 * fragment of a class that only exists then (`grid-` in `grid-${size}`), so neither is a class
 * candidate; a string in the expression may be a whole class (`${on ? 'fg:red' : ''}`). A
 * fragment runs to ASCII whitespace, a quote or the next `${`. An unclosed `${` stays text.
 */
export function removeTemplatePlaceholders(content: string): string {
  let start = content.indexOf('${')
  if (start < 0) return content
  const parts: string[] = []
  // `${` left open inside an unclosed placeholder: their own walk would follow the same frames
  // and fail too, so skipping them keeps the pass linear.
  const unclosed = new Set<number>()
  const open: number[] = []
  let pos = 0
  while (start >= 0) {
    if (!unclosed.has(start)) {
      const mark = parts.length
      // The text before it is filled in once the placeholder closes: scanning back for its
      // fragment on every unclosed `${` would rescan the same text.
      parts.push('', ' ')
      open.length = 0
      const end = readPlaceholder(content, start, parts, open)
      if (end >= 0) {
        parts[mark] = content.slice(pos, fragmentStart(content, pos, start))
        pos = fragmentEnd(content, end + 1)
        start = content.indexOf('${', pos)
        continue
      }
      parts.length = mark
      for (const index of open) unclosed.add(index)
    }
    start = content.indexOf('${', start + 2)
  }
  parts.push(content.slice(pos))
  return parts.join('')
}
