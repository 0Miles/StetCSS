import { ROOT_FONT_SIZE } from '../common'

// CSS fixes these absolute units against px (1in = 96px); rem and em count as rem.
const PX_PER_ABSOLUTE_UNIT: Record<string, number> = {
  px: 1,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
  pt: 96 / 72,
  pc: 16
}

/**
 * Resolves a query length to rem so rule priority can compare queries written in different units.
 * Query values keep the unit the author wrote; this is for ordering only, never for output.
 * Absolute units convert through their fixed px ratio, `em` counts as `rem` (a media query `em`
 * is the initial font size), and unitless numbers and other units (`vw`, `cqi`, …) stay as written.
 * Units are case-insensitive, as in CSS.
 */
export function toComparableQueryLength(value: number, unit = '') {
  const pxPerUnit = PX_PER_ABSOLUTE_UNIT[unit.toLowerCase()]
  return pxPerUnit === undefined ? value : value * pxPerUnit / ROOT_FONT_SIZE
}
