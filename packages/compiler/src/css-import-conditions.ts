import {
  collectCSSDirectiveRanges,
  findCSSBlockEnd,
  findCSSClosingQuote,
  findCSSCommentEnd,
  findCSSFunctionEnd,
  findCSSImportStatements,
  findCSSStatementEnd,
  readCSSFunction,
  readCSSIdent,
  removeSourceRanges,
  skipCSSEscapeStringOrComment,
  skipCSSWhitespace,
  type SourceRange
} from '@stet-css/lexer'
import { TOP_LEVEL_CSS_DIRECTIVE_NAMES } from './lexer/standalone-directives'
import wrapConditions from './utils/wrap-conditions'

/**
 * The conditions an `@import` statement puts its stylesheet under, as written. `layer` is `''` for
 * an anonymous `layer` and absent when the import names no layer.
 */
interface CSSImportConditions {
  url: string
  layer?: string
  supports?: string
  media?: string
}

/** Skips whitespace and comments from `index`. */
function skipCSSTrivia(source: string, index: number, end = source.length) {
  for (;;) {
    index = skipCSSWhitespace(source, index)
    if (index >= end || !source.startsWith('/*', index)) return Math.min(index, end)
    index = findCSSCommentEnd(source, index, end)
  }
}

/** The index just past the URL of the `@import` statement, or -1 when it has none. */
function findImportURLEnd(statement: string, start: number) {
  const char = statement[start]
  if (char === '"' || char === '\'') {
    const close = findCSSClosingQuote(statement, start, char)
    return statement[close] === char && close > start ? close + 1 : -1
  }
  if (statement.slice(start, start + 4).toLowerCase() !== 'url(') return -1
  return findCSSFunctionEnd(statement, start + 3) ?? -1
}

/** Reads the URL and the `layer`, `supports()` and media conditions of one `@import` statement. */
function parseCSSImportConditions(statement: string): CSSImportConditions | undefined {
  const keyword = /^\s*@import\s*/i.exec(statement)
  if (!keyword) return
  const urlStart = keyword[0].length
  const urlEnd = findImportURLEnd(statement, urlStart)
  if (urlEnd === -1) return
  const semicolon = statement.lastIndexOf(';')
  const end = semicolon === -1 ? statement.length : semicolon
  const conditions: CSSImportConditions = { url: statement.slice(urlStart, urlEnd) }
  let index = skipCSSTrivia(statement, urlEnd, end)
  const layer = readCSSFunction(statement, index, 'layer', end)
  if (layer) {
    conditions.layer = layer.body.trim()
    index = skipCSSTrivia(statement, layer.end, end)
  } else {
    const ident = readCSSIdent(statement, index)
    if (ident.value.toLowerCase() === 'layer') {
      conditions.layer = ''
      index = skipCSSTrivia(statement, ident.end, end)
    }
  }
  const supports = readCSSFunction(statement, index, 'supports', end)
  if (supports) {
    conditions.supports = supports.body.trim()
    index = skipCSSTrivia(statement, supports.end, end)
  }
  const media = statement.slice(index, end).replace(/\/\*[\s\S]*?\*\//g, ' ').trim()
  if (media) conditions.media = media
  return conditions
}

function hasTopLevelComma(source: string) {
  let depth = 0
  for (let index = 0; index < source.length; index++) {
    const skipped = skipCSSEscapeStringOrComment(source, index)
    if (skipped !== index) {
      index = skipped - 1
      continue
    }
    const char = source[index]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && depth === 0) return true
  }
  return false
}

/**
 * Combines two media query lists so a stylesheet matches only where both match, or returns
 * `undefined` when one media query cannot say it: lists of several queries, queries that start with
 * `not` or `only`, and two queries that each name a media type.
 */
function combineMediaQueries(outer: string | undefined, inner: string | undefined): string | null | undefined {
  if (!outer || !inner) return outer || inner
  if (outer === inner) return outer
  if (hasTopLevelComma(outer) || hasTopLevelComma(inner) || /^(?:not|only)\b/i.test(outer) || /^(?:not|only)\b/i.test(inner)) return null
  const outerIsCondition = outer.startsWith('(')
  const innerIsCondition = inner.startsWith('(')
  if (outerIsCondition && innerIsCondition) return `(${outer}) and (${inner})`
  if (innerIsCondition) return `${outer} and (${inner})`
  if (outerIsCondition) return `${inner} and (${outer})`
  return null
}

/**
 * Rewrites an `@import` statement a conditioned stylesheet keeps so it carries the conditions of
 * the import that inlined that stylesheet too, as CSS would apply both: layers nest, `supports()`
 * and media conditions must all hold.
 */
function addCSSImportConditions(statement: string, outer: CSSImportConditions, outerStatement: string) {
  const inner = parseCSSImportConditions(statement)
  if (!inner) return statement.trim()
  const fail = (reason: string) => new Error(
    `${statement.trim()} is kept as an @import inside ${outerStatement.trim()}, but ${reason}; move the import into the importing stylesheet`
  )
  let layer = inner.layer
  if (outer.layer !== undefined) {
    if (outer.layer === '') throw fail('an anonymous layer cannot be named on the kept import')
    if (inner.layer === '') throw fail('an anonymous layer cannot be named inside a named one')
    layer = inner.layer === undefined ? outer.layer : `${outer.layer}.${inner.layer}`
  }
  const supports = outer.supports && inner.supports
    ? `(${outer.supports}) and (${inner.supports})`
    : outer.supports || inner.supports
  const media = combineMediaQueries(outer.media, inner.media)
  if (media === null) throw fail(`one media query cannot require both "${outer.media}" and "${inner.media}"`)
  return [
    `@import ${inner.url}`,
    ...(layer !== undefined ? [layer ? `layer(${layer})` : 'layer'] : []),
    ...(supports ? [`supports(${supports})`] : []),
    ...(media ? [media] : [])
  ].join(' ') + ';'
}

/**
 * Puts an inlined stylesheet under the conditions of the `@import` statement that inlined it, as
 * native CSS applies them: `@import "./a.css" layer(a) supports(x) print;` becomes
 * `@media print { @supports (x) { @layer a { … } } }`. Top-level StetCSS directives stay outside
 * those blocks, where the compiler accepts them, and so do the stylesheet's own `@import`
 * statements, which take the outer conditions on top of theirs. Throws when CSS cannot express
 * a kept import under both sets of conditions.
 */
export function applyCSSImportConditions(source: string, statement: string) {
  const conditions = parseCSSImportConditions(statement)
  if (!conditions) return source
  const wrappers = [
    ...(conditions.media ? [`@media ${conditions.media}`] : []),
    ...(conditions.supports ? [`@supports (${conditions.supports})`] : []),
    ...(conditions.layer !== undefined ? [conditions.layer ? `@layer ${conditions.layer}` : '@layer'] : [])
  ]
  if (!wrappers.length) return source
  const directives = collectCSSDirectiveRanges(source)
    .filter((range) => range.depth === 0 && TOP_LEVEL_CSS_DIRECTIVE_NAMES.has(range.name))
  const imports = findCSSImportStatements(source)
  const kept: (SourceRange & { text: string })[] = [
    ...directives.map((range) => ({ ...range, text: source.slice(range.start, range.end) })),
    ...imports.map((range) => ({ ...range, text: addCSSImportConditions(range.statement, conditions, statement) }))
  ].sort((a, b) => a.start - b.start)
  const body = removeSourceRanges(source, kept).trim()
  // An empty stylesheet still declares its layer where it is imported.
  const wrapped = body || conditions.layer !== undefined ? wrapConditions(`\n${body}\n`, wrappers) : ''
  return [...kept.map((range) => range.text), wrapped].filter(Boolean).join('\n')
}

/** Reads the names a top-level `@layer` statement or block prelude declares. */
function readLayerNames(prelude: string) {
  return prelude.split(',').map((name) => name.trim()).filter(Boolean)
}

interface TopLevelStatement extends SourceRange {
  /** The at-rule name in lower case, or `''` for a style rule. */
  name: string
  prelude: string
  isBlock: boolean
}

/** Walks the top-level statements of `source` that start before `limit`. */
function* walkTopLevelStatements(source: string, limit = source.length): Generator<TopLevelStatement> {
  let index = skipCSSTrivia(source, 0)
  while (index < limit) {
    const ident = source[index] === '@' ? readCSSIdent(source, index + 1) : undefined
    const preludeStart = ident ? ident.end : index
    const statementEnd = findCSSStatementEnd(source, preludeStart)
    if (statementEnd.reason === 'eof') return
    const isBlock = statementEnd.reason === 'block'
    const blockEnd = isBlock ? findCSSBlockEnd(source, statementEnd.end) : -1
    if (isBlock && blockEnd === -1) return
    const end = isBlock ? blockEnd + 1 : statementEnd.end
    yield {
      start: index,
      end,
      name: ident ? ident.value.toLowerCase() : '',
      prelude: source.slice(preludeStart, isBlock ? statementEnd.end : statementEnd.end - 1),
      isBlock
    }
    index = skipCSSTrivia(source, end)
  }
}

/**
 * Moves the top-level `@import` statements an expanded import graph keeps (packages, URLs and
 * stylesheets the graph does not inline) to its start, where CSS accepts them, and keeps the layer
 * order the graph was written in. Every layer declared before the last kept import moves ahead with
 * the imports, in written order: top-level `@layer` statements move as they are, and a layer that
 * only a top-level `@layer` block declares (such as the wrapper of a conditioned import) gets an
 * `@layer <name>;` statement there while its block stays where it was.
 *
 * Layers declared only inside conditional rules (`@media`, `@supports`, `@container`) stay put:
 * declaring them up front would place them ahead of later layers where the condition fails. Where
 * the condition holds, a kept layered import that followed them now declares its layer first.
 */
export function hoistCSSImportStatements(source: string) {
  const imports = findCSSImportStatements(source)
  if (!imports.length) return source
  const lastImport = imports[imports.length - 1]
  const statements = [...walkTopLevelStatements(source, lastImport.end)]
  if (statements.every((statement) => !statement.isBlock && ['charset', 'import', 'layer'].includes(statement.name))) return source

  const moved: SourceRange[] = []
  const prelude: string[] = []
  const declared = new Set<string>()
  for (const statement of statements) {
    if (statement.name === 'import') {
      const layer = parseCSSImportConditions(source.slice(statement.start, statement.end))?.layer
      if (layer) declared.add(layer)
    } else if (statement.name === 'layer') {
      const names = readLayerNames(statement.prelude)
      if (statement.isBlock) {
        const undeclared = names.filter((name) => !declared.has(name))
        if (undeclared.length) prelude.push(`@layer ${undeclared.join(', ')};`)
      }
      for (const name of names) declared.add(name)
      if (statement.isBlock) continue
    } else {
      continue
    }
    moved.push(statement)
    prelude.push(source.slice(statement.start, statement.end).trim())
  }
  return [...prelude, removeSourceRanges(source, moved).trim()].filter(Boolean).join('\n')
}

/**
 * The layers `source` declares at its top level, outside conditional rules, in order: the names of
 * its `@layer` statements and blocks. Layers of `@import` statements are not counted.
 */
export function collectCSSLayerOrder(source: string) {
  const order = new Set<string>()
  for (const statement of walkTopLevelStatements(source)) {
    if (statement.name === 'layer') readLayerNames(statement.prelude).forEach((name) => order.add(name))
  }
  return [...order]
}
