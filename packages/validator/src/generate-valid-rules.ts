import type { GeneratedRule } from '@stet-css/core'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'

type Declarations = NonNullable<GeneratedRule['declarations']>

/**
 * Returns the declarations of a group (`{a:b;c:d}`) whose CSS passes
 * validation, the way a browser drops an invalid declaration and keeps the
 * rest of the block. Each declaration is checked inside the group's own
 * selector and at-rules, so an invalid selector or condition drops them all.
 * Returns `undefined` for non-group rules and for groups with nothing valid.
 */
function getValidGroupDeclarations(rule: GeneratedRule): Declarations | undefined {
  if (rule.registeredUtility.emit.type !== 'group' || !rule.declarations) return
  const declarations = Object.fromEntries(
    Object.entries(rule.declarations).filter(([property, value]) =>
      !validateCSS(rule.createRuleText({ [property]: value })).length
    )
  ) as Declarations
  return Object.keys(declarations).length ? declarations : undefined
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
    if (!validateCSS(eachRule.text).length) continue
    const validDeclarations = getValidGroupDeclarations(eachRule)
    if (!validDeclarations) return []
    // `generate()` builds fresh rules on every call, so nothing else holds this
    // one; its `text` getter renders from `declarations`.
    ;(eachRule as { declarations: Declarations }).declarations = validDeclarations
  }
  return rules
}
