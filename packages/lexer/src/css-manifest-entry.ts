import { escapeRegExp, findCSSStatementEnd } from './source'

export const MASTER_CSS_PACKAGE_MODULE_IDS = ['@stet-css/core'] as const

const MASTER_CSS_PACKAGE_MODULE_ID_SET = new Set<string>(MASTER_CSS_PACKAGE_MODULE_IDS)

export interface CSSImportStatement {
  start: number
  end: number
  statement: string
}

export function normalizeMasterCSSModuleIds(): Set<string> {
  return new Set(MASTER_CSS_PACKAGE_MODULE_IDS)
}

export function isMasterCSSModuleId(id: string) {
  return MASTER_CSS_PACKAGE_MODULE_ID_SET.has(id)
}

export function createMasterCSSImportPattern() {
  const ids = [...normalizeMasterCSSModuleIds()].map(escapeRegExp)
  return new RegExp(String.raw`@import\s+(?:url\(\s*)?(['"])(?:${ids.join('|')})\1\s*\)?[^;]*;`)
}

/** A stylesheet entry is recognised by its `@stet-css/core` import alone. */
export function createMasterCSSManifestEntryPattern() {
  return createMasterCSSImportPattern()
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
  let quote = ''
  let comment = false
  let depth = 0
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    const next = source[index + 1]
    if (comment) {
      if (char === '*' && next === '/') {
        comment = false
        index++
      }
      continue
    }
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '/' && next === '*') {
      comment = true
      index++
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
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

export function replaceMasterCSSImports(source: string, replacement: string) {
  let replaced = false
  const code = source.replace(/@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g, (rule, _quote: string, id: string) => {
    if (!isMasterCSSModuleId(id)) return rule
    replaced = true
    return replacement
  })
  return { code, replaced }
}

export function hasMasterCSSImport(source: string) {
  return replaceMasterCSSImports(source, '').replaced
}

export function hasMasterCSSManifestEntrypoint(source: string) {
  return hasMasterCSSImport(source)
}
