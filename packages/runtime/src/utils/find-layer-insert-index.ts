import { getLayerRank } from '@stet-css/engine'

/**
 * Where a new layer block goes in the runtime sheet: before the first block of a later layer.
 * Without an earlier `@layer` statement, as in a shadow root, layers rank by first appearance,
 * so appending blocks in first-use order would let a component outrank a utility.
 */
export default function findLayerInsertIndex(rules: CSSRuleList, layerName: string) {
  const rank = getLayerRank(layerName)
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index]
    if (rule instanceof CSSLayerBlockRule && getLayerRank(rule.name) > rank) return index
  }
  return rules.length
}
