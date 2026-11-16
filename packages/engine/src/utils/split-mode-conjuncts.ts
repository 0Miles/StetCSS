import { splitStetCSSTopLevel } from '@stet-css/lexer'
import { UndeclaredModeError, isUndeclaredPresetMode } from './undeclared-mode'

function splitTopLevel(token: string, separator: string) {
  return splitStetCSSTopLevel(token, separator).map(({ start, end }) => token.slice(start, end))
}

export interface ModeConjuncts {
  /** The `@` stack the token means: the token itself, or its rest followed by its modes. */
  tokens: string[]
  /**
   * A mode no single query or selector can express here: inside a `,` list (`sm,md&dark` reads
   * `sm or (md and dark)`) or negated (`!dark`), so the class or `@variant` is invalid.
   */
  inexpressibleMode?: string
}

/**
 * One `@` condition token as the stack it means once its modes are pulled out of an `&` list:
 * `sm&dark` is `sm@dark`, so a mode gets its mode selector or `prefers-color-scheme` query instead
 * of being read as part of the media query (`… and dark`). Undeclared preset modes are pulled out
 * too, so they reach the undeclared-mode error like `@dark`; a condition named like a mode stays.
 * Throws that error, naming `subject`, for an undeclared preset mode it cannot pull out.
 */
export default function splitModeConjuncts(
  token: string,
  css: { modes: readonly string[], conditions: { has(name: string): boolean } },
  subject: string
): ModeConjuncts {
  if (!/[&,!]/.test(token)) return { tokens: [token] }
  const isMode = (atom: string) => css.modes.includes(atom) || isUndeclaredPresetMode(atom, css)
  const conjuncts = splitTopLevel(token, '&')
  const alternatives = conjuncts.map((conjunct) => splitTopLevel(conjunct, ','))
  const hasList = alternatives.some((atoms) => atoms.length > 1)
  for (const atom of alternatives.flat()) {
    const bare = atom.replace(/^!+/, '')
    if (!isMode(bare) || !hasList && bare === atom) continue
    if (!css.modes.includes(bare)) throw new UndeclaredModeError(subject, bare, css.modes)
    return { tokens: [token], inexpressibleMode: bare }
  }
  const modes = conjuncts.filter(isMode)
  if (!modes.length) return { tokens: [token] }
  const rest = conjuncts.filter((conjunct) => !isMode(conjunct))
  return { tokens: rest.length ? [rest.join('&'), ...modes] : modes }
}
