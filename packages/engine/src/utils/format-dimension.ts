/** Writes a number with its unit the way generated CSS does: `-0` as `0`, `0.5` as `.5`. */
export function formatDimension(value: number, unit: string) {
  return String(Object.is(value, -0) ? 0 : value).replace(/^(-?)0\./, '$1.') + unit
}

/**
 * Writes a 0–1 fraction as a CSS percentage by moving its decimal point two places, so `.14` is
 * `14%` rather than the binary product `14.000000000000002%`.
 */
export function formatFractionPercentage(fraction: number) {
  const [mantissa, exponent = '0'] = String(fraction).split('e')
  return formatDimension(Number(`${mantissa}e${Number(exponent) + 2}`), '%')
}
