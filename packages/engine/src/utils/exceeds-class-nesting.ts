/**
 * The deepest bracket nesting a class may carry. Classes can come from untrusted markup, and parsing
 * nested values recurses with quadratic cost, so deeper classes are invalid.
 */
const MAX_CLASS_NESTING = 64

const CLOSERS: Record<string, string> = { '(': ')', '[': ']', '{': '}' }

/**
 * Whether `(`, `[`, and `{` outside quoted strings nest deeper than `MAX_CLASS_NESTING`.
 *
 * A closer only unwinds the bracket it matches, as the engine's parsers do, so a stray `]` in
 * `calc(]calc(]…` cannot hide nesting. Backslash escapes are honoured inside quotes only; escaped
 * brackets outside quotes still count.
 */
export default function exceedsClassNesting(className: string) {
  let quote = ''
  const expectedClosers: string[] = []
  for (let index = 0; index < className.length; index++) {
    const char = className[index]
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = ''
      }
    } else if (char === '"' || char === '\'') {
      quote = char
    } else if (char in CLOSERS) {
      if (expectedClosers.push(CLOSERS[char]) > MAX_CLASS_NESTING) return true
    } else if (char === expectedClosers[expectedClosers.length - 1]) {
      expectedClosers.pop()
    }
  }
  return false
}
