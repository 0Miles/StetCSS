import { globalizeSelectors } from './vue-scoped-style'

/** Exempts the rule after it from the pure mode of `postcss-modules-local-by-default`. */
const CSS_MODULES_PURE_IGNORE_COMMENT = '/* cssmodules-pure-ignore */'

/**
 * Prepares a CSS Module's generated CSS for the bundler's CSS Modules pass, which runs after
 * this transform (#244):
 * - generated rules (referenced theme variables) are wrapped in `:global()`, since the pass
 *   would otherwise rename the class trigger's `.dark` and the mode's variables never apply;
 * - each is preceded by a `cssmodules-pure-ignore` comment, since pure mode (Next.js under
 *   webpack) rejects a rule without a local class, such as `:root`. Turbopack has no pure
 *   check for these rules and ignores the comment.
 * Generated keyframes stay as written, so the pass still renames them: Turbopack cannot
 * parse `@keyframes :global(name)`.
 */
export function globalizeCSSModuleGeneratedCSS(generatedCSS: string) {
  return globalizeSelectors(generatedCSS, CSS_MODULES_PURE_IGNORE_COMMENT)
}
