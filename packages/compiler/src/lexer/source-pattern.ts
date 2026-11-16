/**
 * Most patterns one `@source` or `@source not` pattern may expand into. Glob matching expands
 * every brace group up front, so twenty `{a,b}` groups already cost seconds and gigabytes.
 */
export const MAX_SOURCE_PATTERN_EXPANSIONS = 1024

const RANGE_BODY = /^(-?\d+|[a-zA-Z])\.\.(-?\d+|[a-zA-Z])(?:\.\.(-?\d+))?$/

function countRange(body: string) {
  const match = RANGE_BODY.exec(body)
  if (!match) return
  const [, from, to, step] = match
  const numeric = /\d/.test(from)
  if (numeric !== /\d/.test(to)) return
  const distance = numeric
    ? Math.abs(Number(to) - Number(from))
    : Math.abs(to.charCodeAt(0) - from.charCodeAt(0))
  return Math.floor(distance / (Math.abs(Number(step || 1)) || 1)) + 1
}

/**
 * Calls `visit` for each character outside escapes and `[...]` classes, where braces and commas
 * are syntax.
 */
function forEachSyntaxChar(pattern: string, visit: (char: string, index: number) => void) {
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]
    if (char === '\\') {
      index++
      continue
    }
    if (char === '[') {
      const close = pattern.indexOf(']', index + 2)
      if (close !== -1) {
        index = close
        continue
      }
    }
    visit(char, index)
  }
}

/** Closing index of every `{` that closes; an unclosed `{` stays literal. */
function matchBraces(pattern: string) {
  const closes = new Map<number, number>()
  const opens: number[] = []
  forEachSyntaxChar(pattern, (char, index) => {
    if (char === '{') {
      opens.push(index)
    } else if (char === '}' && opens.length) {
      closes.set(opens.pop()!, index)
    }
  })
  return closes
}

interface Group {
  open: number
  close: number
  /** Patterns of the finished alternatives. */
  sum: number
  /** Patterns of the alternative being read. */
  product: number
  alternatives: number
}

/**
 * How many patterns brace expansion turns `pattern` into, counting duplicates: `{a,b}` lists,
 * `{1..9}` ranges, and nested groups multiply out; a group with one alternative stays literal.
 * Reads the pattern in one pass without expanding it.
 */
export function countSourcePatternExpansions(pattern: string) {
  const closes = matchBraces(pattern)
  const root: Group = { open: -1, close: pattern.length, sum: 0, product: 1, alternatives: 1 }
  const groups = [root]
  forEachSyntaxChar(pattern, (char, index) => {
    const group = groups[groups.length - 1]
    if (char === '{') {
      const close = closes.get(index)
      if (close !== undefined) groups.push({ open: index, close, sum: 0, product: 1, alternatives: 1 })
    } else if (char === ',' && group !== root) {
      group.sum += group.product
      group.product = 1
      group.alternatives++
    } else if (char === '}' && index === group.close) {
      groups.pop()
      const count = group.alternatives === 1
        ? countRange(pattern.slice(group.open + 1, index)) ?? group.product
        : group.sum + group.product
      groups[groups.length - 1].product *= count
    }
  })
  return root.product
}
