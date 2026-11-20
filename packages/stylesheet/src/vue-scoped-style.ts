import {
  findCSSBlockEnd,
  findCSSStatementEnd,
  splitCSSSelectorList
} from '@stet-css/lexer'

const KEYFRAMES_AT_RULE_RE = /^@(?:-[a-z]+-)?keyframes\b/i
const KEYFRAMES_NAME_RE = /(@(?:-[a-z]+-)?keyframes\s+)(-?[_a-zA-Z][-\w]*)/g
const CSS_IDENT_RE = /(?<![-\w])-?[_a-zA-Z][-\w]*/g
const CUSTOM_PROPERTY_VALUE_RE = /(--[-\w]+\s*:)([^;{}]*)/g
const ANIMATION_VALUE_RE = /((?<![-\w])(?:-[a-z]+-)?animation(?:-name)?\s*:)([^;{}]*)/g

/**
 * Wraps every selector of the CSS's style rules in `:global()`, so Vue's scoped style
 * compiler or a CSS Modules pass keeps them as written instead of scoping them. It descends
 * into conditional at-rule blocks; keyframe selectors and declarations are left alone.
 * `rulePrefix` is written right before each wrapped rule's selectors.
 */
export function globalizeSelectors(css: string, rulePrefix = ''): string {
  let output = ''
  let index = 0
  while (index < css.length) {
    const preludeEnd = findCSSStatementEnd(css, index)
    if (preludeEnd.reason !== 'block' || !preludeEnd.delimiterRange) {
      output += css.slice(index, preludeEnd.end)
      index = preludeEnd.end
      continue
    }
    const open = preludeEnd.delimiterRange.start
    const close = findCSSBlockEnd(css, open)
    if (close === -1) {
      output += css.slice(index)
      break
    }
    const prelude = css.slice(index, open)
    const body = css.slice(open + 1, close)
    const trimmedPrelude = prelude.trim()
    if (trimmedPrelude.startsWith('@')) {
      output += prelude + '{' + (KEYFRAMES_AT_RULE_RE.test(trimmedPrelude) ? body : globalizeSelectors(body, rulePrefix)) + '}'
    } else {
      const leading = prelude.slice(0, prelude.length - prelude.trimStart().length)
      const trailing = prelude.slice(prelude.trimEnd().length)
      const selectors = splitCSSSelectorList(trimmedPrelude).map((selector) => `:global(${selector})`)
      output += leading + rulePrefix + selectors.join(',') + trailing + '{' + body + '}'
    }
    index = close + 1
  }
  return output
}

/**
 * Prepares a scoped Vue style block's generated CSS for Vue's scoped style compiler, which
 * runs after this transform:
 * - generated rules (referenced theme variables) are wrapped in `:global()`, since Vue would
 *   otherwise bind `:root` to the component as `[data-v-<id>]:root`;
 * - generated keyframes are renamed `<name>-<id>`, the name Vue gives a scoped block's
 *   keyframes and then leaves alone, and the generated variables and native `animation`
 *   declarations that name them follow. Vue rewrites only `animation` declarations, so a
 *   global variable such as `--animate-fade: fade 1s` would otherwise name keyframes Vue
 *   had renamed. The block's own keyframes are left for Vue to rename.
 */
export function scopeVueGeneratedCSS(nativeCSS: string, generatedCSS: string, scopeId: string) {
  const keyframeNames = new Set(Array.from(generatedCSS.matchAll(KEYFRAMES_NAME_RE), (match) => match[2]))
  const renameKeyframes = (value: string) => value.replace(
    CSS_IDENT_RE,
    (name) => keyframeNames.has(name) ? `${name}-${scopeId}` : name
  )
  const renameValue = (_: string, property: string, value: string) => property + renameKeyframes(value)
  const scopedGeneratedCSS = keyframeNames.size
    ? generatedCSS
      .replace(KEYFRAMES_NAME_RE, (_, atRule: string, name: string) => `${atRule}${name}-${scopeId}`)
      .replace(CUSTOM_PROPERTY_VALUE_RE, renameValue)
    : generatedCSS
  return {
    nativeCSS: keyframeNames.size
      ? nativeCSS.replace(ANIMATION_VALUE_RE, renameValue)
      : nativeCSS,
    generatedCSS: globalizeSelectors(scopedGeneratedCSS)
  }
}
