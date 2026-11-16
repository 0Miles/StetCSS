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

interface Group {
  open: number
  /** Patterns of the finished alternatives; zero until the group's first comma. */
  sum: number
  /** Patterns of the alternative being read. */
  product: number
  /** Whether a group closed inside this one, so its body cannot be a range. */
  nested: boolean
}

function createGroup(open: number): Group {
  return { open, sum: 0, product: 1, nested: false }
}

/** Counts with braces and commas as syntax outside escapes and, with `literalClasses`, outside `[...]`. */
function countExpansions(pattern: string, literalClasses: boolean) {
  const root = createGroup(-1)
  const groups = [root]
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]
    const group = groups[groups.length - 1]
    if (char === '\\') {
      index++
    } else if (literalClasses && char === '[') {
      index = findClassEnd(pattern, index)
    } else if (char === '{') {
      groups.push(createGroup(index))
    } else if (char === ',' && group !== root) {
      group.sum += group.product
      group.product = 1
    } else if (char === '}' && group !== root) {
      groups.pop()
      const parent = groups[groups.length - 1]
      // A lone alternative stays literal unless it is a range; groups nested in it still expand.
      const count = group.sum
        ? group.sum + group.product
        : group.nested ? group.product : countRange(pattern.slice(group.open + 1, index)) ?? 1
      parent.product *= count
      parent.nested = true
    }
  }
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
