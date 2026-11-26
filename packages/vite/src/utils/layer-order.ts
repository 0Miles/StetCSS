/**
 * A host source declares the layers written before its kept `@import` statements in `@layer`
 * statements ahead of them. Vite's build finalizes each CSS asset by hoisting every `@import` to
 * its start, past those statements, which declares the imports' layers first. These helpers record
 * the statements a build host source leads with and move them back ahead of the hoisted imports.
 */

/** Names of a `@layer` statement, normalized so the written and the minified form compare equal. */
function normalizeLayerNames(prelude: string) {
  return prelude.split(',').map((name) => name.trim()).filter(Boolean).join(',')
}

function skipTrivia(css: string, index: number) {
  for (;;) {
    while (/\s/.test(css[index] || '')) index++
    if (!css.startsWith('/*', index)) return index
    const end = css.indexOf('*/', index + 2)
    index = end === -1 ? css.length : end + 2
  }
}

/** The index just past the `;` that ends the at-rule statement starting at `start`, or -1. */
function findStatementEnd(css: string, start: number) {
  let depth = 0
  for (let index = start; index < css.length; index++) {
    const char = css[index]
    if (char === '"' || char === '\'') {
      for (index++; index < css.length && css[index] !== char; index++) {
        if (css[index] === '\\') index++
      }
    } else if (char === '(') {
      depth++
    } else if (char === ')') {
      depth--
    } else if (char === '{' || char === '}') {
      return -1
    } else if (char === ';' && depth === 0) {
      return index + 1
    }
  }
  return -1
}

interface LayerStatement {
  start: number
  end: number
  names: string
}

function readStatement(css: string, index: number, keyword: '@charset' | '@import' | '@layer') {
  if (!css.startsWith(keyword, index) || !/[\s"'u]/.test(css[index + keyword.length] || '')) return
  const end = findStatementEnd(css, index)
  return end === -1 ? undefined : { start: index, end, prelude: css.slice(index + keyword.length, end - 1) }
}

function readLayerStatements(css: string, index: number) {
  const statements: LayerStatement[] = []
  for (let statement = readStatement(css, index, '@layer'); statement; statement = readStatement(css, index, '@layer')) {
    statements.push({ start: statement.start, end: statement.end, names: normalizeLayerNames(statement.prelude) })
    index = skipTrivia(css, statement.end)
  }
  return { statements, end: index }
}

/** The `@layer` statements a host source declares ahead of a kept `@import`, by their names. */
export function collectLayerStatementsBeforeImports(hostSource: string) {
  const { statements, end } = readLayerStatements(hostSource, skipTrivia(hostSource, 0))
  return readStatement(hostSource, end, '@import') ? statements.map((statement) => statement.names) : []
}

/**
 * Moves the `@layer` statements that directly follow the hoisted `@import` statements at the start
 * of a built CSS asset back ahead of them, when they are statements a host source led with
 * (`hostStatements`, from `collectLayerStatementsBeforeImports`). Other CSS is left as it is.
 *
 * `leadingLayers`, the layers every entry wrote before `@import '@stet-css/core'`, are declared
 * first in the first statement moved: a host source lists only its own entry's layers, while the
 * CSS spliced in after the imports leads with every entry's (#250).
 */
export function restoreLayerStatementsBeforeImports(
  css: string,
  hostStatements: ReadonlySet<string>,
  leadingLayers: readonly string[] = []
) {
  if (!hostStatements.size) return css
  let index = skipTrivia(css, 0)
  const charset = readStatement(css, index, '@charset')
  if (charset) index = skipTrivia(css, charset.end)
  const importsStart = index
  for (let statement = readStatement(css, index, '@import'); statement; statement = readStatement(css, index, '@import')) {
    index = skipTrivia(css, statement.end)
  }
  if (index === importsStart) return css
  const importsEnd = index
  const moved = readLayerStatements(css, importsEnd).statements
  const hostCount = moved.findIndex((statement) => !hostStatements.has(statement.names))
  const restored = hostCount === -1 ? moved : moved.slice(0, hostCount)
  if (!restored.length) return css
  const restoredEnd = restored[restored.length - 1].end
  const [first, ...rest] = restored
  const firstNames = [...new Set([...leadingLayers, ...first.names.split(',')])].join(',')
  return css.slice(0, importsStart)
    + (firstNames === first.names ? css.slice(first.start, first.end) : `@layer ${firstNames};`)
    + rest.map((statement) => css.slice(statement.start, statement.end)).join('')
    + css.slice(importsStart, importsEnd)
    + css.slice(restoredEnd)
}
