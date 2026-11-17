import StetCSS from './core'
import parseCondition from './utils/parse-condition'
import generateCondition from './utils/generate-condition'
import parseSelector from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import compareRulePriority from './utils/compare-rule-priority'
import type { Utility } from './utility'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import type { StetCSSEmittedGlobals } from './emitted-globals'
import type { StetCSSOptions } from './core'
import { ROOT_FONT_SIZE } from './common'
import { parseBaseUnit } from './utils/base-unit'
import { formatDimension, formatFractionPercentage } from './utils/format-dimension'
import { PRESET_MODES, UndeclaredModeError, isUndeclaredPresetMode } from './utils/undeclared-mode'
import splitModeConjuncts from './utils/split-mode-conjuncts'
import joinConditionNodes from './utils/join-condition-nodes'

export { StetCSS, ROOT_FONT_SIZE, PRESET_MODES, UndeclaredModeError, compareRulePriority, formatDimension, formatFractionPercentage, generateCondition, generateSelector, isUndeclaredPresetMode, joinConditionNodes, parseBaseUnit, parseCondition, parseSelector, splitModeConjuncts }
export type { Utility as GeneratedRule }
export type * from '@stet-css/schema/manifest'

export function createCompilerCSS(manifest: StetCSSManifest, emittedGlobals?: StetCSSEmittedGlobals, options?: StetCSSOptions) {
  return StetCSS.create({
    manifest,
    emittedGlobals,
    ...options
  })
}

export function expandClassName(manifest: StetCSSManifest, className: string, mode?: string) {
  return createCompilerCSS(manifest).createRules(className, undefined, mode)
}

export function inspectGeneratedRule(rule: Utility) {
  return {
    className: rule.name,
    key: rule.key,
    layer: rule.layerName,
    explicitLayer: rule.explicitLayerName,
    selector: rule.selectorText,
    declarations: rule.declarations,
    declarationRules: rule.declarationRules,
    conditions: rule.conditions,
    priority: rule.priority,
    variableNames: rule.variableNames ? [...rule.variableNames] : [],
    animationNames: rule.animationNames ? [...rule.animationNames] : []
  }
}
