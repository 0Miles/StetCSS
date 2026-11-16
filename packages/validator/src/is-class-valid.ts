import type { StetCSS } from '@stet-css/core'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'
import { tryGenerate } from '@stet-css/core'

/**
 * Validates that the string is valid StetCSS class syntax.
 * @argument syntax A potential StetCSS syntactic class
 * @argument css a StetCSS instance
 */
export default function isClassValid(
  syntax: string,
  css: StetCSS = createCSSWithNativeDeclarations(defaultManifest)
): boolean {
  const { rules } = tryGenerate(css, syntax)
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
