import { PRESET_MODES } from './undeclared-mode'

/** Splits at `char` outside parentheses and quotes. */
function splitTopLevel(token: string, char: string) {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let index = 0; index < token.length; index++) {
    const each = token[index]
    if (quote) {
      if (each === '\\') index++
      else if (each === quote) quote = ''
    } else if (each === '\'' || each === '"') {
      quote = each
    } else if (each === '(') {
      depth++
    } else if (each === ')') {
      depth--
    } else if (each === char && !depth) {
      parts.push(token.slice(start, index))
      start = index + 1
    }
  }
  parts.push(token.slice(start))
  return parts
}

/**
 * One `@` condition token as the stack it means once its modes are pulled out of an `&` list:
 * `sm&dark` is `sm@dark`, so a mode gets its mode selector or `prefers-color-scheme` query instead
 * of being read as part of the media query (`… and dark`). Preset modes are pulled out even when
 * undeclared, so they reach the undeclared-mode error like `@dark`. A token with a top-level `,`
 * stays whole: `sm,md&dark` reads `sm or (md and dark)`.
 */
export default function splitModeConjuncts(token: string, modes: readonly string[]): string[] {
  if (!token.includes('&')) return [token]
  const parts = splitTopLevel(token, '&')
  if (parts.some((part) => splitTopLevel(part, ',').length > 1)) return [token]
  const isMode = (part: string) => modes.includes(part) || PRESET_MODES.includes(part)
  const modeParts = parts.filter(isMode)
  if (!modeParts.length) return [token]
  const rest = parts.filter((part) => !isMode(part))
  return rest.length ? [rest.join('&'), ...modeParts] : modeParts
}
