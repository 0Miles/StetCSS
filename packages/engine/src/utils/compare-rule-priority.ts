import { Utility } from '../utility'
import { ConditionNode } from './parse-condition'
import { SelectorNode } from './parse-selector'
import naturalCompare from './natural-compare'
import { toComparableQueryLength } from './query-length'
import { compareQueryFeatures, sortQueryFeatures, toComparableQueryRatio, toQueryFeatures, type QueryFeature, type QueryFeatureBound } from './query-features'

// ✅ RulePriority definition
export type RulePriority = {
  features?: QueryFeature[]
  selector: number
}

type ComparableRule = Pick<Utility, 'priority' | 'type' | 'key'> & Partial<Pick<Utility, 'conditions' | 'mode' | 'selectorNodes'>>

// ✅ Pseudo-class priority (lower = weaker)
const selectorPriority: Record<string, number> = {
  hover: 1,
  focus: 2,
  'focus-visible': 2,
  active: 3,
  disabled: 4,
}

function extractSelectorPriority(nodes: SelectorNode[] = []): number {
  let priority = 0
  for (const node of nodes) {
    if ('value' in node && typeof node.value === 'string') {
      priority += selectorPriority[node.value] ?? 0
    }
    if ('children' in node && Array.isArray(node.children)) {
      priority += extractSelectorPriority(node.children)
    }
  }
  return priority
}

const NOT_COMPARISON_OPERATORS = {
  '>=': '<',
  '<=': '>',
  '>': '<=',
  '<': '>=',
}

function getConditionBounds(nestNodes?: ConditionNode[]) {
  const bounds: QueryFeatureBound[] = []
  const walk = (list?: ConditionNode[], isOutsideNot = false) => {
    (list ?? []).forEach((node, i, arr) => {
      const prev = arr[i - 1]
      if ('operator' in node) {
        let operator = node.operator
        if (isOutsideNot)
          operator = NOT_COMPARISON_OPERATORS[operator as keyof typeof NOT_COMPARISON_OPERATORS]
        if (prev?.type === 'logical' && prev.value === 'not')
          operator = NOT_COMPARISON_OPERATORS[operator as keyof typeof NOT_COMPARISON_OPERATORS]
        bounds.push({
          name: node.name,
          operator,
          value: node.type === 'number'
            ? toComparableQueryLength(node.value, node.unit)
            : toComparableQueryRatio(node.value)
        })
      }
      if ('children' in node && Array.isArray(node.children)) {
        walk(node.children, prev?.type === 'logical' && prev.value === 'not')
      }
    })
  }
  walk(nestNodes)
  return bounds
}

// ✅ Calculate RulePriority from AST
export function calcRulePriority(rule: Utility): RulePriority {
  const features = sortQueryFeatures([
    ...toQueryFeatures(getConditionBounds(rule.conditions?.media)),
    ...toQueryFeatures(getConditionBounds(rule.conditions?.container))
  ])
  const selector = extractSelectorPriority(rule.selectorNodes ?? [])
  return {
    features,
    selector
  }
}

function getRuleSortTier(rule: ComparableRule): number {
  const hasSelector = rule.selectorNodes?.length
  const hasConditions = !!rule.conditions
  const hasMode = !!rule.mode
  if (hasConditions) return 3
  if (hasMode) return 2
  if (hasSelector) return 1
  return 0
}

// ✅ Compare function
export default function compareRulePriority(a: ComparableRule, b: ComparableRule): number {
  const aTier = getRuleSortTier(a)
  const bTier = getRuleSortTier(b)

  if (aTier !== bTier) return aTier - bTier

  // 1. features
  const fa = a.priority.features || []
  const fb = b.priority.features || []
  const featureCmp = compareQueryFeatures(fa, fb)
  if (featureCmp !== 0) return featureCmp

  // 2. selector
  const selectorCmp = a.priority.selector - b.priority.selector
  if (selectorCmp !== 0) return selectorCmp

  // 3. rule.type
  const typeCmp = a.type - b.type
  if (typeCmp !== 0) return typeCmp

  // 4. fallback: name
  return naturalCompare(a.key, b.key)
}
