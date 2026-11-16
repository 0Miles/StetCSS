import type { PropertiesHyphen } from 'csstype'
import type { UtilityType } from './utility-type.js'

export type StetCSSManifestConditionIdentifier = 'container' | 'starting-style' | 'supports' | 'media' | 'layer'
export type StetCSSManifestUtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'
export type StetCSSManifestDefaultMode = 'light' | 'dark' | 'none' | string
export type StetCSSManifestModeTrigger = 'class' | 'media' | 'host'
export type StetCSSManifestVariantToken = `:${string}` | `::${string}` | `@${string}`
export type StetCSSManifestUtilityKind = 'number' | 'color' | 'image'
/** Defaults to single for variable/value matchers; multiple is an explicit opt-in. */
export type StetCSSManifestUtilityMatcherValueSegments = 'single' | 'multiple'

export type StetCSSManifestCSSDeclarationPrimitive = string | number | null
export type StetCSSManifestCSSDeclarations = PropertiesHyphen | Record<string, StetCSSManifestCSSDeclarationPrimitive | StetCSSManifestCSSDeclarationPrimitive[]>
export type StetCSSManifestVariableValue = number | string | false | (number | string)[]
export type StetCSSManifestVariableType = 'number' | 'string'
export interface StetCSSManifestVariableNumericValue {
  value: number
  unit?: string
}

export interface StetCSSManifestConditionBooleanNode { raw?: string, name: string, type: 'boolean' }
export interface StetCSSManifestConditionNumberNode { raw?: string, name?: string, type: 'number', value: number, unit?: string, operator?: string }
export interface StetCSSManifestConditionStringNode { raw?: string, name?: string, type: 'string', value: string }
export type StetCSSManifestConditionValueNode = StetCSSManifestConditionNumberNode | StetCSSManifestConditionStringNode
export interface StetCSSManifestConditionComparisonOperatorNode { type: 'comparison', raw?: string, value: string }
export interface StetCSSManifestConditionLogicalOperatorNode { type: 'logical', raw?: string, value: string }
export type StetCSSManifestConditionOperatorNode = StetCSSManifestConditionComparisonOperatorNode | StetCSSManifestConditionLogicalOperatorNode
export interface StetCSSManifestConditionGroupNode { type?: 'group', raw?: string, children: StetCSSManifestConditionNode[] }
export type StetCSSManifestConditionNode =
  | StetCSSManifestConditionBooleanNode
  | StetCSSManifestConditionValueNode
  | StetCSSManifestConditionComparisonOperatorNode
  | StetCSSManifestConditionLogicalOperatorNode
  | StetCSSManifestConditionGroupNode

export interface StetCSSManifestCondition {
  id: StetCSSManifestConditionIdentifier
  nodes: StetCSSManifestConditionNode[]
}

export type StetCSSManifestConditions = Record<string, StetCSSManifestCondition>

export interface StetCSSManifestSelectorLiteralNode {
  type?: 'attribute' | 'pseudo-class' | 'pseudo-element' | 'class' | 'universal' | 'id'
  raw?: string
  value?: string
  children?: StetCSSManifestSelectorNode[]
}

export interface StetCSSManifestSelectorSeparatorNode {
  type: 'separator'
  raw?: string
  value: string
}

export interface StetCSSManifestSelectorCombinatorNode {
  type: 'combinator'
  raw?: string
  value: string
}

export type StetCSSManifestSelectorNode =
  | StetCSSManifestSelectorLiteralNode
  | StetCSSManifestSelectorCombinatorNode
  | StetCSSManifestSelectorSeparatorNode

export type StetCSSManifestSelectors = Record<string, StetCSSManifestSelectorNode[]>

export interface StetCSSManifestSettings {
  /** The length one `x` stands for, as a CSS length such as `0.25rem` or `4px`. */
  baseUnit?: string
  defaultMode?: StetCSSManifestDefaultMode
  scope?: string
  important?: boolean
  modeTrigger?: StetCSSManifestModeTrigger
  modes?: string[]
}

export interface StetCSSManifestVariable {
  name?: string
  key: string
  namespace?: string
  type?: StetCSSManifestVariableType
  value?: StetCSSManifestVariableValue
  numeric?: StetCSSManifestVariableNumericValue
  modes?: Record<string, { type: StetCSSManifestVariableType, value: number | string, numeric?: StetCSSManifestVariableNumericValue }>
  dependencies?: string[]
  mode?: string
  inline?: boolean
  static?: boolean
}

export type StetCSSManifestVariables = Record<string, StetCSSManifestVariable[]>
export type StetCSSManifestVariableEntry = StetCSSManifestVariable & {
  name: string
  namespace?: string
  type: StetCSSManifestVariableType
}

export type StetCSSManifestKeyframes<TDeclarations = StetCSSManifestCSSDeclarations> = Record<'from' | 'to' | string, TDeclarations>
export type StetCSSManifestAnimations<TDeclarations = StetCSSManifestCSSDeclarations> = Record<string, StetCSSManifestKeyframes<TDeclarations>>
export type StetCSSManifestAnimationOptions = Record<string, { static?: boolean }>

export interface StetCSSManifestVariantBranch {
  selector?: string
  selectorNodes?: StetCSSManifestSelectorNode[]
  conditions?: string[]
  conditionNodes?: StetCSSManifestCondition[]
  layer?: StetCSSManifestUtilityLayerName
}

export interface StetCSSManifestVariant {
  token: StetCSSManifestVariantToken
  branches: StetCSSManifestVariantBranch[]
}

export type StetCSSManifestVariants = StetCSSManifestVariant[]

export type StetCSSManifestUtilityMatcher =
  | { type: 'static'; name: string }
  | { type: 'pattern'; prefix: string; values: string[]; valueMap?: Record<string, string> }
  | { type: 'key'; keys: string[] }
  | { type: 'variable'; keys: string[]; segments?: StetCSSManifestUtilityMatcherValueSegments }
  | { type: 'value'; keys: string[]; segments?: StetCSSManifestUtilityMatcherValueSegments }

export type StetCSSManifestVariableAlias = [key: string, name: string]
export type StetCSSManifestVariableAliasSet = StetCSSManifestVariableAlias[]

export type StetCSSManifestUtilityEmit =
  | { type: 'declarations'; declarations: string[] }
  | { type: 'template'; declarations: StetCSSManifestCSSDeclarations }
  | { type: 'property'; property: string }
  | { type: 'static'; rules: StetCSSManifestUtilityRule[] }

export interface StetCSSManifestUtilityRule<TDeclarations = StetCSSManifestCSSDeclarations> {
  declarations: TDeclarations
  conditions?: string[]
  selector?: string
}

export interface StetCSSManifestUtility {
  id: string
  name?: string
  type: UtilityType
  order?: number
  layer?: StetCSSManifestUtilityLayerName
  key?: string
  subkey?: string
  keys?: string[]
  aliasGroups?: string[]
  kind?: StetCSSManifestUtilityKind
  namespaces?: string[]
  implicitNamespace?: boolean
  separators?: string[]
  conditions?: string[]
  variableAliases?: StetCSSManifestVariableAliasSet
  variableAliasRefs?: string[]
  emit: StetCSSManifestUtilityEmit
  matchers: StetCSSManifestUtilityMatcher[]
  debug?: Record<string, unknown>
}

export type StetCSSManifestUtilities = StetCSSManifestUtility[]

export interface StetCSSManifest {
  /**
   * StetCSSManifest IR schema/codec version.
   * This is not a legacy Config compatibility marker; engines must reject
   * unsupported manifest versions instead of migrating authoring APIs at runtime.
   */
  version: 1
  settings?: StetCSSManifestSettings
  variables?: StetCSSManifestVariables
  animations?: StetCSSManifestAnimations
  animationOptions?: StetCSSManifestAnimationOptions
  variants?: StetCSSManifestVariants
  conditions?: StetCSSManifestConditions
  breakpointConditions?: StetCSSManifestConditions
  containerConditions?: StetCSSManifestConditions
  selectors?: StetCSSManifestSelectors
  utilities?: StetCSSManifestUtilities
  debug?: Record<string, unknown>
}

export function getStetCSSManifestVariableName(namespace: string, variable: Pick<StetCSSManifestVariable, 'key' | 'name'>) {
  return variable.name || (namespace ? `${namespace}${variable.key ? '-' + variable.key : ''}` : variable.key)
}

export function flattenStetCSSManifestVariables(
  variables: StetCSSManifestVariables | undefined
): StetCSSManifestVariableEntry[] {
  const flattened: StetCSSManifestVariableEntry[] = []
  for (const [namespace, definitions] of Object.entries(variables || {})) {
    for (const definition of definitions) {
      const type = definition.type || (typeof definition.value === 'number' ? 'number' : 'string')
      flattened.push({
        ...definition,
        name: getStetCSSManifestVariableName(namespace, definition),
        ...(namespace ? { namespace } : {}),
        type
      })
    }
  }
  return flattened
}

export function groupStetCSSManifestVariables(
  variables: readonly StetCSSManifestVariable[] | undefined
): StetCSSManifestVariables | undefined {
  if (!variables?.length) return
  const grouped: StetCSSManifestVariables = {}
  for (const variable of variables) {
    const namespace = variable.namespace || ''
    const group = grouped[namespace] ||= []
    const { namespace: _namespace, ...definition } = variable
    group.push(definition)
  }
  return Object.keys(grouped).length ? grouped : undefined
}
