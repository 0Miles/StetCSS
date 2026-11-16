import { MasterCSS, type CompiledUtility, type GeneratedRule, type NativeCSSDeclarationMatcher } from '@stet-css/core'
import { builtinKeyAliases, builtinNativeValueNamespaces } from '@stet-css/engine'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import UtilityType from '@stet-css/schema/utility-type'
import type { ValueComponent, Variable } from '@stet-css/schema/css-syntax'
import type { MasterCSSManifest, MasterCSSManifestConditionNode } from '@stet-css/schema/manifest'
import { getMdnPropertySyntax } from './utils/mdn-css-data'

export type { CompiledUtility, ValueComponent, Variable }
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
export { builtinKeyAliases, builtinNativeValueNamespaces, defaultManifest, MasterCSS, UtilityType }

export function matchesLanguageServiceNativeDeclaration({ property }: { property: string }) {
  return property.startsWith('--') || Boolean(getMdnPropertySyntax(property))
}

/**
 * Generates the rules an editor feature shows for a class. A host that knows
 * what the build emits (the language server) supplies one; without it the
 * engine's own `generate` decides.
 */
export type LanguageRuleGenerator = (css: MasterCSS, className: string) => GeneratedRule[]

export interface CSSLanguageRuntime {
  MasterCSS: typeof MasterCSS
  UtilityType: typeof UtilityType
  defaultManifest: MasterCSSManifest
  builtinKeyAliases: typeof builtinKeyAliases
  builtinNativeValueNamespaces: typeof builtinNativeValueNamespaces
  nativeDeclarationMatcher: NativeCSSDeclarationMatcher
  generateRules?: LanguageRuleGenerator
}

export const defaultCSSLanguageRuntime: CSSLanguageRuntime = {
  MasterCSS,
  UtilityType,
  defaultManifest,
  builtinKeyAliases,
  builtinNativeValueNamespaces,
  nativeDeclarationMatcher: matchesLanguageServiceNativeDeclaration
}

export const SELECTOR_SIGNS = [':', '_', '>', '+', '~']
export const QUERY_COMPARISON_OPERATORS = ['>', '<', '=']
export const QUERY_LOGICAL_OPERATORS = ['&']
export const DELIMITER_SIGN = '|'
export const SEPARATOR_SIGN = ','
export const AT_SIGN = '@'
export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS: string[] = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']

export interface Condition {
  id: string
  nodes: MasterCSSManifestConditionNode[]
}

export function createDefaultCSS(runtime: CSSLanguageRuntime = defaultCSSLanguageRuntime) {
  return runtime.MasterCSS.create({
    manifest: runtime.defaultManifest,
    nativeDeclarationMatcher: runtime.nativeDeclarationMatcher
  })
}

const ruleGenerators = new WeakMap<MasterCSS, LanguageRuleGenerator>()

export function createLanguageCSS(manifest: MasterCSSManifest = defaultManifest, runtime: CSSLanguageRuntime = defaultCSSLanguageRuntime) {
  const css = runtime.MasterCSS.create({
    manifest,
    nativeDeclarationMatcher: runtime.nativeDeclarationMatcher
  })
  if (runtime.generateRules) ruleGenerators.set(css, runtime.generateRules)
  return css
}

/** Whether the runtime's generator emits rules for a class the engine accepts; true when `css` has no generator. */
export function isLanguageClassEmitted(css: MasterCSS, className: string) {
  const generateRules = ruleGenerators.get(css)
  return !generateRules || generateRules(css, className).length > 0
}

/** The rules editor features show for a class: the runtime's generator when `css` has one, else the engine's. */
export function generateLanguageRules(css: MasterCSS, className: string): GeneratedRule[] {
  const generateRules = ruleGenerators.get(css)
  return generateRules ? generateRules(css, className) : css.generate(className)
}

export function generateCSS(
  classNames: string[],
  css: MasterCSS = createDefaultCSS(),
  runtime: CSSLanguageRuntime = defaultCSSLanguageRuntime
) {
  const MasterCSSConstructor = css.constructor as typeof MasterCSS
  const generatedCSS = MasterCSSConstructor.create({
    manifest: css.manifest,
    nativeDeclarationMatcher: runtime.nativeDeclarationMatcher
  })
  if (runtime.generateRules) ruleGenerators.set(generatedCSS, runtime.generateRules)
  for (const className of new Set(classNames)) {
    for (const rule of generateLanguageRules(generatedCSS, className)) rule.layer.insert(rule)
  }
  return generatedCSS.text
}

export function isCoreRule(id: string) {
  return id
}

export function getStaticUtilityDeclarations(utility: CompiledUtility) {
  const emit = utility.emit
  if (emit.type === 'static') {
    return emit.rules[0]?.declarations
  }
  if (emit.type === 'template') {
    return emit.declarations
  }
}

function findNumberNode(nodes: MasterCSSManifestConditionNode[]): Extract<MasterCSSManifestConditionNode, { type: 'number' }> | undefined {
  for (const node of nodes) {
    if (node.type === 'number') return node
    if ('children' in node) {
      const child = findNumberNode(node.children)
      if (child) return child
    }
  }
}

export function getSingleConditionNumberNode(nodes: MasterCSSManifestConditionNode[]) {
  return findNumberNode(nodes)
}

export function parseCondition(token: string, css: MasterCSS = createDefaultCSS()): Condition {
  const alias = token.replace(/^[<>=&@]+/, '')
  return css.conditions.get(alias) || { id: 'media', nodes: [] }
}

export function generateCondition(condition: Condition) {
  const body = condition.nodes
    .map((node) => node.raw || ('value' in node ? String(node.value) : 'name' in node ? node.name : ''))
    .filter(Boolean)
    .join(' ')
  return `@${condition.id}${body ? ` ${body}` : ''}`
}
