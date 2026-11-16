/** Writes a number with its unit the way generated CSS does: `-0` as `0`, `0.5` as `.5`. */
export function formatDimension(value: number, unit: string) {
  return String(Object.is(value, -0) ? 0 : value).replace(/^(-?)0\./, '$1.') + unit
}
