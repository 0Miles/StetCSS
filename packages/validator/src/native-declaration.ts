import { StetCSS } from '@stet-css/core'
import type { StetCSSOptions, StetCSSManifest, StetCSSEmittedGlobals, NativeCSSDeclarationMatcher } from '@stet-css/core'
import { cssTreeNativeDeclarationMatcher } from '@stet-css/compiler/native-declaration'

export { cssTreeNativeDeclarationMatcher }

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
