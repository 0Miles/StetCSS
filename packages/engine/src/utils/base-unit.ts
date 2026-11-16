import { MASTER_CSS_LENGTH_UNITS } from '@stet-css/lexer'

/** The length one `x` stands for, parsed from the `baseUnit` setting. */
export interface BaseUnit {
  value: number
  unit: string
}

const BASE_UNIT_REGEX = new RegExp(`^(\\d+(?:\\.\\d+)?|\\.\\d+)(${MASTER_CSS_LENGTH_UNITS.join('|')})$`, 'i')
const parsedBaseUnits = new Map<string, BaseUnit | undefined>()

/**
 * Parses a `baseUnit` setting. Only a non-negative number followed by a CSS length unit, such as
 * `0.25rem` or `4px`, is a base unit; unitless numbers, percentages, and functions such as `var()`
 * or `calc()` are not.
 */
export function parseBaseUnit(value: unknown): BaseUnit | undefined {
  if (typeof value !== 'string') return
  if (parsedBaseUnits.has(value)) return parsedBaseUnits.get(value)
  const matches = BASE_UNIT_REGEX.exec(value.trim())
  const baseUnit = matches ? { value: Number(matches[1]), unit: matches[2].toLowerCase() } : undefined
  parsedBaseUnits.set(value, baseUnit)
  return baseUnit
}

export function assertBaseUnit(value: unknown): BaseUnit {
  const baseUnit = parseBaseUnit(value)
  if (!baseUnit) {
    throw new TypeError(`Invalid baseUnit setting ${JSON.stringify(value)}. Expected a CSS length such as 0.25rem or 4px.`)
  }
  return baseUnit
}

/** Resolves `<multiplier>x` to a length in the base unit's unit, for example `3x` with `0.25rem` → `.75rem`. */
export function formatBaseUnitMultiple(multiplier: number, baseUnitSetting: string) {
  const baseUnit = assertBaseUnit(baseUnitSetting)
  // 15 significant digits drop binary floating-point tails: 3 × 0.1 is 0.30000000000000004.
  const resolved = Number((multiplier * baseUnit.value).toPrecision(15))
  return String(Object.is(resolved, -0) ? 0 : resolved).replace(/^(-?)0\./, '$1.') + baseUnit.unit
}
