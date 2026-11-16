/**
 * Most patterns one `@source` or `@source not` pattern may expand into. Glob matching expands
 * every brace group up front, so twenty `{a,b}` groups already cost seconds and gigabytes.
 */
export const MAX_SOURCE_PATTERN_EXPANSIONS = 1024

function isIntegerText(text: string) {
  return Number.isInteger(+text)
}

/**
 * Length of a `{from..to}` or `{from..to..step}` range, by the rule fast-glob's expander applies:
 * two integers count numerically, anything else counts by the first character's code as long as
 * each non-integer end is a single character. Other bodies are not ranges and stay literal.
 */
function countRange(body: string) {
  const parts = body.split('..')
  if (parts.length < 2 || parts.length > 3 || parts.includes('')) return
  const [from, to, stepText = '1'] = parts
  if (!isIntegerText(stepText)) return
  const step = Math.max(Math.abs(Number(stepText)), 1)
  const numeric = isIntegerText(from) && isIntegerText(to)
  if (!numeric && [from, to].some((part) => !isIntegerText(part) && part.length > 1)) return
  const distance = numeric
    ? Math.abs(Number(to) - Number(from))
    : Math.abs(to.charCodeAt(0) - from.charCodeAt(0))
  return Math.floor(distance / step) + 1
}

/** Index of the `]` closing the class opened at `open`, or the last index when it never closes. */
function findClassEnd(pattern: string, open: number) {
  let depth = 1
  for (let index = open + 1; index < pattern.length; index++) {
    const char = pattern[index]
    if (char === '\\') index++
    else if (char === '[') depth++
    else if (char === ']' && --depth === 0) return index
  }
  return pattern.length - 1
}

/**
 * Calls `visit` for each character where braces and commas are syntax: outside escapes and, with
 * `literalClasses`, outside `[...]` classes.
 */
function forEachSyntaxChar(pattern: string, literalClasses: boolean, visit: (char: string, index: number) => void) {
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]
    if (char === '\\') index++
    else if (literalClasses && char === '[') index = findClassEnd(pattern, index)
    else visit(char, index)
  }
}

interface Group {
  open: number
  /** Patterns of the finished alternatives. */
  sum: number
  /** Patterns of the alternative being read. */
  product: number
  alternatives: number
}

function createGroup(open: number): Group {
  return { open, sum: 0, product: 1, alternatives: 1 }
}

function countExpansions(pattern: string, literalClasses: boolean) {
  const root = createGroup(-1)
  const groups = [root]
  forEachSyntaxChar(pattern, literalClasses, (char, index) => {
    const group = groups[groups.length - 1]
    if (char === '{') {
      groups.push(createGroup(index))
    } else if (char === ',' && group !== root) {
      group.sum += group.product
      group.product = 1
      group.alternatives++
    } else if (char === '}' && group !== root) {
      groups.pop()
      // A lone alternative stays literal unless it is a range; groups nested in it still expand.
      const count = group.alternatives === 1
        ? Math.max(countRange(pattern.slice(group.open + 1, index)) ?? 1, group.product)
        : group.sum + group.product
      groups[groups.length - 1].product *= count
    }
  })
  // A `{` that never closes is literal: its alternatives do not multiply, the groups in them do.
  return groups.reduceRight((inner, group) => Math.max(group.sum, 1) * group.product * inner, 1)
}

/**
 * Upper bound on the patterns brace expansion turns `pattern` into, read in one pass without
 * expanding it: `{a,b}` lists, `{1..9}` ranges, and nested groups multiply out. Duplicates count,
 * and the larger of two readings wins, because fast-glob keeps `[...]` classes literal while
 * `path.matchesGlob` expands braces inside them.
 */
export function countSourcePatternExpansions(pattern: string) {
  return Math.max(countExpansions(pattern, true), countExpansions(pattern, false))
}
