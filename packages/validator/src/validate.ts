import { type SyntaxError } from './types/syntax-error'
import type { StetCSS } from '@stet-css/core'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'
import { tryGenerate } from '@stet-css/core'

/**
 * @description Report errors for a given class. For pure validity, use the more performant `isClassValid()`.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function validate(
  syntax: string,
  css: StetCSS = createCSSWithNativeDeclarations(defaultManifest)
): {
  matched: boolean,
  errors: SyntaxError[]
} {
  const { rules, error } = tryGenerate(css, syntax)
  if (error) {
    return {
      matched: false,
      errors: [{ class: syntax, message: error.message, rawMessage: 'UndeclaredMode', code: 'undeclared-mode' }]
    }
  }
  if (rules.length) {
    const errors = []
    for (const eachRule of rules) {
      const syntaxErrors = validateCSS(eachRule.text)
      for (const eachUtilityError of syntaxErrors) {
        eachUtilityError.class = syntax
        errors.push(eachUtilityError)
      }
    }
    return {
      matched: true,
      errors
    }
  } else {
    return {
      matched: false,
      errors: [{
        class: syntax,
        message: `'${syntax}' is not a valid Master CSS class`,
        rawMessage: 'Mismatch'
      }]
    }
  }
}
