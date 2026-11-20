import naturalCompare from './natural-compare'

/**
 * A query feature and the range it matches, in comparable units: lengths through
 * `toComparableQueryLength`, ratios through `toComparableQueryRatio`. An exclusive bound keeps its
 * value and sits one step inside it: `minStep` is 1 for `>` and `maxStep` is -1 for `<`; inclusive
 * and missing bounds have step 0. Steps only decide between bounds of equal value.
 */
export type QueryFeature = [name: string, min: number, max: number, minStep: number, maxStep: number]

/** One comparison in a query, such as `width>=600px`, with its value already comparable. */
export interface QueryFeatureBound {
  name: string
  operator?: string
  value: number
}

const UNBOUNDED_MIN = 0
const UNBOUNDED_MAX = Number.MAX_SAFE_INTEGER
/**
 * Comparable values are rounded to 1e-9 (rem for lengths), far below any written difference, so a
 * length written in a unit whose px ratio is inexact in binary (`cm`, `mm`, `Q`, `pt`) compares
 * equal to the same length in px or rem, and exclusivity decides between them.
 */
const COMPARABLE_VALUE_SCALE = 1e9

function roundComparableValue(value: number) {
  return Math.round(value * COMPARABLE_VALUE_SCALE) / COMPARABLE_VALUE_SCALE
}

/** Orders a ratio query such as `aspect-ratio>=16/9` by the quotient of its ratio. */
export function toComparableQueryRatio(value: string) {
  const [numerator, denominator] = value.split('/')
  return Number(numerator) / Number(denominator)
}

/**
 * Folds bounds into one range per feature, in the order features first appear. A later bound on
 * the same side replaces an earlier one; a bound whose value is not a number is skipped. Values
 * are rounded to `COMPARABLE_VALUE_SCALE`.
 */
export function toQueryFeatures(bounds: Iterable<QueryFeatureBound>): QueryFeature[] {
  const features = new Map<string, QueryFeature>()
  for (const { name, operator, value } of bounds) {
    if (Number.isNaN(value)) continue
    const feature = features.get(name) ?? [name, UNBOUNDED_MIN, UNBOUNDED_MAX, 0, 0]
    switch (operator) {
      case '>':
      case '>=':
        feature[1] = roundComparableValue(value)
        feature[3] = operator === '>' ? 1 : 0
        break
      case '<':
      case '<=':
        feature[2] = roundComparableValue(value)
        feature[4] = operator === '<' ? -1 : 0
        break
    }
    features.set(name, feature)
  }
  return [...features.values()]
}

/** Sorts features by name, keeping the written order of features that share one. */
export function sortQueryFeatures(features: QueryFeature[]) {
  return features.sort(([a], [b]) => naturalCompare(a, b))
}

/** Orders two bounds on one axis by value, then by step. */
function compareBound(valueA: number, stepA: number, valueB: number, stepB: number) {
  return valueA - valueB || stepA - stepB
}

/**
 * Orders two name-sorted feature lists so the query matching the wider range comes first and the
 * narrower one, which must win where both match, comes later.
 */
export function compareQueryFeatures(a: QueryFeature[], b: QueryFeature[]): number {
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i++) {
    const featureA = a[i]
    const featureB = b[i]
    if (!featureA) return -1
    if (!featureB) return 1
    const [nameA, minA, maxA, minStepA, maxStepA] = featureA
    const [nameB, minB, maxB, minStepB, maxStepB] = featureB
    const nameCmp = naturalCompare(nameA, nameB)
    if (nameCmp !== 0) return nameCmp
    const minCmp = compareBound(minA, minStepA, minB, minStepB)
    const maxCmp = compareBound(maxA, maxStepA, maxB, maxStepB)
    // The wider range first. When the ranges share a bound, the other bound alone decides, which
    // avoids subtracting a min from the unbounded max: at that magnitude the result rounds to a
    // whole number, and min-only queries less than 1 apart would tie.
    const widthCmp = maxCmp === 0
      ? minCmp
      : minCmp === 0
        ? -maxCmp
        : (maxB - minB) - (maxA - minA) || (maxStepB - minStepB) - (maxStepA - minStepA)
    if (widthCmp !== 0) return widthCmp
    // Equal widths: the range that starts higher first.
    if (minCmp !== 0) return -minCmp
  }
  return 0
}
