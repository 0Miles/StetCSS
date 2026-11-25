import { skipCSSEscapeStringOrComment, splitCSSSelectorList } from '@stet-css/lexer'
import { generateSelector, type StetCSS } from '@stet-css/engine/compiler'

/** Stands for the selector an alias attaches to while its text is generated; CSS text never holds U+0000. */
const SELECTOR_ALIAS_HOST = '\u0000'

/**
 * Ends with a functional pseudo-class whose argument is a complex selector list, where `.a *` is
 * valid. `:host()`, `::slotted()` and the rest take one compound, and a combinator there drops
 * the whole rule.
 */
const COMPLEX_SELECTOR_FUNCTION_PATTERN = /(?<![:\\]):(?:is|where|not|has)$/i

/**
 * The items of a `:` selector alias with `:of()`, each split where `generateSelector` puts the
 * class: the ancestor before it and the alias's own text after it (`:hover:of(.a,.b)` is `.a ` +
 * `:hover` and `.b ` + `:hover`). Undefined for an alias without `:of()`.
 */
function getSelectorAliasAncestorItems(nodes: Parameters<typeof generateSelector>[0]) {
  const items = splitCSSSelectorList(generateSelector(nodes, SELECTOR_ALIAS_HOST)).map((item) => {
    const hostIndex = item.indexOf(SELECTOR_ALIAS_HOST)
    return { ancestor: item.slice(0, hostIndex), text: item.slice(hostIndex + SELECTOR_ALIAS_HOST.length) }
  })
  return items.some((item) => item.ancestor) ? items : undefined
}

/**
 * `selector` with its `:` selector aliases replaced by their selectors. An alias that is a list
 * (`>li,+li`) at the top level expands the selector item it sits in once per alias item:
 * `.card:pair` is `.card>li,.card+li`, not `.card>li,+li`, which left `+li` unscoped.
 *
 * An alias with `:of()` reads as it does on a class: each `:of()` item goes before the selector
 * item the alias sits in (`.card:of-a` is `.a .card`, not `.card.a `); inside `:is()`,
 * `:where()`, `:not()` or `:has()` it stands for any element under the ancestor (`:not(.a *)`).
 * Inside any other function, at any depth (`:host()`, `::slotted()`), no compound can express an
 * ancestor, so it keeps its plain text. With `ancestorAliasesOnly`, aliases without `:of()` stay
 * as written, so a caller can place the ancestors before wrapping the selector and resolve the
 * rest after.
 */
export default function resolveSelectorAliases(selector: string, css: StetCSS, ancestorAliasesOnly = false) {
  const selectorTokens = [...css.selectors.keys()]
    .filter((token) => token.startsWith(':'))
    .sort((a, b) => b.length - a.length)
  if (!selectorTokens.length) return selector

  const items: string[] = []
  let alternatives = ['']
  const append = (text: string) => {
    alternatives = alternatives.map((alternative) => alternative + text)
  }
  let attributeDepth = 0
  /** One entry per open parenthesis: whether its argument takes complex selectors. */
  const parens: boolean[] = []
  for (let index = 0; index < selector.length;) {
    const skipped = skipCSSEscapeStringOrComment(selector, index)
    if (skipped !== index) {
      append(selector.slice(index, skipped))
      index = skipped
      continue
    }
    const char = selector[index]
    if (char === '[') {
      attributeDepth++
      append(char)
      index++
      continue
    }
    if (char === ']') {
      if (attributeDepth > 0) attributeDepth--
      append(char)
      index++
      continue
    }
    if (!attributeDepth) {
      if (char === '(') parens.push(COMPLEX_SELECTOR_FUNCTION_PATTERN.test(selector.slice(0, index)))
      else if (char === ')' && parens.length) parens.pop()
      else if (char === ',' && !parens.length) {
        items.push(...alternatives)
        alternatives = ['']
        index++
        continue
      }
      const matchedToken = selectorTokens.find((token) => {
        if (!selector.startsWith(token, index)) return false
        const next = selector[index + token.length]
        return next === undefined || next === '(' || !/[-_a-zA-Z0-9]/.test(next)
      })
      if (matchedToken) {
        const nodes = css.selectors.get(matchedToken)
        const ancestorItems = nodes?.length ? getSelectorAliasAncestorItems(nodes) : undefined
        if (nodes && ancestorItems && parens.every(Boolean)) {
          alternatives = parens.length
            ? alternatives.map((alternative) => alternative + generateSelector(nodes, '*'))
            : alternatives.flatMap((alternative) => ancestorItems.map(({ ancestor, text }) => ancestor + alternative + text))
          index += matchedToken.length
          continue
        }
        if (ancestorAliasesOnly) {
          append(matchedToken)
          index += matchedToken.length
          continue
        }
        if (nodes?.length) {
          const text = generateSelector(nodes, '')
          const aliasItems = parens.length ? [] : splitCSSSelectorList(text)
          alternatives = aliasItems.length > 1
            ? alternatives.flatMap((alternative) => aliasItems.map((aliasItem) => alternative + aliasItem))
            : alternatives.map((alternative) => alternative + text)
          index += matchedToken.length
          continue
        }
      }
    }
    append(char)
    index++
  }

  return [...items, ...alternatives].join(',')
}
