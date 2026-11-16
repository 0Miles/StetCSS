import { StetCSS } from '@stet-css/core'
import type { StetCSSOptions, StetCSSManifest, StetCSSEmittedGlobals, NativeCSSDeclarationMatcher } from '@stet-css/core'
import { lexer, parse, property as propertyName } from 'css-tree'
import { isTargetError } from './validate-css'

const matches = new Map<string, boolean>()

export const cssTreeNativeDeclarationMatcher: NativeCSSDeclarationMatcher = ({ property, value }) => {
  if (propertyName(property).custom) return true

  const cacheKey = property + '\0' + value
  const cached = matches.get(cacheKey)
  if (cached !== undefined) return cached

  let matched = false
  try {
    const ast = parse(value, {
      context: 'value'
    })
    matched = !isTargetError((lexer as any).checkPropertyName(property))
      && !isTargetError(lexer.matchProperty(property, ast).error)
  } catch {
    matched = false
  }

  matches.set(cacheKey, matched)
  return matched
}

export function createCSSWithNativeDeclarations(
  manifest: StetCSSManifest,
  emittedGlobals?: StetCSSEmittedGlobals,
  options: StetCSSOptions = {}
) {
  return StetCSS.create({
    manifest,
    emittedGlobals,
    ...options,
    nativeDeclarationMatcher: options.nativeDeclarationMatcher || cssTreeNativeDeclarationMatcher
  })
}
