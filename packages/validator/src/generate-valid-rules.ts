import type { GeneratedRule } from '@stet-css/core'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'

type Declarations = NonNullable<GeneratedRule['declarations']>

/**
 * Returns a group's declarations without the ones its validation errors name.
 * Returns `undefined` for non-group rules, for errors not tied to a single
 * declaration (parse, at-rule), and for groups with nothing valid left.
 */
function getValidGroupDeclarations(
  rule: GeneratedRule,
  errors: ReturnType<typeof validateCSS>
): Declarations | undefined {
  if (rule.registeredUtility.emit.type !== 'group' || !rule.declarations) return
  const invalidProperties = new Set<string>()
  for (const error of errors) {
    if (!error.property || error.atrule) return
    invalidProperties.add(error.property)
  }
  const declarations = Object.fromEntries(
    Object.entries(rule.declarations).filter(([property]) => !invalidProperties.has(property))
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
    const errors = validateCSS(eachRule.text)
    if (!errors.length) continue
    const validDeclarations = getValidGroupDeclarations(eachRule, errors)
    if (!validDeclarations) return []
    // `generate()` builds fresh rules on every call, so nothing else holds this
    // one; its `text` getter renders from `declarations`.
    ;(eachRule as { declarations: Declarations }).declarations = validDeclarations
  }
  return rules
}
