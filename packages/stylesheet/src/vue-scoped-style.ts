import {
  findCSSBlockEnd,
  findCSSStatementEnd,
  splitStetCSSTopLevel
} from '@stet-css/lexer'

/**
 * Whether the request is a Vue SFC `<style scoped>` block: Vite's `scoped=<hash>` and
 * vue-loader's `scoped=true` both carry the `scoped` key beside `vue&type=style`.
 */
export function isScopedVueStyleRequest(id: string) {
  const queryStart = id.indexOf('?')
  if (queryStart === -1) return false
  const params = new URLSearchParams(id.slice(queryStart + 1))
  return params.has('vue') && params.get('type') === 'style' && params.has('scoped')
}

const KEYFRAMES_AT_RULE_RE = /^@(?:-[a-z]+-)?keyframes\b/i

/**
 * Wraps every selector of the CSS's style rules in `:global()`, so Vue's scoped style
 * compiler, which runs after this transform, keeps them as written instead of appending
 * the component attribute. It descends into conditional at-rule blocks; keyframe selectors
 * and declarations are left alone.
 */
export function globalizeVueScopedCSS(css: string) {
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
      output += prelude + '{' + (KEYFRAMES_AT_RULE_RE.test(trimmedPrelude) ? body : globalizeVueScopedCSS(body)) + '}'
    } else {
      const leading = prelude.slice(0, prelude.length - prelude.trimStart().length)
      const trailing = prelude.slice(prelude.trimEnd().length)
      const selectors = splitStetCSSTopLevel(trimmedPrelude, ',')
        .map(({ start, end }) => `:global(${trimmedPrelude.slice(start, end).trim()})`)
      output += leading + selectors.join(',') + trailing + '{' + body + '}'
    }
    index = close + 1
  }
  return output
}
