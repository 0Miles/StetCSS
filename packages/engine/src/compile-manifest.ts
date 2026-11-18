import { type PropertiesHyphen } from 'csstype'
import type { Variable } from '@stet-css/schema/css-syntax'
import { isNativeCSSShorthandProperty } from '@stet-css/schema/native-css-shorthand'
import type {
  StetCSSManifest,
  StetCSSManifestAnimations,
  StetCSSManifestConditions,
  StetCSSManifestSettings,
  StetCSSManifestUtility,
  StetCSSManifestUtilityMatcher,
  StetCSSManifestVariableAliasSet,
  StetCSSManifestVariantBranch,
  StetCSSManifestVariantToken
} from '@stet-css/schema/manifest'
import { flattenStetCSSManifestVariables } from '@stet-css/schema/manifest'
import UtilityType from '@stet-css/schema/utility-type'
import { collectCSSVariableReferences } from '@stet-css/lexer'
import { MATCH_NAME_BOUNDARY } from './common'
import builtinKeyAliases from './key-aliases'
import builtinNativeValueNamespaces, { type StetCSSBuiltinNativeValueNamespace } from './native-value-namespaces'
import builtinSelectorAliases from './selector-aliases'
import { PRESET_MODES } from './utils/undeclared-mode'
import type { Condition } from './utils/parse-condition'
import type { SelectorNode } from './utils/parse-selector'

export type CompiledUtility = Omit<StetCSSManifestUtility, 'emit' | 'name' | 'order'> & {
  name: string
  order: number
  emit: StetCSSManifestUtility['emit'] | { type: 'group' }
  variables?: Map<string, Variable>
}

export type EngineSettings = StetCSSManifestSettings & {
  defaultMode: NonNullable<StetCSSManifestSettings['defaultMode']>
  modeTrigger: NonNullable<StetCSSManifestSettings['modeTrigger']>
  modes: string[]
}

const DEFAULT_SETTINGS: EngineSettings = {
  defaultMode: 'light',
  modeTrigger: 'media',
  modes: [...PRESET_MODES]
}

export interface CompiledManifest {
  manifest: StetCSSManifest
  settings: EngineSettings
  definedUtilities: CompiledUtility[]
  variableMatcherUtilities: CompiledUtility[]
  valueMatcherUtilities: CompiledUtility[]
  keyMatcherUtilities: CompiledUtility[]
  patternMatcherUtilities: CompiledUtility[]
  arbitraryMatcherUtilities: CompiledUtility[]
  variableMatcherIndex: Map<string, CompiledUtility[]>
  valueMatcherIndex: Map<string, CompiledUtility[]>
  keyMatcherIndex: Map<string, CompiledUtility[]>
  patternMatcherIndex?: Map<string, CompiledUtility[]>
  arbitraryStaticMatcherIndex?: Map<string, CompiledUtility[]>
  selectors: Map<string, SelectorNode[]>
  variables: Map<string, Variable>
  modes: string[]
  conditions: Map<string, Condition>
  variants: Map<StetCSSManifestVariantToken, StetCSSManifestVariantBranch[]>
  breakpointConditions: Map<string, Condition>
  containerConditions: Map<string, Condition>
  animations: Map<string, StetCSSManifestAnimations[string]>
  nativeDeclarationFastPathBlockedProperties: Set<string>
  nativeValueNamespaceUtilities: Map<string, CompiledUtility>
  keyAliases: Map<string, string>
}

// Manifests are compiled by object identity. Mutating a manifest after first use is unsupported.
const compiledManifestCache = new WeakMap<StetCSSManifest, CompiledManifest>()

function assertStetCSSManifest(manifest: StetCSSManifest): asserts manifest is StetCSSManifest {
  if (!manifest || manifest.version !== 1) {
    throw new TypeError('Unsupported StetCSSManifest version. Expected version 1.')
  }
  if (Array.isArray((manifest as { variables?: unknown }).variables)) {
    throw new TypeError('Unsupported StetCSSManifest variables format. Expected namespace-grouped variables.')
  }
  if ('utilityBuckets' in manifest) {
    throw new TypeError('Unsupported StetCSSManifest utilityBuckets field. Matcher indexes are engine-derived.')
  }
  if (manifest.settings && 'baseUnit' in manifest.settings) {
    throw new TypeError('StetCSSManifest settings.baseUnit was removed; x is the native CSS resolution unit, so write spacing as a length, for example p:1rem instead of p:4x')
  }
}

function pushUnique(target: string[], values: string[]) {
  for (const value of values) {
    if (!target.includes(value)) target.push(value)
  }
}

function deriveUtilityMetadata(utility: CompiledUtility) {
  const keys = utility.keys ? [...utility.keys] : []
  const aliasGroups = utility.aliasGroups ? [...utility.aliasGroups] : []

  for (const matcher of utility.matchers) {
    if (matcher.type === 'key') {
      pushUnique(keys, matcher.keys)
    } else if (matcher.type === 'variable' || matcher.type === 'value') {
      pushUnique(aliasGroups, matcher.keys)
    }
  }

  if (keys.length && !utility.keys) utility.keys = keys
  if (aliasGroups.length && !utility.aliasGroups) utility.aliasGroups = aliasGroups
  if (!utility.key) utility.key = keys[0] || aliasGroups[0]
}

export function isPureNativeDeclarationUtilityDefinition(
  utility: CompiledUtility
): utility is CompiledUtility & { emit: { type: 'property', property: string } } {
  return utility.emit.type === 'property'
    && utility.id === utility.emit.property
    && utility.name === utility.emit.property
    && !utility.variableAliasRefs?.length
    && !utility.variableAliases?.length
    && !utility.kind
    && !utility.conditions?.length
}

function getVariableKeyByNamespace(variableName: string, namespace: string) {
  const negative = variableName.startsWith('-')
  const positiveName = negative ? variableName.slice(1) : variableName
  if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
  const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
  return negative ? '-' + key : key
}

function isIndexableMatchName(name: string) {
  for (let index = 0; index < name.length; index++) {
    if (MATCH_NAME_BOUNDARY.has(name[index])) return false
  }
  return true
}

function pushIndexedUtility(index: Map<string, CompiledUtility[]>, key: string, utility: CompiledUtility) {
  const utilities = index.get(key)
  if (utilities) {
    if (!utilities.includes(utility)) utilities.push(utility)
  } else {
    index.set(key, [utility])
  }
}

function createKeyedMatcherIndex(
  utilities: CompiledUtility[],
  matcherType: 'variable' | 'value' | 'key'
) {
  const index = new Map<string, CompiledUtility[]>()
  for (const utility of utilities) {
    for (const matcher of utility.matchers) {
      if (matcher.type !== matcherType) continue
      for (const key of matcher.keys) {
        pushIndexedUtility(index, key, utility)
      }
    }
  }
  return index
}

function createPatternMatcherIndex(utilities: CompiledUtility[]) {
  const index = new Map<string, CompiledUtility[]>()
  for (const utility of utilities) {
    for (const matcher of utility.matchers) {
      if (matcher.type !== 'pattern') continue
      for (const value of matcher.values) {
        const name = matcher.prefix + value
        if (isIndexableMatchName(name)) {
          pushIndexedUtility(index, name, utility)
        }
      }
    }
  }
  return index
}

function canIndexPatternUtilities(utilities: CompiledUtility[]) {
  return utilities.every((utility) =>
    utility.matchers.every((matcher) =>
      matcher.type !== 'pattern'
      || matcher.values.every((value) => isIndexableMatchName(matcher.prefix + value))
    )
  )
}

function createStaticMatcherIndex(utilities: CompiledUtility[]) {
  const index = new Map<string, CompiledUtility[]>()
  for (const utility of utilities) {
    for (const matcher of utility.matchers) {
      if (matcher.type === 'static' && isIndexableMatchName(matcher.name)) {
        pushIndexedUtility(index, matcher.name, utility)
      }
    }
  }
  return index
}

function canIndexStaticOnlyUtilities(utilities: CompiledUtility[]) {
  return utilities.every((utility) =>
    utility.matchers.length
    && utility.matchers.every((matcher) => matcher.type === 'static' && isIndexableMatchName(matcher.name))
  )
}

function createCompiledSettings(manifest: StetCSSManifest): EngineSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(manifest.settings || {}),
    modes: manifest.settings?.modes ? [...manifest.settings.modes] : [...DEFAULT_SETTINGS.modes]
  }
}

export function cloneCompiledSettings(settings: EngineSettings): EngineSettings {
  return {
    ...settings,
    modes: [...settings.modes]
  }
}

function compileKeyAliases() {
  const keyAliases = new Map<string, string>()
  for (const [key, property] of Object.entries(builtinKeyAliases)) {
    if (key && property && key !== property) {
      keyAliases.set(key, property)
    }
  }
  return keyAliases
}

type ManifestVariableEntry = ReturnType<typeof flattenStetCSSManifestVariables>[number]

/**
 * Once a manifest declares its modes, values for any other mode (the preset light and dark values
 * of a project that declared only `sepia`, say) have no mode to apply in: drop them. A variable
 * that then has no value at all takes the value of the default mode, else light, as its plain
 * value, so preset tokens such as `--color-red` keep resolving.
 */
function scopeVariableToDeclaredModes(definition: ManifestVariableEntry, settings: StetCSSManifest['settings']): ManifestVariableEntry {
  const declaredModes = settings?.modes
  if (!definition.modes || !declaredModes) return definition
  const entries = Object.entries(definition.modes)
  const kept = entries.filter(([mode]) => declaredModes.includes(mode))
  if (kept.length === entries.length) return definition
  const scoped: ManifestVariableEntry = { ...definition }
  if (kept.length) {
    scoped.modes = Object.fromEntries(kept)
  } else {
    delete scoped.modes
  }
  if (scoped.value === undefined) {
    const fallback = definition.modes[settings?.defaultMode || ''] || definition.modes[PRESET_MODES[0]] || entries[0][1]
    scoped.type = fallback.type
    scoped.value = fallback.value
    if (fallback.numeric) scoped.numeric = fallback.numeric
  }
  if (scoped.dependencies) {
    const referenced = new Set([scoped.value, ...kept.map(([, each]) => each.value)]
      .flatMap((value) => [...collectCSSVariableReferences(String(value))]))
    scoped.dependencies = scoped.dependencies.filter((name) => referenced.has(name))
  }
  return scoped
}

function compileVariables(manifest: StetCSSManifest) {
  const variables = new Map<string, Variable>()
  for (const entry of flattenStetCSSManifestVariables(manifest.variables)) {
    const definition = scopeVariableToDeclaredModes(entry, manifest.settings)
    if (!definition.name || !definition.type || definition.value === false) continue
    variables.set(definition.name, {
      name: definition.name,
      key: definition.key,
      type: definition.type,
      ...(definition.namespace ? { namespace: definition.namespace } : {}),
      ...(definition.value !== undefined ? {
        value: Array.isArray(definition.value) ? definition.value.join(',') : definition.value
      } : {}),
      ...(definition.numeric ? { numeric: { ...definition.numeric } } : {}),
      ...(definition.modes ? { modes: { ...definition.modes } } : {}),
      ...(definition.dependencies?.length ? { dependencies: new Set(definition.dependencies) } : {}),
      ...(definition.inline ? { inline: true } : {}),
      ...(definition.static ? { static: true } : {})
    } as Variable)
  }
  return variables
}

function compileAnimations(manifest: StetCSSManifest) {
  const animations = new Map<string, StetCSSManifestAnimations[string]>()
  if (!manifest.animations) return animations
  for (const animationName in manifest.animations) {
    const eachAnimation: StetCSSManifestAnimations[string] = {}
    animations.set(animationName, eachAnimation)
    const eachKeyframes = manifest.animations[animationName]
    for (const eachKeyframeValue in eachKeyframes) {
      const newValueByPropertyName: any = eachAnimation[eachKeyframeValue] = {}
      const eachKeyframeDeclarations = eachKeyframes[eachKeyframeValue as 'from' | 'to' | `${number}%`]
      for (const propertyName in eachKeyframeDeclarations) {
        newValueByPropertyName[propertyName] = eachKeyframeDeclarations[propertyName as keyof PropertiesHyphen]
      }
    }
  }
  return animations
}

function compileConditionMap(conditions: StetCSSManifestConditions | undefined) {
  const target = new Map<string, Condition>()
  if (!conditions) return target
  for (const [name, condition] of Object.entries(conditions)) {
    target.set(name, {
      id: condition.id,
      nodes: condition.nodes
    } as Condition)
  }
  return target
}

function compileVariantAliases(manifest: StetCSSManifest) {
  const selectors = new Map<string, SelectorNode[]>()
  for (const [name, nodes] of Object.entries(builtinSelectorAliases)) {
    selectors.set(name, cloneSelectorNodes(nodes))
  }
  if (manifest.selectors) {
    for (const [name, nodes] of Object.entries(manifest.selectors)) {
      selectors.set(name, cloneSelectorNodes(nodes as SelectorNode[]))
    }
  }

  const variants = new Map<StetCSSManifestVariantToken, StetCSSManifestVariantBranch[]>()
  for (const variant of manifest.variants || []) {
    variants.set(variant.token, variant.branches.map((branch) => ({
      ...branch,
      ...(branch.selectorNodes?.length ? { selectorNodes: branch.selectorNodes as SelectorNode[] } : {}),
      ...(branch.conditions?.length ? { conditions: [...branch.conditions] } : {}),
      ...(branch.conditionNodes?.length ? { conditionNodes: branch.conditionNodes.map((condition) => ({
        id: condition.id,
        nodes: condition.nodes
      } as Condition)) } : {})
    })))
  }

  return { selectors, variants }
}

function cloneSelectorNodes(nodes: SelectorNode[]): SelectorNode[] {
  return nodes.map((node) => 'children' in node && node.children?.length
    ? { ...node, children: cloneSelectorNodes(node.children) }
    : { ...node })
}

function createVariableAliasRefResolver(variables: Map<string, Variable>) {
  const aliasRefCache = new Map<string, StetCSSManifestVariableAliasSet>()
  return (ref: string): StetCSSManifestVariableAliasSet => {
    const cached = aliasRefCache.get(ref)
    if (cached) return cached

    const namespace = ref[0] === '=' || ref[0] === '~' ? ref.slice(1) : ''
    const aliases: StetCSSManifestVariableAliasSet = []
    const usedKeys = new Set<string>()
    if (namespace) {
      for (const variable of variables.values()) {
        const key = getVariableKeyByNamespace(variable.name, namespace)
        if (key === undefined || usedKeys.has(key)) continue
        usedKeys.add(key)
        aliases.push([key, variable.name])
      }
    }
    aliasRefCache.set(ref, aliases)
    return aliases
  }
}

function compileUtilityDefinition(
  utility: StetCSSManifestUtility,
  variables: Map<string, Variable>,
  resolveAliasRef: (ref: string) => StetCSSManifestVariableAliasSet,
  index = 0,
  count = 1
): CompiledUtility {
  const definedUtility = {
    ...utility,
    name: utility.name || utility.id,
    order: utility.order ?? count - index - 1,
    layer: utility.layer || 'utilities',
    matchers: utility.matchers.map((matcher: StetCSSManifestUtilityMatcher) => ({ ...matcher }))
  } as CompiledUtility

  const variableAliases = [
    ...(utility.variableAliases || []),
    ...(utility.variableAliasRefs || []).flatMap(resolveAliasRef)
  ]
  if (variableAliases.length) {
    definedUtility.variables = new Map()
    for (const [variableKey, variableName] of variableAliases) {
      if (definedUtility.variables.has(variableKey)) continue
      const variable = variables.get(variableName)
      if (variable) definedUtility.variables.set(variableKey, variable)
    }
  }

  deriveUtilityMetadata(definedUtility)
  return definedUtility
}

function createNativeValueNamespaceUtility(
  property: string,
  namespace: Pick<StetCSSBuiltinNativeValueNamespace, 'variableAliasRefs'>
): StetCSSManifestUtility {
  return {
    id: property,
    name: property,
    type: isNativeCSSShorthandProperty(property)
      ? UtilityType.Shorthand
      : UtilityType.Normal,
    order: 0,
    variableAliasRefs: [...namespace.variableAliasRefs],
    emit: {
      type: 'property',
      property
    },
    matchers: [{
      type: 'key',
      keys: [property]
    }]
  }
}

function compileNativeValueNamespaces(
  variables: Map<string, Variable>,
  resolveAliasRef: (ref: string) => StetCSSManifestVariableAliasSet
) {
  const nativeValueNamespaceUtilities = new Map<string, CompiledUtility>()
  for (const namespace of builtinNativeValueNamespaces) {
    if (!namespace.properties?.length || !namespace.variableAliasRefs?.length) continue
    for (const property of namespace.properties) {
      if (!property || nativeValueNamespaceUtilities.has(property)) continue
      const utility = compileUtilityDefinition(
        createNativeValueNamespaceUtility(property, namespace),
        variables,
        resolveAliasRef
      )
      nativeValueNamespaceUtilities.set(property, utility)
    }
  }
  return nativeValueNamespaceUtilities
}

function registerNativeDeclarationFastPathPolicy(
  target: Set<string>,
  utility: CompiledUtility
) {
  const isPureNativeDeclaration = isPureNativeDeclarationUtilityDefinition(utility)
  for (const matcher of utility.matchers) {
    if (matcher.type !== 'key' && matcher.type !== 'value' && matcher.type !== 'variable') continue
    for (const key of matcher.keys) {
      if (isPureNativeDeclaration && key === utility.emit.property) continue
      target.add(key)
    }
  }
}

function pushBucketUtility(target: CompiledUtility[], utility: CompiledUtility) {
  if (!target.includes(utility)) target.push(utility)
}

function registerUtilityMatcherBuckets(
  utility: CompiledUtility,
  buckets: {
    variableMatcherUtilities: CompiledUtility[]
    valueMatcherUtilities: CompiledUtility[]
    keyMatcherUtilities: CompiledUtility[]
    patternMatcherUtilities: CompiledUtility[]
    arbitraryMatcherUtilities: CompiledUtility[]
  }
) {
  for (const matcher of utility.matchers) {
    switch (matcher.type) {
      case 'variable':
        if (utility.variableAliases?.length || utility.variableAliasRefs?.length) {
          pushBucketUtility(buckets.variableMatcherUtilities, utility)
        }
        break
      case 'value':
        if (utility.kind) pushBucketUtility(buckets.valueMatcherUtilities, utility)
        break
      case 'key':
        pushBucketUtility(buckets.keyMatcherUtilities, utility)
        break
      case 'pattern':
        pushBucketUtility(buckets.patternMatcherUtilities, utility)
        break
      default:
        pushBucketUtility(buckets.arbitraryMatcherUtilities, utility)
        break
    }
  }
}

function compileUtilities(
  manifest: StetCSSManifest,
  variables: Map<string, Variable>,
  resolveAliasRef: (ref: string) => StetCSSManifestVariableAliasSet
) {
  const definedUtilities: CompiledUtility[] = []
  const variableMatcherUtilities: CompiledUtility[] = []
  const valueMatcherUtilities: CompiledUtility[] = []
  const keyMatcherUtilities: CompiledUtility[] = []
  const patternMatcherUtilities: CompiledUtility[] = []
  const arbitraryMatcherUtilities: CompiledUtility[] = []
  const nativeDeclarationFastPathBlockedProperties = new Set<string>()

  const manifestUtilities = manifest.utilities || []
  for (let index = 0; index < manifestUtilities.length; index++) {
    const utility = manifestUtilities[index]
    const definedUtility = compileUtilityDefinition(utility, variables, resolveAliasRef, index, manifestUtilities.length)
    registerNativeDeclarationFastPathPolicy(nativeDeclarationFastPathBlockedProperties, definedUtility)
    definedUtilities.push(definedUtility)
    registerUtilityMatcherBuckets(definedUtility, {
      variableMatcherUtilities,
      valueMatcherUtilities,
      keyMatcherUtilities,
      patternMatcherUtilities,
      arbitraryMatcherUtilities
    })
  }

  return {
    definedUtilities,
    variableMatcherUtilities,
    valueMatcherUtilities,
    keyMatcherUtilities,
    patternMatcherUtilities,
    arbitraryMatcherUtilities,
    variableMatcherIndex: createKeyedMatcherIndex(variableMatcherUtilities, 'variable'),
    valueMatcherIndex: createKeyedMatcherIndex(valueMatcherUtilities, 'value'),
    keyMatcherIndex: createKeyedMatcherIndex(keyMatcherUtilities, 'key'),
    patternMatcherIndex: canIndexPatternUtilities(patternMatcherUtilities)
      ? createPatternMatcherIndex(patternMatcherUtilities)
      : undefined,
    arbitraryStaticMatcherIndex: canIndexStaticOnlyUtilities(arbitraryMatcherUtilities)
      ? createStaticMatcherIndex(arbitraryMatcherUtilities)
      : undefined,
    nativeDeclarationFastPathBlockedProperties
  }
}

export function compileManifest(manifest: StetCSSManifest): CompiledManifest {
  assertStetCSSManifest(manifest)
  const settings = createCompiledSettings(manifest)
  const variables = compileVariables(manifest)
  const animations = compileAnimations(manifest)
  const { selectors, variants } = compileVariantAliases(manifest)
  const resolveAliasRef = createVariableAliasRefResolver(variables)
  const nativeValueNamespaceUtilities = compileNativeValueNamespaces(variables, resolveAliasRef)
  const utilities = compileUtilities(manifest, variables, resolveAliasRef)

  return {
    manifest,
    settings,
    definedUtilities: utilities.definedUtilities,
    variableMatcherUtilities: utilities.variableMatcherUtilities,
    valueMatcherUtilities: utilities.valueMatcherUtilities,
    keyMatcherUtilities: utilities.keyMatcherUtilities,
    patternMatcherUtilities: utilities.patternMatcherUtilities,
    arbitraryMatcherUtilities: utilities.arbitraryMatcherUtilities,
    variableMatcherIndex: utilities.variableMatcherIndex,
    valueMatcherIndex: utilities.valueMatcherIndex,
    keyMatcherIndex: utilities.keyMatcherIndex,
    patternMatcherIndex: utilities.patternMatcherIndex,
    arbitraryStaticMatcherIndex: utilities.arbitraryStaticMatcherIndex,
    selectors,
    variables,
    modes: [...settings.modes],
    conditions: compileConditionMap(manifest.conditions),
    variants,
    breakpointConditions: compileConditionMap(manifest.breakpointConditions),
    containerConditions: compileConditionMap(manifest.containerConditions),
    animations,
    nativeDeclarationFastPathBlockedProperties: utilities.nativeDeclarationFastPathBlockedProperties,
    nativeValueNamespaceUtilities,
    keyAliases: compileKeyAliases()
  }
}

export function getCompiledManifest(manifest: StetCSSManifest) {
  const cached = compiledManifestCache.get(manifest)
  if (cached) return cached
  const compiledManifest = compileManifest(manifest)
  compiledManifestCache.set(manifest, compiledManifest)
  return compiledManifest
}
