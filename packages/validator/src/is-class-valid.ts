import type { MasterCSS } from '@stet-css/core'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'
import { isUndeclaredModeError } from '@stet-css/core'

/**
 * Validates that the string is valid Master CSS class syntax.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function isClassValid(
  syntax: string,
  css: MasterCSS = createCSSWithNativeDeclarations(defaultManifest)
): boolean {
  let rules
  try {
    rules = css.generate(syntax)
  } catch (error) {
    if (isUndeclaredModeError(error)) return false
    throw error
  }
  if (rules.length) {
    for (const eachRule of rules) {
      if (validateCSS(eachRule.text).length) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}
