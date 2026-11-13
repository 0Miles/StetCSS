// oxc-parser 0.137 overflows its native stack between 3,000 and 20,000 levels
// depending on the construct; this stays well below the shallowest.
const SCRIPT_NESTING_LIMIT = 1024

const LINE_FEED = 0x0A
const OPEN_PAREN = 0x28
const CLOSE_PAREN = 0x29
const COMMA = 0x2C
const SLASH = 0x2F
const SEMICOLON = 0x3B
const LESS_THAN = 0x3C
const EQUALS = 0x3D
const GREATER_THAN = 0x3E
const QUESTION = 0x3F
const OPEN_BRACKET = 0x5B
const CLOSE_BRACKET = 0x5D
const OPEN_BRACE = 0x7B
const CLOSE_BRACE = 0x7D

/**
 * Whether JS/TS source may nest deeper than 1024 levels, the point past which
 * callers must not hand it to a native parser: a native stack overflow kills
 * the host process and cannot be caught.
 *
 * A single lexical pass that ignores strings and comments. Each open `(`, `[`,
 * `{` (including `${`) is a level. Arrows (`=>`), conditionals (`?`) and angle
 * brackets (`<`, for JSX and type arguments) nest without a closing token, so
 * they count as a chain on the current bracket level: `</` takes one off, a `?`
 * replaces the `<` counted since the previous `?` (they are its condition's
 * comparisons), and the chain ends at the next newline, `,`, `;` or closing
 * bracket.
 */
export function exceedsScriptNestingLimit(content: string): boolean {
  // Per open bracket level: the chain length, and the `<` counted since its last `?`.
  const chains = [0]
  const angles = [0]
  let depth = 0
  for (let index = 0; index < content.length; index++) {
    const level = chains.length - 1
    switch (content.charCodeAt(index)) {
      case OPEN_PAREN:
      case OPEN_BRACKET:
      case OPEN_BRACE:
        chains.push(0)
        angles.push(0)
        depth++
        break
      case CLOSE_PAREN:
      case CLOSE_BRACKET:
      case CLOSE_BRACE:
        if (level > 0) {
          depth -= 1 + chains.pop()!
          angles.pop()
        }
        continue
      case LINE_FEED:
      case COMMA:
      case SEMICOLON:
        depth -= chains[level]
        chains[level] = 0
        angles[level] = 0
        continue
      case LESS_THAN:
        if (content.charCodeAt(index + 1) === SLASH) {
          if (chains[level] > 0) {
            chains[level]--
            depth--
          }
          if (angles[level] > 0) angles[level]--
          continue
        }
        chains[level]++
        angles[level]++
        depth++
        break
      case EQUALS:
        if (content.charCodeAt(index + 1) !== GREATER_THAN) continue
        index++
        chains[level]++
        depth++
        break
      case QUESTION:
        chains[level] += 1 - angles[level]
        depth += 1 - angles[level]
        angles[level] = 0
        break
      default:
        continue
    }
    if (depth > SCRIPT_NESTING_LIMIT) return true
  }
  return false
}
