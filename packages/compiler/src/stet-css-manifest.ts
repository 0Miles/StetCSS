import UtilityType from '@stet-css/schema/utility-type'
import type {
  CSSDirectiveManifestInput as SharedCSSDirectiveManifestInput,
  CSSDirectiveUtilityDefinition,
  CSSDirectiveUtilityDynamicDefinition,
  CSSDirectiveUtilityPatternDefinition,
  CSSDirectiveUtilityRuleDefinition,
  CSSDirectiveVariableDefinition
} from '@stet-css/schema/css-directives'
import type {
  StetCSSManifest,
  StetCSSManifestAnimations,
  StetCSSManifestCondition,
  StetCSSManifestConditionNode,
  StetCSSManifestConditions,
  StetCSSManifestCSSDeclarationPrimitive,
  StetCSSManifestCSSDeclarations,
  StetCSSManifestSelectorNode,
  StetCSSManifestSelectors,
  StetCSSManifestUtility,
  StetCSSManifestUtilityRule,
  StetCSSManifestUtilityMatcher,
  StetCSSManifestVariableNumericValue,
  StetCSSManifestVariable,
  StetCSSManifestVariables,
  StetCSSManifestVariant,
  StetCSSManifestVariantBranch,
  StetCSSManifestVariants
} from '@stet-css/schema/manifest'
import { flattenStetCSSManifestVariables, groupStetCSSManifestVariables } from '@stet-css/schema/manifest'
import { STET_CSS_LENGTH_UNITS } from '@stet-css/lexer'
import {
  createCompilerCSS,
  parseCondition,
  parseSelector
} from '@stet-css/engine/compiler'
import {
  addCompilerDiagnosticCount,
  setCompilerDiagnosticCount,
  timeCompilerDiagnostic,
  type CompilerDiagnosticRecorder
} from './diagnostics'
import { builtinNamespaces } from '@stet-css/engine'
import { isNativeCSSShorthandProperty } from '@stet-css/schema/native-css-shorthand'
import { normalizeStylesheetValue } from './stylesheet-value'

export type CSSDirectiveManifestInput = SharedCSSDirectiveManifestInput

export interface CreateStetCSSManifestOptions {
  baseManifest?: StetCSSManifest
  diagnostics?: CompilerDiagnosticRecorder
}

const NUMERIC_THEME_NAMESPACES = new Set(['font-size', 'radius', 'spacing', 'breakpoint', 'container'])
const UNITFUL_NUMERIC_TOKEN = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)?$/
const CONDITION_LENGTH_TOKEN = new RegExp(`^([+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+))(${STET_CSS_LENGTH_UNITS.join('|')})?$`, 'i')

export interface ResolvedCSSDirectiveVariableName {
  name: string
  key: string
  namespace?: string
}

export type CSSDirectiveVariableNameResolver = (variable: CSSDirectiveVariableDefinition) => ResolvedCSSDirectiveVariableName
type StetCSSManifestVariableDraft = StetCSSManifestVariable & { namespace?: string }

function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => clone(item)) as T
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const key in value as Record<string, unknown>) {
      result[key] = clone((value as Record<string, unknown>)[key])
    }
    return result as T
  }
  return value
}

function normalizeZero<T>(value: T): T {
  return Object.is(value, -0) ? 0 as T : value
}

function addVariableNamespace(namespaces: Set<string>, namespace: unknown) {
  if (typeof namespace === 'string' && namespace) namespaces.add(namespace)
}

function addVariableAliasRefNamespace(namespaces: Set<string>, ref: unknown) {
  if (typeof ref === 'string' && (ref[0] === '=' || ref[0] === '~')) {
    addVariableNamespace(namespaces, ref.slice(1))
  }
}

function addImplicitUtilityNamespace(namespaces: Set<string>, value: unknown) {
  if (typeof value !== 'string' || !value || value[0] === '.' || value.includes('()')) return
  addVariableNamespace(namespaces, value)
}

function addUtilityVariableNamespaces(namespaces: Set<string>, utilities: (Partial<StetCSSManifestUtility> | CSSDirectiveUtilityDefinition)[] | undefined) {
  for (const utility of utilities || []) {
    for (const namespace of (utility as Partial<StetCSSManifestUtility>).namespaces || []) {
      addVariableNamespace(namespaces, namespace)
    }
    for (const ref of (utility as Partial<StetCSSManifestUtility>).variableAliasRefs || []) {
      addVariableAliasRefNamespace(namespaces, ref)
    }
    if (
      (utility as Partial<StetCSSManifestUtility>).implicitNamespace !== false
      && (utility as Partial<StetCSSManifestUtility>).emit?.type === 'property'
    ) {
      addImplicitUtilityNamespace(namespaces, (utility as Partial<StetCSSManifestUtility>).id)
      addImplicitUtilityNamespace(namespaces, utility.name)
    }
  }
}

function collectVariableNamespaces(input: CSSDirectiveManifestInput = {}, options: CreateStetCSSManifestOptions = {}) {
  const namespaces = new Set<string>(builtinNamespaces)
  for (const variable of flattenStetCSSManifestVariables(options.baseManifest?.variables)) {
    addVariableNamespace(namespaces, variable.namespace)
  }
  for (const variable of input.variables || []) {
    addVariableNamespace(namespaces, variable.namespace)
  }
  addUtilityVariableNamespaces(namespaces, options.baseManifest?.utilities)
  addUtilityVariableNamespaces(namespaces, input.utilities)
  return [...namespaces].sort((a, b) => b.length - a.length || a.localeCompare(b))
}

function resolveVariableName(variable: CSSDirectiveVariableDefinition, namespaces: string[]): ResolvedCSSDirectiveVariableName {
  const explicitName = variable.name?.replace(/^--/, '')
  if (variable.namespace || variable.key !== undefined) {
    const key = variable.key ?? explicitName ?? ''
    const name = variable.namespace
      ? `${variable.namespace}${key ? '-' + key : ''}`
      : key
    return {
      name,
      key,
      ...(variable.namespace ? { namespace: variable.namespace } : {})
    }
  }
  const name = explicitName || ''
  const namespace = namespaces.find((eachNamespace) => name.startsWith(eachNamespace + '-'))
  return namespace
    ? {
      name,
      namespace,
      key: name.slice(namespace.length + 1)
    }
    : {
      name,
      key: name
    }
}

export function createVariableNameResolver(input: CSSDirectiveManifestInput = {}, options: CreateStetCSSManifestOptions = {}): CSSDirectiveVariableNameResolver {
  const namespaces = collectVariableNamespaces(input, options)
  return (variable) => resolveVariableName(variable, namespaces)
}

function getVariableType(value: StetCSSManifestVariable['value']): NonNullable<StetCSSManifestVariable['type']> {
  return typeof value === 'number' ? 'number' : 'string'
}

function getVariableNumericValue(
  value: StetCSSManifestVariable['value'],
  namespace: string | undefined
): StetCSSManifestVariableNumericValue | undefined {
  if (!namespace || !NUMERIC_THEME_NAMESPACES.has(namespace)) return
  if (typeof value === 'number') {
    return { value }
  }
  if (typeof value !== 'string') return
  const match = UNITFUL_NUMERIC_TOKEN.exec(value.trim())
  if (!match) return
  return {
    value: Number(match[1]),
    ...(match[2] ? { unit: match[2] } : {})
  }
}

function variableSlot(variable: Pick<StetCSSManifestVariable, 'name' | 'namespace' | 'key'>) {
  return variable.name || `${variable.namespace || ''}\0${variable.key}`
}

function pushVariable(target: StetCSSManifestVariableDraft[], variable: StetCSSManifestVariableDraft) {
  const slot = variableSlot(variable)
  const existing = target.find((eachVariable) => variableSlot(eachVariable) === slot)
  if (existing) {
    Object.assign(existing, variable)
  } else {
    target.push(variable)
  }
}

function compileVariables(
  input: CSSDirectiveVariableDefinition[] | undefined,
  resolveVariableName: CSSDirectiveVariableNameResolver
): StetCSSManifestVariableDraft[] | undefined {
  if (!input?.length) return
  const variables: StetCSSManifestVariableDraft[] = []
  const byName = new Map<string, StetCSSManifestVariableDraft>()

  for (const definition of input) {
    const resolved = resolveVariableName(definition)
    if (!resolved.name) continue
    const rawValue = normalizeZero(definition.value)
    const normalized = typeof rawValue === 'string' || typeof rawValue === 'number'
      ? normalizeStylesheetValue(rawValue, { replacePipes: true })
      : { value: rawValue, dependencies: new Set<string>() }
    const value = typeof rawValue === 'number'
      ? rawValue
      : normalized.value
    const numeric = getVariableNumericValue(value, resolved.namespace)
    const type = numeric ? 'number' : getVariableType(value)
    const dependencies = normalized.dependencies

    if (definition.mode) {
      let target = byName.get(resolved.name)
      if (!target) {
        target = {
          name: resolved.name,
          key: resolved.key,
          ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
          type,
          modes: {},
          ...(definition.static ? { static: true } : {})
        }
        byName.set(resolved.name, target)
        pushVariable(variables, target)
      }
      if (definition.static) target.static = true
      target.modes ??= {}
      target.modes[definition.mode] = {
        type,
        value: value as string | number,
        ...(numeric ? { numeric } : {})
      }
      if (dependencies.size) {
        const next = new Set([...(target.dependencies || []), ...dependencies])
        target.dependencies = [...next]
      }
      continue
    }

    const variable: StetCSSManifestVariableDraft = {
      name: resolved.name,
      key: resolved.key,
      ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
      type,
      value,
      ...(numeric ? { numeric } : {}),
      ...(dependencies.size ? { dependencies: [...dependencies] } : {}),
      ...(definition.inline ? { inline: true } : {}),
      ...(definition.static ? { static: true } : {})
    }
    byName.set(resolved.name, variable)
    pushVariable(variables, variable)
  }

  return variables.length ? variables : undefined
}

// Breakpoint and container tokens keep the value and unit as written, like a native query. Only a
// number with an optional length unit is a breakpoint or container size; other values (`50%`,
// `calc()`, `var()`, `2s`) produce no condition, so `@name` falls back to a named container.
function createVariableCondition(variable: StetCSSManifestVariable, id: 'media' | 'container'): StetCSSManifestCondition | undefined {
  if (variable.key.startsWith('-')) return
  let value: number
  let unit: string | undefined
  if (typeof variable.value === 'number') {
    value = variable.value
  } else {
    const match = CONDITION_LENGTH_TOKEN.exec(String(variable.value).trim())
    if (!match) return
    value = Number(match[1])
    unit = match[2]
  }
  return {
    id,
    nodes: [{
      type: 'number',
      value,
      ...(unit ? { unit } : {})
    }]
  }
}

function compileConditions(variables: StetCSSManifestVariableDraft[] | undefined) {
  const conditions: StetCSSManifestConditions = {}
  const breakpointConditions: StetCSSManifestConditions = {}
  const containerConditions: StetCSSManifestConditions = {}

  for (const variable of variables || []) {
    if (variable.namespace === 'breakpoint') {
      const condition = createVariableCondition(variable, 'media')
      if (condition) {
        conditions[variable.key] = condition
        breakpointConditions[variable.key] = condition
      }
    } else if (variable.namespace === 'container') {
      const condition = createVariableCondition(variable, 'container')
      if (condition) {
        containerConditions[variable.key] = condition
      }
    }
  }

  return {
    conditions: Object.keys(conditions).length ? conditions : undefined,
    breakpointConditions: Object.keys(breakpointConditions).length ? breakpointConditions : undefined,
    containerConditions: Object.keys(containerConditions).length ? containerConditions : undefined
  }
}

function cloneConditionNode(node: StetCSSManifestConditionNode): StetCSSManifestConditionNode {
  return 'children' in node
    ? { ...node, children: node.children.map(cloneConditionNode) }
    : { ...node }
}

function cloneCondition(condition: StetCSSManifestCondition): StetCSSManifestCondition {
  return {
    id: condition.id,
    nodes: condition.nodes.map(cloneConditionNode)
  }
}

function cloneSelectorNode(node: StetCSSManifestSelectorNode): StetCSSManifestSelectorNode {
  return 'children' in node && node.children?.length
    ? { ...node, children: node.children.map(cloneSelectorNode) }
    : { ...node }
}

function compileVariantBranch(branch: StetCSSManifestVariantBranch, css: ReturnType<typeof createCompilerCSS>): StetCSSManifestVariantBranch {
  const selector = branch.selector?.trim()
  const bodylessSelector = selector
    ? selector.includes('&')
      ? selector.replace(/&/g, '')
      : selector
    : undefined
  const selectorNodes = branch.selectorNodes?.length
    ? branch.selectorNodes.map(cloneSelectorNode)
    : bodylessSelector
      ? parseSelector(bodylessSelector, css, false).map((node) => cloneSelectorNode(node as StetCSSManifestSelectorNode))
      : undefined
  const conditionNodes = branch.conditionNodes?.length
    ? branch.conditionNodes.map(cloneCondition)
    : branch.conditions?.length
      ? branch.conditions.map((condition) => cloneCondition(parseCondition(condition, css, false) as StetCSSManifestCondition))
      : undefined
  return {
    ...branch,
    ...(selectorNodes?.length ? { selectorNodes } : {}),
    ...(branch.conditions?.length ? { conditions: [...branch.conditions] } : {}),
    ...(conditionNodes?.length ? { conditionNodes } : {})
  }
}

function compileVariants(input: StetCSSManifestVariants | undefined, baseManifest: StetCSSManifest): {
  variants?: StetCSSManifestVariants
  selectors?: StetCSSManifestSelectors
  conditions?: StetCSSManifestConditions
} {
  if (!input?.length) return {}
  const css = createCompilerCSS(baseManifest)
  const variants: StetCSSManifestVariant[] = []
  const selectors: StetCSSManifestSelectors = {}
  const conditions: StetCSSManifestConditions = {}
  for (const variant of input) {
    const branches = variant.branches.map((branch) => compileVariantBranch(branch, css))
    variants.push({
      token: variant.token,
      branches
    })
    if (variant.token.startsWith(':')) {
      const firstSelectorNodes = branches.find((branch) => branch.selectorNodes?.length)?.selectorNodes
      if (firstSelectorNodes?.length) selectors[variant.token] = firstSelectorNodes.map(cloneSelectorNode)
    }
    if (variant.token.startsWith('@')) {
      const firstCondition = branches.find((branch) => branch.conditionNodes?.length)?.conditionNodes?.[0]
      if (firstCondition) {
        conditions[variant.token.slice(1)] = cloneCondition(firstCondition)
      } else {
        const firstLayer = branches.find((branch) => branch.layer)?.layer
        if (firstLayer) {
          conditions[variant.token.slice(1)] = {
            id: 'layer',
            nodes: [{
              type: 'string',
              value: firstLayer
            }]
          }
        }
      }
    }
  }
  return {
    variants,
    ...(Object.keys(selectors).length ? { selectors } : {}),
    ...(Object.keys(conditions).length ? { conditions } : {})
  }
}

function cloneDeclarations<T extends StetCSSManifestCSSDeclarations>(declarations: T): T {
  return Array.isArray(declarations)
    ? [...declarations] as unknown as T
    : { ...(declarations as object) } as T
}

function assertNoValuePlaceholder(declarations: CSSDirectiveUtilityRuleDefinition['declarations']) {
  for (const property in declarations) {
    if (containsValuePlaceholderReference(declarations[property])) {
      throw new Error('--value() is only supported inside managed pattern declarations')
    }
  }
}

function compileUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): StetCSSManifestUtilityRule {
  assertNoValuePlaceholder(rule.declarations)
  return {
    declarations: cloneDeclarations(rule.declarations),
    ...(rule.conditions?.length ? { conditions: [...rule.conditions] } : {}),
    ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
  }
}

const VALUE_PLACEHOLDER_NAME = '--value'
const VALUE_PLACEHOLDER_FUNCTION = '--value()'

function isCSSIdentifierCharacter(value: string | undefined) {
  return value !== undefined && /[-_a-zA-Z0-9]/.test(value)
}

function skipQuotedText(value: string, index: number) {
  const quote = value[index]
  index++
  while (index < value.length) {
    if (value[index] === '\\') {
      index += 2
      continue
    }
    if (value[index] === quote) return index + 1
    index++
  }
  return index
}

function skipComment(value: string, index: number) {
  const end = value.indexOf('*/', index + 2)
  return end === -1 ? value.length : end + 2
}

function containsValuePlaceholderReference(value: string) {
  if (!value.includes(VALUE_PLACEHOLDER_NAME)) return false
  for (let index = 0; index < value.length;) {
    const character = value[index]
    if (character === '"' || character === "'") {
      index = skipQuotedText(value, index)
      continue
    }
    if (character === '/' && value[index + 1] === '*') {
      index = skipComment(value, index)
      continue
    }
    if (value.startsWith(VALUE_PLACEHOLDER_NAME, index)) return true
    index++
  }
  return false
}

function parseValuePlaceholderCall(value: string, index: number) {
  if (isCSSIdentifierCharacter(value[index - 1])) {
    throw new Error('--value() must be a standalone CSS value placeholder')
  }
  const openParenIndex = index + VALUE_PLACEHOLDER_NAME.length
  if (value[openParenIndex] !== '(') {
    throw new Error('--value() must be called as --value()')
  }
  const closeParenIndex = value.indexOf(')', openParenIndex + 1)
  if (closeParenIndex === -1) {
    throw new Error('--value() must be called as --value()')
  }
  if (value.slice(openParenIndex + 1, closeParenIndex).trim()) {
    throw new Error('--value() does not accept arguments')
  }
  const end = closeParenIndex + 1
  if (isCSSIdentifierCharacter(value[end])) {
    throw new Error('--value() must be a standalone CSS value placeholder')
  }
  return end
}

function compilePatternDeclarationValue(value: string): StetCSSManifestCSSDeclarationPrimitive | StetCSSManifestCSSDeclarationPrimitive[] {
  if (!value.includes(VALUE_PLACEHOLDER_NAME)) return value

  const parts: (string | null)[] = []
  let lastIndex = 0
  let matched = false
  for (let index = 0; index < value.length;) {
    const character = value[index]
    if (character === '"' || character === "'") {
      index = skipQuotedText(value, index)
      continue
    }
    if (character === '/' && value[index + 1] === '*') {
      index = skipComment(value, index)
      continue
    }
    if (!value.startsWith(VALUE_PLACEHOLDER_NAME, index)) {
      index++
      continue
    }
    const end = parseValuePlaceholderCall(value, index)
    matched = true
    if (index > lastIndex) parts.push(value.slice(lastIndex, index))
    parts.push(null)
    lastIndex = end
    index = end
  }

  if (!matched) return value

  if (lastIndex < value.length) parts.push(value.slice(lastIndex))
  return value === VALUE_PLACEHOLDER_FUNCTION ? null : parts
}

function compilePatternDeclarations(declarations: CSSDirectiveUtilityRuleDefinition['declarations']): StetCSSManifestCSSDeclarations {
  const compiled: Record<string, StetCSSManifestCSSDeclarationPrimitive | StetCSSManifestCSSDeclarationPrimitive[]> = {}
  for (const property in declarations) {
    compiled[property] = compilePatternDeclarationValue(declarations[property])
  }
  return compiled
}

function compilePatternUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): StetCSSManifestUtilityRule {
  return {
    declarations: compilePatternDeclarations(rule.declarations),
    ...(rule.conditions?.length ? { conditions: [...rule.conditions] } : {}),
    ...(rule.selector && rule.selector !== '&' ? { selector: rule.selector } : {})
  }
}

function declarationValueUsesPlaceholder(value: StetCSSManifestCSSDeclarationPrimitive | StetCSSManifestCSSDeclarationPrimitive[]) {
  return value === null || (Array.isArray(value) && value.includes(null))
}

function countValuePlaceholderProperties(declarations: StetCSSManifestCSSDeclarations) {
  let count = 0
  const declarationMap = declarations as Record<string, StetCSSManifestCSSDeclarationPrimitive | StetCSSManifestCSSDeclarationPrimitive[]>
  for (const property in declarationMap) {
    if (declarationValueUsesPlaceholder(declarationMap[property])) count++
  }
  return count
}

function utilityTypeFromRules(rules: StetCSSManifestUtilityRule[]) {
  return rules.some(({ declarations }) => {
    const properties = Object.keys(declarations)
    return properties.some((property) => isNativeCSSShorthandProperty(property))
      || countValuePlaceholderProperties(declarations) > 1
  })
    ? UtilityType.Shorthand
    : UtilityType.Normal
}

function getPatternMatcher(pattern: CSSDirectiveUtilityPatternDefinition): StetCSSManifestUtilityMatcher {
  return {
    type: 'pattern',
    prefix: pattern.prefix,
    values: [...pattern.values],
    ...(pattern.valueMap ? { valueMap: { ...pattern.valueMap } } : {})
  }
}

function getDynamicMatchers(dynamic: CSSDirectiveUtilityDynamicDefinition): StetCSSManifestUtilityMatcher[] {
  const matchers: StetCSSManifestUtilityMatcher[] = []
  if (dynamic.variableAliasRefs?.length) {
    matchers.push({
      type: 'variable',
      keys: [dynamic.key]
    })
  }
  if (dynamic.kind) {
    matchers.push({
      type: 'value',
      keys: [dynamic.key]
    })
  }
  if (dynamic.arbitrary) {
    matchers.push({
      type: 'key',
      keys: [dynamic.key]
    })
  }
  if (dynamic.values?.length) {
    matchers.push({
      type: 'pattern',
      prefix: dynamic.key + ':',
      values: [...dynamic.values]
    })
  }
  if (!matchers.length) {
    throw new Error('Managed dynamic utility definition must include at least one value source')
  }
  return matchers
}

function compileUtility(definition: CSSDirectiveUtilityDefinition, order: number): StetCSSManifestUtility {
  if (definition.type === 'pattern') {
    if (!definition.pattern) {
      throw new Error('Managed enum pattern definition is missing a pattern')
    }
    const rules: StetCSSManifestUtilityRule[] = []
    if (definition.declarations) {
      rules.push({
        declarations: compilePatternDeclarations(definition.declarations),
        ...(definition.conditions?.length ? { conditions: [...definition.conditions] } : {})
      })
    }
    if (definition.rules?.length) {
      rules.push(...definition.rules.map(compilePatternUtilityRule))
    }
    return {
      id: definition.name,
      name: definition.name,
      type: UtilityType.Semantic,
      order,
      layer: definition.layer || 'utilities',
      emit: {
        type: 'static',
        rules
      },
      matchers: [getPatternMatcher(definition.pattern)]
    }
  }

  if (definition.type === 'dynamic') {
    if (!definition.dynamic) {
      throw new Error('Managed dynamic utility definition is missing a dynamic source')
    }
    const rules: StetCSSManifestUtilityRule[] = []
    if (definition.declarations) {
      rules.push({
        declarations: compilePatternDeclarations(definition.declarations),
        ...(definition.conditions?.length ? { conditions: [...definition.conditions] } : {})
      })
    }
    if (definition.rules?.length) {
      rules.push(...definition.rules.map(compilePatternUtilityRule))
    }
    return {
      id: definition.name,
      name: definition.name,
      type: utilityTypeFromRules(rules),
      order,
      layer: definition.layer || 'utilities',
      ...(definition.dynamic.kind ? { kind: definition.dynamic.kind } : {}),
      ...(definition.dynamic.variableAliasRefs?.length ? {
        variableAliasRefs: [...definition.dynamic.variableAliasRefs]
      } : {}),
      emit: {
        type: 'static',
        rules
      },
      matchers: getDynamicMatchers(definition.dynamic)
    }
  }

  const name = definition.name.startsWith('.') ? definition.name.slice(1) : definition.name
  const rules: StetCSSManifestUtilityRule[] = []
  if (definition.declarations) {
    assertNoValuePlaceholder(definition.declarations)
    rules.push({
      declarations: cloneDeclarations(definition.declarations),
      ...(definition.conditions?.length ? { conditions: [...definition.conditions] } : {})
    })
  }
  if (definition.rules?.length) {
    rules.push(...definition.rules.map(compileUtilityRule))
  }
  return {
    id: '.' + name,
    name,
    type: UtilityType.Semantic,
    order,
    layer: definition.layer || 'utilities',
    emit: {
      type: 'static',
      rules
    },
    matchers: [{
      type: 'static',
      name
    }]
  }
}

function compileUtilities(input: CSSDirectiveUtilityDefinition[] | undefined): StetCSSManifestUtility[] | undefined {
  if (!input?.length) return
  return input.map((definition, index) => compileUtility(definition, index))
}

function compileAnimations(input: CSSDirectiveManifestInput['animations']): StetCSSManifestAnimations | undefined {
  return input ? clone(input) as StetCSSManifestAnimations : undefined
}

function compileAnimationOptions(input: CSSDirectiveManifestInput['animationOptions']): StetCSSManifest['animationOptions'] | undefined {
  return input ? clone(input) as StetCSSManifest['animationOptions'] : undefined
}

function mergeBy<T>(base: T[] | undefined, next: T[] | undefined, getKey: (value: T) => string | undefined) {
  const merged = [...(base || []).map((value) => clone(value))]
  for (const value of next || []) {
    const key = getKey(value)
    const index = key === undefined ? -1 : merged.findIndex((existing) => getKey(existing) === key)
    if (index === -1) {
      merged.push(clone(value))
    } else {
      merged[index] = clone(value)
    }
  }
  return merged.length ? merged : undefined
}

function mergeVariables(
  base: StetCSSManifestVariables | undefined,
  next: StetCSSManifestVariables | undefined
) {
  const merged = mergeBy(
    flattenStetCSSManifestVariables(base),
    flattenStetCSSManifestVariables(next),
    (variable) => variable.name
  )
  return groupStetCSSManifestVariables(merged)
}

function mergeRecords<T>(base: Record<string, T> | undefined, next: Record<string, T> | undefined) {
  return Object.keys(base || {}).length || Object.keys(next || {}).length
    ? { ...(base ? clone(base) : {}), ...(next ? clone(next) : {}) }
    : undefined
}

function mergeAnimationOptions(
  base: StetCSSManifest['animationOptions'],
  next: StetCSSManifest['animationOptions'],
  animations: StetCSSManifest['animations']
) {
  const merged = mergeRecords(base, next)
  if (!merged) return
  for (const animationName of Object.keys(animations || {})) {
    if (!next?.[animationName]) {
      delete merged[animationName]
    }
  }
  return Object.keys(merged).length ? merged : undefined
}

function mergeManifest(baseManifest: StetCSSManifest | undefined, fragment: StetCSSManifest): StetCSSManifest {
  if (!baseManifest) {
    return clone(fragment)
  }

  const manifest: StetCSSManifest = {
    version: 1,
    settings: { ...(baseManifest.settings || {}), ...(fragment.settings || {}) },
    variables: mergeVariables(baseManifest.variables, fragment.variables),
    animations: mergeRecords(baseManifest.animations, fragment.animations),
    animationOptions: mergeAnimationOptions(baseManifest.animationOptions, fragment.animationOptions, fragment.animations),
    variants: mergeBy(baseManifest.variants, fragment.variants, (variant) => variant.token),
    conditions: mergeRecords(baseManifest.conditions, fragment.conditions),
    breakpointConditions: mergeRecords(baseManifest.breakpointConditions, fragment.breakpointConditions),
    containerConditions: mergeRecords(baseManifest.containerConditions, fragment.containerConditions),
    selectors: mergeRecords(baseManifest.selectors, fragment.selectors),
    utilities: mergeBy(baseManifest.utilities, fragment.utilities, (utility) => `${utility.id}\0${utility.layer || ''}`),
    debug: mergeRecords(baseManifest.debug, fragment.debug)
  }
  return Object.fromEntries(Object.entries(manifest).filter(([, value]) =>
    value !== undefined
    && (!Array.isArray(value) || value.length)
    && (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length)
  )) as StetCSSManifest
}

export function createStetCSSManifest(input: CSSDirectiveManifestInput = {}, options: CreateStetCSSManifestOptions = {}): StetCSSManifest {
  const diagnostics = options.diagnostics
  addCompilerDiagnosticCount(diagnostics, 'manifest-create-count')
  setCompilerDiagnosticCount(diagnostics, 'manifest-input-variable-count', input.variables?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'manifest-input-utility-count', input.utilities?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'manifest-input-variant-count', input.variants?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'manifest-input-animation-count', Object.keys(input.animations || {}).length)

  const resolveVariableName = timeCompilerDiagnostic(diagnostics, 'manifest-variable-name-resolver-ms', () => createVariableNameResolver(input, options))
  const variableDefinitions = timeCompilerDiagnostic(diagnostics, 'manifest-compile-variables-ms', () => compileVariables(input.variables, resolveVariableName))
  const variables = timeCompilerDiagnostic(diagnostics, 'manifest-group-variables-ms', () => groupStetCSSManifestVariables(variableDefinitions))
  const { conditions, breakpointConditions, containerConditions } = timeCompilerDiagnostic(diagnostics, 'manifest-compile-conditions-ms', () => compileConditions(variableDefinitions))
  const settings = {
    ...(input.baseUnit !== undefined ? { baseUnit: input.baseUnit } : {}),
    ...(input.defaultMode !== undefined ? { defaultMode: input.defaultMode } : {}),
    ...(input.scope !== undefined ? { scope: input.scope } : {}),
    ...(input.important !== undefined ? { important: input.important } : {}),
    ...(input.modeTrigger !== undefined ? { modeTrigger: input.modeTrigger } : {}),
    ...(input.modes?.length ? { modes: [...input.modes] } : {})
  }
  const variantBaseManifest = timeCompilerDiagnostic(diagnostics, 'manifest-variant-base-merge-ms', () => mergeManifest(options.baseManifest, {
    version: 1,
    ...(Object.keys(settings).length ? { settings } : {}),
    ...(variables ? { variables } : {}),
    ...(conditions ? { conditions } : {}),
    ...(breakpointConditions ? { breakpointConditions } : {}),
    ...(containerConditions ? { containerConditions } : {})
  }))
  const { variants, selectors, conditions: variantConditions } = timeCompilerDiagnostic(diagnostics, 'manifest-compile-variants-ms', () => compileVariants(input.variants as StetCSSManifestVariants | undefined, variantBaseManifest))
  const utilities = timeCompilerDiagnostic(diagnostics, 'manifest-compile-utilities-ms', () => compileUtilities(input.utilities))
  const animations = timeCompilerDiagnostic(diagnostics, 'manifest-compile-animations-ms', () => compileAnimations(input.animations))
  const animationOptions = timeCompilerDiagnostic(diagnostics, 'manifest-compile-animation-options-ms', () => compileAnimationOptions(input.animationOptions))
  const fragment: StetCSSManifest = {
    version: 1,
    ...(Object.keys(settings).length ? { settings } : {}),
    ...(variables ? { variables } : {}),
    ...(animations ? { animations } : {}),
    ...(animationOptions ? { animationOptions } : {}),
    ...(variants?.length ? { variants } : {}),
    ...((conditions || variantConditions) ? { conditions: mergeRecords(conditions, variantConditions) } : {}),
    ...(breakpointConditions ? { breakpointConditions } : {}),
    ...(containerConditions ? { containerConditions } : {}),
    ...(selectors ? { selectors } : {}),
    ...(utilities?.length ? { utilities } : {})
  }
  const manifest = timeCompilerDiagnostic(diagnostics, 'manifest-final-merge-ms', () => mergeManifest(options.baseManifest, fragment))
  setCompilerDiagnosticCount(diagnostics, 'manifest-output-variable-count', Object.keys(manifest.variables || {}).length)
  setCompilerDiagnosticCount(diagnostics, 'manifest-output-utility-count', manifest.utilities?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'manifest-output-variant-count', manifest.variants?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'manifest-output-selector-count', Object.keys(manifest.selectors || {}).length)
  setCompilerDiagnosticCount(diagnostics, 'manifest-output-condition-count', Object.keys(manifest.conditions || {}).length)
  setCompilerDiagnosticCount(diagnostics, 'manifest-output-animation-count', Object.keys(manifest.animations || {}).length)
  return manifest
}
