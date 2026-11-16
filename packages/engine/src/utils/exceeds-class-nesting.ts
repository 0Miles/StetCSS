/**
 * The deepest bracket nesting a class may carry. Classes can come from untrusted markup, and parsing
 * nested values recurses with quadratic cost, so deeper classes are invalid.
 */
const MAX_CLASS_NESTING = 64

/** Whether `(`, `[`, and `{` outside quoted strings nest deeper than `MAX_CLASS_NESTING`. */
export default function exceedsClassNesting(className: string) {
  let quote = ''
  let depth = 0
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
    } else if (char === '(' || char === '[' || char === '{') {
      if (++depth > MAX_CLASS_NESTING) return true
    } else if ((char === ')' || char === ']' || char === '}') && depth > 0) {
      depth--
    }
  }
  return false
}
