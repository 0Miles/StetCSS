import { escapeRegExp, findCSSStatementEnd, skipCSSEscapeStringOrComment } from './source'

export const STET_CSS_PACKAGE_MODULE_IDS = ['@stet-css/core'] as const

const STET_CSS_PACKAGE_MODULE_ID_SET = new Set<string>(STET_CSS_PACKAGE_MODULE_IDS)

export interface CSSImportStatement {
  start: number
  end: number
  statement: string
}

export function normalizeStetCSSModuleIds(): Set<string> {
  return new Set(STET_CSS_PACKAGE_MODULE_IDS)
}

export function isStetCSSModuleId(id: string) {
  return STET_CSS_PACKAGE_MODULE_ID_SET.has(id)
}

export function createStetCSSImportPattern() {
  const ids = [...normalizeStetCSSModuleIds()].map(escapeRegExp)
  return new RegExp(String.raw`@import\s+(?:url\(\s*)?(['"])(?:${ids.join('|')})\1\s*\)?[^;]*;`)
}

/** A stylesheet entry is recognised by its `@stet-css/core` import alone. */
export function createStetCSSManifestEntryPattern() {
  return createStetCSSImportPattern()
}

export function findCSSImportEnd(source: string, start: number) {
  const statementEnd = findCSSStatementEnd(source, start)
  return statementEnd.reason === 'semicolon' ? statementEnd.end : -1
}

export function parseCSSImportSource(statement: string) {
  const match = /^\s*@import\s+(?:(["'])(.*?)\1|url\(\s*(?:(["'])(.*?)\3|([^'")\s]+))\s*\))[^;]*;\s*$/s.exec(statement)
  return match?.[2] || match?.[4] || match?.[5]
}

export function findCSSImportStatements(source: string) {
  const imports: CSSImportStatement[] = []
  let depth = 0
  for (let index = 0; index < source.length; index++) {
    const skipped = skipCSSEscapeStringOrComment(source, index)
    if (skipped !== index) {
      index = skipped - 1
      continue
    }
    const char = source[index]
    if (char === '{') {
      depth++
      continue
    }
    if (char === '}') {
      depth--
      continue
    }
    if (depth === 0 && source.startsWith('@import', index) && /\s/.test(source[index + '@import'.length] || '')) {
      const end = findCSSImportEnd(source, index)
      if (end === -1) continue
      imports.push({
        start: index,
        end,
        statement: source.slice(index, end)
      })
      index = end - 1
    }
  }
  return imports
}

export function replaceStetCSSImports(source: string, replacement: string) {
  let replaced = false
  const code = source.replace(/@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g, (rule, _quote: string, id: string) => {
    if (!isStetCSSModuleId(id)) return rule
    replaced = true
    return replacement
  })
  return { code, replaced }
}

export function hasStetCSSImport(source: string) {
  return replaceStetCSSImports(source, '').replaced
}

export function hasStetCSSManifestEntrypoint(source: string) {
  return hasStetCSSImport(source)
}
