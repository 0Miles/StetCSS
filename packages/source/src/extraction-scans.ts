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

const WHITESPACE = /\s/
const LINE_TERMINATORS = new Set(['\n', '\r', ' ', ' '])
const TRIM_TRAILING_CHARS = new Set(['(', '[', '{', '\\', ':', '#', '=', '.'])
const SENTINEL_PREFIX = 'COMPLETE-STRING--'
const DECORATED_KEYWORDS = ['export', 'function', 'class']

function isDigit(ch: string | undefined) {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

/** End of a `COMPLETE-STRING--\d+--` sentinel starting at `index`, or -1. */
function sentinelEnd(content: string, index: number): number {
  if (!content.startsWith(SENTINEL_PREFIX, index)) return -1
  let end = index + SENTINEL_PREFIX.length
  if (!isDigit(content[end])) return -1
  while (isDigit(content[end])) end++
  return content.startsWith('--', end) ? end + 2 : -1
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
      while (end < content.length && content[end] !== ';' && !WHITESPACE.test(content[end])) {
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
    } else if (open && WHITESPACE.test(ch)) open = false
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
  let open = -1
  let close = -1
  for (let i = 0; i <= content.length; i++) {
    const ch = content[i]
    if (i === content.length || LINE_TERMINATORS.has(ch)) {
      if (close > open && open >= 0) return content.slice(open + 1, close)
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
  let out = ''
  let pos = 0
  while (true) {
    const start = content.indexOf(opener, pos)
    if (start < 0) break
    let bodyStart = start + opener.length
    if (tagEnd) {
      const end = content.indexOf(tagEnd, bodyStart)
      if (end < 0) break
      bodyStart = end + tagEnd.length
    }
    const close = content.indexOf(closer, bodyStart)
    if (close < 0) break
    out += content.slice(pos, start)
    pos = close + closer.length
  }
  return pos ? out + content.slice(pos) : content
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
  let out = ''
  let pos = 0
  let search = 0
  let matched = false
  while (true) {
    const start = content.indexOf('import', search)
    if (start < 0) break
    const lineEnd = lineEndOf(content, start)
    let end = -1
    for (let from = content.lastIndexOf('from', lineEnd - 4); from >= start + 6; from = content.lastIndexOf('from', from - 1)) {
      let index = from + 4
      while (index < content.length && WHITESPACE.test(content[index])) index++
      end = sentinelEnd(content, index)
      if (end >= 0) break
    }
    if (end < 0) {
      search = lineEnd
      continue
    }
    out += content.slice(pos, start)
    pos = search = end
    matched = true
  }
  return matched ? out + content.slice(pos) : content
}

/** `content.replace(/import\s*(?:COMPLETE-STRING--\d+--|\([^;\s]*\))/g, '')` */
export function removeImportCalls(content: string): string {
  const parens = new ParenRunScanner(content)
  let out = ''
  let pos = 0
  let search = 0
  let matched = false
  while (true) {
    const start = content.indexOf('import', search)
    if (start < 0) break
    let index = start + 6
    while (index < content.length && WHITESPACE.test(content[index])) index++
    let end = sentinelEnd(content, index)
    if (end < 0 && content[index] === '(') {
      const close = parens.closeOf(index)
      if (close >= 0) end = close + 1
    }
    if (end < 0) {
      search = start + 1
      continue
    }
    out += content.slice(pos, start)
    pos = search = end
    matched = true
  }
  return matched ? out + content.slice(pos) : content
}

/** `content.replace(/(?:require|import)\([^;\s]*\)/g, '')` */
export function removeRequireCalls(content: string): string {
  const parens = new ParenRunScanner(content)
  const callee = /(?:require|import)\(/g
  let out = ''
  let pos = 0
  let matched = false
  let match: RegExpExecArray | null
  while ((match = callee.exec(content)) !== null) {
    const paren = callee.lastIndex - 1
    const close = parens.closeOf(paren)
    if (close < 0) {
      callee.lastIndex = match.index + 1
      continue
    }
    out += content.slice(pos, match.index)
    pos = callee.lastIndex = close + 1
    matched = true
  }
  return matched ? out + content.slice(pos) : content
}

/**
 * `content.replace(/(?:@.*\n)+(?:export|function|class)/g, '')`: from an `@`
 * through the lines that start with `@` right after it, when the next line
 * starts with one of the keywords. Each `@…` segment must reach a `\n` with
 * no other line terminator in between. Every `@` on a line leads to the same
 * following lines, so the run of `@` lines is computed once per line.
 */
export function removeDecorators(content: string): string {
  if (!content.includes('@')) return content
  // Lines split at `\n` only; `lastBreak` is the last other line terminator.
  const starts = [0]
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') starts.push(i + 1)
  }
  const lineCount = starts.length
  const lastBreak = new Array<number>(lineCount).fill(-1)
  for (let line = 0; line < lineCount; line++) {
    const end = line + 1 < lineCount ? starts[line + 1] - 1 : content.length
    for (let i = starts[line]; i < end; i++) {
      if (LINE_TERMINATORS.has(content[i])) lastBreak[line] = i
    }
  }
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
  let out = ''
  let pos = 0
  let matched = false
  for (let line = 0; line + 1 < lineCount; line++) {
    const newline = starts[line + 1] - 1
    if (pos > newline) continue
    const at = content.indexOf('@', Math.max(pos, starts[line], lastBreak[line] + 1))
    if (at < 0 || at >= newline) continue
    const keywordStart = runEnd[line + 1]
    const keyword = DECORATED_KEYWORDS.find((each) => content.startsWith(each, keywordStart))
    if (!keyword) continue
    out += content.slice(pos, at)
    pos = keywordStart + keyword.length
    matched = true
    // The match may end mid-line; the rest of that line is scanned next.
    while (line + 1 < lineCount && starts[line + 1] <= pos) line++
    line--
  }
  return matched ? out + content.slice(pos) : content
}
