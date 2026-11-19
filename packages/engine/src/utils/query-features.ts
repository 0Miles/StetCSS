import naturalCompare from './natural-compare'

/**
 * A query feature and the range it matches, in comparable units: lengths through
 * `toComparableQueryLength`, ratios through `toComparableQueryRatio`.
 */
export type QueryFeature = [name: string, min: number, max: number]

/** One comparison in a query, such as `width>=600px`, with its value already comparable. */
export interface QueryFeatureBound {
  name: string
  operator?: string
  value: number
}

const UNBOUNDED_MIN = 0
const UNBOUNDED_MAX = Number.MAX_SAFE_INTEGER
/** Moves an exclusive bound inside its value, so `>600px` ranks narrower than `>=600px`. */
const EXCLUSIVE_BOUND_OFFSET = 0.02

/** Orders a ratio query such as `aspect-ratio>=16/9` by the quotient of its ratio. */
export function toComparableQueryRatio(value: string) {
  const [numerator, denominator] = value.split('/')
  return Number(numerator) / Number(denominator)
}

/**
 * Folds bounds into one range per feature, in the order features first appear. A later bound on
 * the same side replaces an earlier one; a bound whose value is not a number is skipped.
 */
export function toQueryFeatures(bounds: Iterable<QueryFeatureBound>): QueryFeature[] {
  const ranges = new Map<string, { min?: number, max?: number }>()
  for (const { name, operator, value } of bounds) {
    if (Number.isNaN(value)) continue
    const range = ranges.get(name) ?? {}
    switch (operator) {
      case '>':
        range.min = value + EXCLUSIVE_BOUND_OFFSET
        break
      case '>=':
        range.min = value
        break
      case '<':
        range.max = value - EXCLUSIVE_BOUND_OFFSET
        break
      case '<=':
        range.max = value
        break
    }
    ranges.set(name, range)
  }
  return [...ranges].map(([name, { min, max }]) => [name, min ?? UNBOUNDED_MIN, max ?? UNBOUNDED_MAX])
}

/** Sorts features by name, keeping the written order of features that share one. */
export function sortQueryFeatures(features: QueryFeature[]) {
  return features.sort(([a], [b]) => naturalCompare(a, b))
}

/**
 * Puts the wider range first. When the ranges share a bound, the other bound alone decides:
 * subtracting a min from the unbounded max rounds to a whole number at that magnitude, so min-only
 * queries less than 1 apart would tie and fall through to the larger-min-first tiebreak.
 */
function compareRangeWidth(minA: number, maxA: number, minB: number, maxB: number) {
  if (maxA === maxB) return minA - minB
  if (minA === minB) return maxB - maxA
  return (maxB - minB) - (maxA - minA)
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
    const [nameA, minA, maxA] = featureA
    const [nameB, minB, maxB] = featureB
    const nameCmp = naturalCompare(nameA, nameB)
    if (nameCmp !== 0) return nameCmp
    const widthCmp = compareRangeWidth(minA, maxA, minB, maxB)
    if (widthCmp !== 0) return widthCmp
    if (minA !== minB) return minB - minA
    if (maxA !== maxB) return maxB - maxA
  }
  return 0
}
