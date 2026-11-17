import type { NativeCSSDeclarationMatcher } from '@stet-css/engine'
import { clone, generate, lexer, List, parse, property as propertyName, walk } from 'css-tree'
import type { CssNode, FunctionNode } from 'css-tree'

/*
 * The one css-tree check of native `property: value` declarations. The compiler lowers
 * `@compose` with it, and `@stet-css/validator` re-exports it to build, lint and validate class
 * CSS, so every build and editor path accepts the same declarations. It lives here because
 * the compiler cannot depend on the validator.
 */

const matches = new Map<string, boolean>()

function isTargetError(error: unknown): error is Error {
  return !!error
    && typeof error === 'object'
    && 'name' in error
    && (
      error.name === 'SyntaxError'
      || error.name === 'SyntaxMatchError'
      || error.name === 'SyntaxReferenceError'
    )
}

/*
 * Narrow exceptions for native syntax that css-tree 3.2.1, the latest release, rejects.
 * css-tree stays the parser and its grammar data stays unpatched: each exception recognises
 * one construct, rewrites it into syntax css-tree already accepts in the same position, and
 * lets css-tree judge the whole declaration again. They run only after css-tree rejects a
 * value. Each has accepting and rejecting rows in `tests/native-declaration.test.ts`.
 */

/**
 * `container-type: scroll-state` (CSS Conditional 5). css-tree's `data/patch.json` pins the
 * older `normal || [ size | inline-size ]`.
 */
const containerTypeSyntax = 'normal | [ [ size | inline-size ] || scroll-state ]'

const resolutionUnits = new Set(['x', 'dppx', 'dpi', 'dpcm'])

/**
 * `image-set()` options without a resolution (CSS Images 4: `[ <resolution> || type() ]?`).
 * css-tree requires the resolution, so each option without one gets the default `1x`.
 */
function addDefaultImageSetResolutions(node: FunctionNode) {
  const options: CssNode[][] = [[]]
  node.children.forEach((child) => {
    if (child.type === 'Operator' && child.value === ',') options.push([])
    else options[options.length - 1].push(child)
  })
  const children: CssNode[] = []
  options.forEach((option, index) => {
    if (index) children.push({ type: 'Operator', value: ',' })
    children.push(...option)
    if (option.length && !option.some((child) => child.type === 'Dimension' && resolutionUnits.has(child.unit.toLowerCase()))) {
      children.push({ type: 'Dimension', value: '1', unit: 'x' })
    }
  })
  node.children = new List<CssNode>().fromArray(children)
}

/** The size keywords css-tree's `<intrinsic-size-keyword>` leaves out of `<calc-size-basis>`. */
const calcSizeBasisKeywords = new Set(['auto', 'stretch'])

/**
 * `calc-size()` (CSS Values 5). css-tree's `<calc-size-basis>` lacks the `auto` and `stretch`
 * size keywords, valid where the property itself takes them, and its `<calc-sum>` lacks the
 * `size` keyword of the second argument, invalid after an `any` basis. The keyword basis
 * becomes `fit-content` and `size` becomes `0px`.
 */
function substituteCalcSizeKeywords(node: FunctionNode, property: string) {
  const [basis, comma, ...calculation] = node.children.toArray()
  if (!basis || comma?.type !== 'Operator' || comma.value !== ',') return
  if (basis.type === 'Identifier') {
    const keyword = basis.name.toLowerCase()
    if (keyword === 'any') return
    if (calcSizeBasisKeywords.has(keyword)) {
      if (isTargetError(lexer.matchProperty(property, keyword).error)) return
      basis.name = 'fit-content'
    }
  }
  for (const part of calculation) {
    walk(part, (child) => {
      if (child.type === 'Identifier' && child.name.toLowerCase() === 'size') {
        const dimension = child as unknown as Record<string, unknown>
        delete dimension.name
        Object.assign(dimension, { type: 'Dimension', value: '0', unit: 'px' })
      }
    })
  }
}

function matchesCSSTreeGapException(property: string, value: CssNode) {
  if (property.toLowerCase() === 'container-type') {
    return !isTargetError(lexer.match(containerTypeSyntax, value).error)
  }

  const source = generate(value)
  if (!/(?:image-set|calc-size)\(/i.test(source)) return false

  const substitute = clone(value.type === 'Raw' ? parse(source, { context: 'value' }) : value)
  // Collected on leave: a nested `calc-size()` basis is rewritten before its parent reads it.
  const functions: FunctionNode[] = []
  walk(substitute, {
    visit: 'Function',
    leave(node) {
      functions.push(node)
    }
  })
  for (const node of functions) {
    const name = node.name.toLowerCase()
    if (name === 'image-set') addDefaultImageSetResolutions(node)
    else if (name === 'calc-size') substituteCalcSizeKeywords(node, property)
  }
  return !isTargetError(lexer.matchProperty(property, substitute).error)
}

/**
 * Matches `value` against the grammar of the standard `property` and returns css-tree's syntax
 * error, or `null` when the value matches. Takes a parsed value or css-tree's unparsed `Raw`
 * node. Check the property name with `checkNativePropertyName` first. Errors css-tree raises
 * for values it cannot match at all, such as `var()`, count as a match.
 */
export function matchNativeDeclarationValue(property: string, value: CssNode): Error | null {
  const { error } = lexer.matchProperty(property, value)
  if (!isTargetError(error)) return null
  try {
    return matchesCSSTreeGapException(property, value) ? null : error
  } catch {
    return error
  }
}

/** Returns css-tree's error for an unknown standard property name, or `null` for a known one. */
export function checkNativePropertyName(property: string): Error | null {
  const error = (lexer as any).checkPropertyName(property)
  return isTargetError(error) ? error : null
}

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
    matched = !checkNativePropertyName(property)
      && !matchNativeDeclarationValue(property, ast)
  } catch {
    matched = false
  }

  matches.set(cacheKey, matched)
  return matched
}
