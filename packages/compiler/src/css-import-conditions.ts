import {
  collectCSSDirectiveRanges,
  findCSSBlockEnd,
  findCSSImportStatements,
  findCSSStatementEnd,
  readCSSIdent,
  removeSourceRanges,
  type CSSDirectiveRangeName,
  type SourceRange
} from '@stet-css/lexer'

/**
 * The conditions an `@import` statement puts its stylesheet under, as written. `layer` is `''` for
 * an anonymous `layer` and absent when the import names no layer.
 */
export interface CSSImportConditions {
  layer?: string
  supports?: string
  media?: string
}

/**
 * Directives the compiler accepts only at the top level of a stylesheet. They configure the
 * manifest rather than emit CSS where they stand, so an import's conditions never wrap them.
 */
const TOP_LEVEL_DIRECTIVE_NAMES = new Set<CSSDirectiveRangeName>([
  'settings',
  'source',
  'safelist',
  'blocklist',
  'preserve',
  'reference',
  'theme',
  'defaults',
  'components',
  'utilities',
  'custom-variant'
])

/** Skips whitespace and comments from `index`. */
function skipCSSTrivia(source: string, index: number, end = source.length) {
  while (index < end) {
    if (/\s/.test(source[index])) {
      index++
    } else if (source.startsWith('/*', index)) {
      const close = source.indexOf('*/', index + 2)
      index = close === -1 ? end : close + 2
    } else {
      break
    }
  }
  return index
}

/** The index just past the `(`…`)` group that opens at `open`, or -1 when it never closes. */
function findParenthesisEnd(source: string, open: number) {
  let depth = 0
  let quote = ''
  for (let index = open; index < source.length; index++) {
    const char = source[index]
    if (quote) {
      if (char === '\\') index++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
    } else if (char === '(') {
      depth++
    } else if (char === ')') {
      depth--
      if (depth === 0) return index + 1
    }
  }
  return -1
}

/** The index just past the URL of the `@import` statement, or -1 when it has none. */
function findImportURLEnd(statement: string) {
  const match = /^\s*@import\s*/i.exec(statement)
  if (!match) return -1
  let index = match[0].length
  const char = statement[index]
  if (char === '"' || char === '\'') {
    for (index++; index < statement.length; index++) {
      if (statement[index] === '\\') index++
      else if (statement[index] === char) return index + 1
    }
    return -1
  }
  if (/^url\(/i.test(statement.slice(index))) return findParenthesisEnd(statement, index + 3)
  return -1
}

function readFunction(source: string, index: number, name: string) {
  if (source.slice(index, index + name.length + 1).toLowerCase() !== `${name}(`) return
  const end = findParenthesisEnd(source, index + name.length)
  if (end === -1) return
  return { value: source.slice(index + name.length + 1, end - 1).trim(), end }
}

/** Reads the `layer`, `supports()` and media conditions of one `@import` statement. */
export function parseCSSImportConditions(statement: string): CSSImportConditions {
  const conditions: CSSImportConditions = {}
  const urlEnd = findImportURLEnd(statement)
  if (urlEnd === -1) return conditions
  const tail = statement.slice(0, statement.lastIndexOf(';') === -1 ? statement.length : statement.lastIndexOf(';'))
  let index = skipCSSTrivia(tail, urlEnd)
  const layer = readFunction(tail, index, 'layer')
  if (layer) {
    conditions.layer = layer.value
    index = skipCSSTrivia(tail, layer.end)
  } else {
    const ident = readCSSIdent(tail, index)
    if (ident.value.toLowerCase() === 'layer' && tail[ident.end] !== '(') {
      conditions.layer = ''
      index = skipCSSTrivia(tail, ident.end)
    }
  }
  const supports = readFunction(tail, index, 'supports')
  if (supports) {
    conditions.supports = supports.value
    index = skipCSSTrivia(tail, supports.end)
  }
  const media = tail.slice(index).replace(/\/\*[\s\S]*?\*\//g, ' ').trim()
  if (media) conditions.media = media
  return conditions
}

/**
 * Puts an inlined stylesheet under the conditions of the `@import` statement that inlined it, as
 * native CSS applies them: `@import "./a.css" layer(a) supports(x) print;` becomes
 * `@media print { @supports (x) { @layer a { … } } }`. Top-level StetCSS directives and the
 * stylesheet's own `@import` statements stay outside those blocks, where they remain valid.
 */
export function applyCSSImportConditions(source: string, statement: string) {
  const conditions = parseCSSImportConditions(statement)
  const openers = [
    ...(conditions.media ? [`@media ${conditions.media} {`] : []),
    ...(conditions.supports ? [`@supports (${conditions.supports}) {`] : []),
    ...(conditions.layer !== undefined ? [conditions.layer ? `@layer ${conditions.layer} {` : '@layer {'] : [])
  ]
  if (!openers.length) return source
  const kept: SourceRange[] = [
    ...collectCSSDirectiveRanges(source).filter((range) => range.depth === 0 && TOP_LEVEL_DIRECTIVE_NAMES.has(range.name)),
    ...findCSSImportStatements(source)
  ].sort((a, b) => a.start - b.start)
  const keptSource = kept.map((range) => source.slice(range.start, range.end)).join('\n')
  const body = removeSourceRanges(source, kept)
  if (!body.trim() && conditions.layer === undefined) return keptSource
  return (keptSource ? keptSource + '\n' : '')
    + openers.join('\n') + '\n'
    + body.trim() + '\n'
    + '}'.repeat(openers.length)
}

interface CSSLayerDeclaration {
  start: number
  name: string
}

const CONDITIONAL_GROUP_AT_RULES = new Set(['media', 'supports', 'container'])

/**
 * Collects the layer names that `@layer` rules declare at the top level of `source`, including inside
 * conditional group rules. A layer a conditional rule declares is declared in the same place when
 * its condition holds and does not exist otherwise, so declaring it unconditionally keeps the order.
 */
function collectCSSLayerDeclarations(source: string, start: number, end: number, declarations: CSSLayerDeclaration[]) {
  let index = skipCSSTrivia(source, start, end)
  while (index < end) {
    const isAtRule = source[index] === '@'
    const name = isAtRule ? readCSSIdent(source, index + 1) : undefined
    const statementEnd = findCSSStatementEnd(source, name ? name.end : index)
    if (statementEnd.end > end) break
    let next = statementEnd.end
    let blockEnd = -1
    if (statementEnd.reason === 'block') {
      blockEnd = findCSSBlockEnd(source, statementEnd.end)
      if (blockEnd === -1 || blockEnd >= end) break
      next = blockEnd + 1
    }
    const atRuleName = name?.value.toLowerCase()
    if (name && atRuleName === 'layer') {
      const preludeEnd = statementEnd.reason === 'semicolon' ? statementEnd.end - 1 : statementEnd.end
      for (const layer of source.slice(name.end, preludeEnd).split(',')) {
        const layerName = layer.trim()
        if (layerName) declarations.push({ start: index, name: layerName })
      }
    } else if (atRuleName && CONDITIONAL_GROUP_AT_RULES.has(atRuleName) && blockEnd !== -1) {
      collectCSSLayerDeclarations(source, statementEnd.end + 1, blockEnd, declarations)
    }
    index = skipCSSTrivia(source, next, end)
  }
  return declarations
}

/** Whether only whitespace, comments, `@charset`, `@layer` statements and `@import` statements precede `end`. */
function hasOnlyImportPreludeBefore(source: string, end: number, imports: SourceRange[]) {
  let index = skipCSSTrivia(source, 0, end)
  let importIndex = 0
  while (index < end) {
    if (imports[importIndex]?.start === index) {
      index = skipCSSTrivia(source, imports[importIndex++].end, end)
      continue
    }
    const name = source[index] === '@' ? readCSSIdent(source, index + 1).value.toLowerCase() : ''
    if (name !== 'charset' && name !== 'layer') return false
    const statementEnd = findCSSStatementEnd(source, index)
    if (statementEnd.reason !== 'semicolon') return false
    index = skipCSSTrivia(source, statementEnd.end, end)
  }
  return true
}

/**
 * Moves the top-level `@import` statements an expanded import graph keeps (packages, URLs and other
 * stylesheets the graph does not inline) to its start, where CSS accepts them. Layers the moved
 * imports would now declare first keep the author's order: when any layer is declared before the
 * last of them, the stylesheet starts with an `@layer` statement listing the layers in the order the
 * graph as written declares them.
 */
export function hoistCSSImportStatements(source: string) {
  const imports = findCSSImportStatements(source)
  if (!imports.length) return source
  const lastImport = imports[imports.length - 1]
  if (hasOnlyImportPreludeBefore(source, lastImport.start, imports)) return source

  const contentLayers = collectCSSLayerDeclarations(source, 0, lastImport.start, [])
  const layerOrder: string[] = []
  if (contentLayers.length) {
    const importLayers = imports.flatMap((statement) => {
      const layer = parseCSSImportConditions(statement.statement).layer
      return layer ? [{ start: statement.start, name: layer }] : []
    })
    for (const { name } of [...contentLayers, ...importLayers].sort((a, b) => a.start - b.start)) {
      if (!layerOrder.includes(name)) layerOrder.push(name)
    }
  }
  return [
    ...(layerOrder.length ? [`@layer ${layerOrder.join(', ')};`] : []),
    ...imports.map((statement) => statement.statement.trim()),
    removeSourceRanges(source, imports).trim()
  ].join('\n')
}
