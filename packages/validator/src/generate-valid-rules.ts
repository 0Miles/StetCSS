import type { MasterCSS } from '@stet-css/core'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'

type GeneratedRule = ReturnType<MasterCSS['generate']>[number]

/**
 * Keeps only the declarations of a group (`{a:b;c:d}`) whose CSS passes
 * validation, the way a browser drops an invalid declaration and keeps the
 * rest of the block. Each declaration is checked inside the group's own
 * selector and at-rules, so an invalid selector or condition drops them all.
 * Returns `undefined` for non-group rules and for groups with nothing valid.
 */
function reduceGroupToValidDeclarations(rule: GeneratedRule) {
  if (rule.registeredUtility.emit.type !== 'group' || rule.declarationRules || !rule.declarations) return
  const declarations = Object.fromEntries(
    Object.entries(rule.declarations).filter(([property, value]) =>
      !validateCSS(rule.createRuleText({ [property]: value })).length
    )
  ) as NonNullable<GeneratedRule['declarations']>
  if (!Object.keys(declarations).length) return
  // `generate()` builds fresh rules on every call, so nothing else holds this one.
  ;(rule as { declarations: typeof declarations }).declarations = declarations
  return rule
}

/**
 * Generates the rules of a class whose CSS passes validation. A group with
 * invalid declarations keeps its valid ones; any other rule that fails
 * validation drops the whole class.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function generateValidRules(
  syntax: string,
  css = createCSSWithNativeDeclarations(defaultManifest)
) {
  const rules = css.generate(syntax)
  for (const eachRule of rules) {
    if (validateCSS(eachRule.text).length && !reduceGroupToValidDeclarations(eachRule)) {
      return []
    }
  }
  return rules
}
