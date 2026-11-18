/**
 * Single-pass scans behind `extractClassCandidates`. Each one gives exactly the
 * result of the backtracking regex named in its docblock, which retried from
 * every character of a long run of brackets, tags or keywords and so took
 * quadratic time on input without whitespace (generated data, minified
 * bundles, deep nesting sent to text extraction).
 *
 * Like the regexes they replace (no `u` flag), they work on UTF-16 code units.
 * `.` in those regexes matches anything but `LINE_TERMINATORS`, and `\s` is
 * `WHITESPACE`.
 */

// Protected string literals are replaced by `COMPLETE-STRING--<index>--`.
export const SENTINEL_PREFIX = 'COMPLETE-STRING--'
export const SENTINEL_SUFFIX = '--'

const WHITESPACE = /\s/
export const LINE_TERMINATORS = new Set(['\n', '\r', ' ', ' '])
const TRIM_TRAILING_CHARS = new Set(['(', '[', '{', '\\', ':', '#', '=', '.'])
const DECORATED_KEYWORDS = ['export', 'function', 'class']
// A decorator match always ends in a line starting with one of the keywords.
const DECORATED_LINE = /\n(?:export|function|class)/

/** `/\s/.test(ch)`; printable ASCII is never whitespace, so it skips the regex. */
function isWhitespace(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return (code <= 32 || code >= 127) && WHITESPACE.test(ch)
}

function skipWhitespace(content: string, index: number): number {
  while (index < content.length && isWhitespace(content[index])) index++
  return index
}

function isDigit(ch: string | undefined) {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

/** End of a `COMPLETE-STRING--\d+--` sentinel starting at `index`, or -1. */
function sentinelEnd(content: string, index: number): number {
  if (!content.startsWith(SENTINEL_PREFIX, index)) return -1
  let end = index + SENTINEL_PREFIX.length
  if (!isDigit(content[end])) return -1
  while (isDigit(content[end])) end++
  return content.startsWith(SENTINEL_SUFFIX, end) ? end + SENTINEL_SUFFIX.length : -1
}

/**
 * Finds the `)` that closes `\([^;\s]*\)` for the `(` at `paren`: the last
 * `)` before the run of characters other than `;` and whitespace ends. Every
 * `(` inside one run shares the run's end, so the last scanned run is cached.
 */
class ParenRunScanner {
  private runStart = -1
  private runEnd = -1
  private lastClose = -1

  constructor(private readonly content: string) {}

  closeOf(paren: number): number {
    if (paren < this.runStart || paren >= this.runEnd) {
      const { content } = this
      let end = paren + 1
      let lastClose = -1
      while (end < content.length && content[end] !== ';' && !isWhitespace(content[end])) {
        if (content[end] === ')') lastClose = end
        end++
      }
      this.runStart = paren
      this.runEnd = end
      this.lastClose = lastClose
    }
    return this.lastClose > paren ? this.lastClose : -1
  }
}

/**
 * Removes every match `next(from)` returns, each the first `[start, end]` at
 * or after `from`, like `content.replace(regex, '')` with a `g` regex. Every
 * match is non-empty, so `pos` is still 0 only when nothing matched.
 */
function removeMatches(content: string, next: (from: number) => [start: number, end: number] | undefined): string {
  let out = ''
  let pos = 0
  for (let match = next(0); match; match = next(pos)) {
    out += content.slice(pos, match[0])
    pos = match[1]
  }
  return pos ? out + content.slice(pos) : content
}

/** `content.replace(/[([{\\:#=.]+$/, '')` */
export function trimTrailing(content: string): string {
  let end = content.length
  while (end > 0 && TRIM_TRAILING_CHARS.has(content[end - 1])) end--
  return end === content.length ? content : content.slice(0, end)
}

/** `/\S*\{\S*\}/.test(content)`: a `{` followed by a `}` with no whitespace between. */
export function hasBraceGroup(content: string): boolean {
  const first = content.indexOf('{')
  if (first < 0) return false
  let open = false
  for (let i = first; i < content.length; i++) {
    const ch = content[i]
    if (ch === '{') open = true
    else if (ch === '}') {
      if (open) return true
    } else if (open && isWhitespace(ch)) open = false
  }
  return false
}

/** `/\(.*\)=>/.test(content)`: a `(` before a `)=>` on the same line. */
export function hasParenthesizedArrow(content: string): boolean {
  const last = content.lastIndexOf(')=>')
  if (last < 0) return false
  let open = false
  for (let i = 0; i <= last; i++) {
    const ch = content[i]
    if (LINE_TERMINATORS.has(ch)) open = false
    else if (ch === ')' && open && content.startsWith(')=>', i)) return true
    else if (ch === '(') open = true
  }
  return false
}

/** `/\(\{[^}]*\}/.test(content)`: a `({` with a `}` anywhere after it. */
export function hasObjectArgument(content: string): boolean {
  const open = content.indexOf('({')
  return open >= 0 && content.indexOf('}', open + 2) >= 0
}

/**
 * `/{(.*)}/.exec(content)?.[1]`: on the first line where a `{` has a `}`
 * after it, everything between the line's first `{` and its last `}`.
 */
export function getGroupBody(content: string): string | undefined {
  const first = content.indexOf('{')
  if (first < 0) return undefined
  let open = -1
  let close = -1
  for (let i = first; i <= content.length; i++) {
    const ch = content[i]
    if (i === content.length || LINE_TERMINATORS.has(ch)) {
      if (close >= 0) return content.slice(open + 1, close)
      open = -1
      close = -1
    } else if (ch === '{') {
      if (open < 0) open = i
    } else if (ch === '}' && open >= 0) {
      close = i
    }
  }
  return undefined
}

/**
 * Removes each `opener … closer` span, the first `closer` after the opener
 * ending it, like `/opener(?:(?!closer)[\S\s])*closer/g`. With `tagEnd`, the
 * opener runs on to the first `tagEnd`, like `/<style[^>]*>…/g`. Once a span
 * has no end, no later opener has one either.
 */
function removeSpans(content: string, opener: string, closer: string, tagEnd?: string): string {
  return removeMatches(content, (from) => {
    const start = content.indexOf(opener, from)
    if (start < 0) return undefined
    let bodyStart = start + opener.length
    if (tagEnd) {
      const end = content.indexOf(tagEnd, bodyStart)
      if (end < 0) return undefined
      bodyStart = end + tagEnd.length
    }
    const close = content.indexOf(closer, bodyStart)
    return close < 0 ? undefined : [start, close + closer.length]
  })
}

/** `content.replace(/\/\*(?:(?!\*\/)[\S\s])*\*\//g, '')` */
export function removeBlockComments(content: string): string {
  return removeSpans(content, '/*', '*/')
}

/** `content.replace(/<!--(?:(?!-->)[\S\s])*-->/g, '')` */
export function removeHTMLComments(content: string): string {
  return removeSpans(content, '<!--', '-->')
}

/** `content.replace(/<style[^>]*>(?:(?!<\/style>)[\S\s])*<\/style>/g, '')` */
export function removeStyleTags(content: string): string {
  return removeSpans(content, '<style', '</style>', '>')
}

function lineEndOf(content: string, index: number): number {
  let end = index
  while (end < content.length && !LINE_TERMINATORS.has(content[end])) end++
  return end
}

/**
 * `content.replace(/import.*from\s*COMPLETE-STRING--\d+--/g, '')`: from an
 * `import` to the sentinel after the last `from` on its line that has one.
 * When an `import` has none, no later `import` on that line has one either.
 */
export function removeImportsFrom(content: string): string {
  return removeMatches(content, (from) => {
    for (let start = content.indexOf('import', from); start >= 0;) {
      const lineEnd = lineEndOf(content, start)
      for (let keyword = content.lastIndexOf('from', lineEnd - 4); keyword >= start + 6; keyword = content.lastIndexOf('from', keyword - 1)) {
        const end = sentinelEnd(content, skipWhitespace(content, keyword + 4))
        if (end >= 0) return [start, end]
      }
      start = content.indexOf('import', lineEnd)
    }
    return undefined
  })
}

/** `content.replace(/import\s*(?:COMPLETE-STRING--\d+--|\([^;\s]*\))/g, '')` */
export function removeImportCalls(content: string): string {
  const parens = new ParenRunScanner(content)
  return removeMatches(content, (from) => {
    for (let start = content.indexOf('import', from); start >= 0; start = content.indexOf('import', start + 1)) {
      const index = skipWhitespace(content, start + 6)
      const end = sentinelEnd(content, index)
      if (end >= 0) return [start, end]
      const close = content[index] === '(' ? parens.closeOf(index) : -1
      if (close >= 0) return [start, close + 1]
    }
    return undefined
  })
}

/** `content.replace(/(?:require|import)\([^;\s]*\)/g, '')` */
export function removeRequireCalls(content: string): string {
  const parens = new ParenRunScanner(content)
  // Neither callee can start inside the other, so a miss resumes after it.
  const callee = /(?:require|import)\(/g
  return removeMatches(content, (from) => {
    callee.lastIndex = from
    for (let match = callee.exec(content); match; match = callee.exec(content)) {
      const close = parens.closeOf(callee.lastIndex - 1)
      if (close >= 0) return [match.index, close + 1]
    }
    return undefined
  })
}

/**
 * `content.replace(/(?:@.*\n)+(?:export|function|class)/g, '')`: from an `@`
 * through the lines that start with `@` right after it, when the next line
 * starts with one of the keywords. Each `@…` segment must reach a `\n` with
 * no other line terminator in between. Every `@` on a line leads to the same
 * following lines, so the run of `@` lines is computed once per line.
 */
export function removeDecorators(content: string): string {
  if (!content.includes('@') || !DECORATED_LINE.test(content)) return content
  // Lines split at `\n` only; `lastBreak` is each line's last other line terminator.
  const starts = [0]
  const lastBreak = [-1]
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '\n') {
      starts.push(i + 1)
      lastBreak.push(-1)
    } else if (LINE_TERMINATORS.has(ch)) {
      lastBreak[lastBreak.length - 1] = i
    }
  }
  const lineCount = starts.length
  // runEnd[line]: where the run of `@` lines starting at `line` ends.
  const runEnd = new Array<number>(lineCount + 1)
  runEnd[lineCount] = content.length
  for (let line = lineCount - 1; line >= 0; line--) {
    const start = starts[line]
    const endsWithNewline = line + 1 < lineCount
    runEnd[line] = endsWithNewline && content[start] === '@' && lastBreak[line] < start
      ? runEnd[line + 1]
      : start
  }
  let line = 0
  // The first `@` at or after the last searched position, so each `@` is found once.
  let nextAt = -1
  return removeMatches(content, (from) => {
    while (line + 1 < lineCount && starts[line + 1] <= from) line++
    for (; line + 1 < lineCount; line++) {
      const searchFrom = Math.max(from, starts[line], lastBreak[line] + 1)
      if (nextAt < searchFrom) {
        nextAt = content.indexOf('@', searchFrom)
        if (nextAt < 0) return undefined
      }
      if (nextAt >= starts[line + 1] - 1) continue
      const keywordStart = runEnd[line + 1]
      const keyword = DECORATED_KEYWORDS.find((each) => content.startsWith(each, keywordStart))
      if (keyword) return [nextAt, keywordStart + keyword.length]
    }
    return undefined
  })
}
