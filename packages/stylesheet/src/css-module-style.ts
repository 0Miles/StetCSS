import { globalizeSelectors } from './vue-scoped-style'

/**
 * Makes a global selector pure for CSS Modules: the class is local, so the selector holds a
 * local class, while `:not()` of a class no element carries matches every element and
 * `:where()` adds no specificity.
 */
const CSS_MODULE_PURE_SUFFIX = ':where(:not(.stet-css-global))'

/**
 * Prepares a CSS Module's generated CSS for the bundler's CSS Modules pass, which runs after
 * this transform (#244). Every selector of the generated rules (referenced theme variables) is
 * wrapped in `:global()`, since the pass would otherwise rename the class trigger's `.dark`,
 * and gets a local class that matches nothing more, since pure mode (Next.js under webpack)
 * rejects a selector without one, such as `:root`. A `cssmodules-pure-ignore` comment would not
 * do: Next compiles Sass modules with `style: compressed` in production, which drops comments.
 * Generated keyframes stay as written, so the pass still renames them: Turbopack cannot
 * parse `@keyframes :global(name)`.
 */
export function globalizeCSSModuleGeneratedCSS(generatedCSS: string) {
  return globalizeSelectors(generatedCSS, CSS_MODULE_PURE_SUFFIX)
}
