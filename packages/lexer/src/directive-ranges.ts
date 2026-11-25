import {
  findCSSBlockEnd,
  findCSSClosingQuote,
  findCSSCommentEnd,
  findCSSStatementEnd,
  isCSSIdentStart,
  readCSSIdent,
  skipCSSEscapeStringOrComment,
  skipCSSWhitespace,
  type SourceRange
} from './source'

export type { CSSStatementEnd, SourceLocation, SourceRange } from './source'

/**
 * At-rule names that StetCSS tooling locates, reported as written. Whether a directive is valid
 * where it appears is decided by its consumer. `dark` and `light` are not directives any more:
 * they are located so local CSS that still uses them is sent to the compiler, which rejects them
 * in favour of `@variant dark` and `@variant light`. `preserve` and `master` are located for the
 * same reason: the compiler rejects the removed `@preserve native;`, and every `@master` at-rule
 * (`@master entry;`, `@master { … }`) in favour of `@import '@stet-css/core'` and `@settings`.
 */
export type CSSDirectiveRangeName =
  | 'master'
  | 'settings'
  | 'source'
  | 'safelist'
  | 'blocklist'
  | 'preserve'
  | 'reference'
  | 'theme'
  | 'defaults'
  | 'components'
  | 'utilities'
  | 'custom-variant'
  | 'compose'
  | 'variant'
  | 'slot'
  | 'dark'
  | 'light'

export interface CSSQuotedStringRange extends SourceRange {
  quote: '"' | '\''
  contentRange: SourceRange
}

export interface CSSDeclarationRange extends SourceRange {
  propertyRange: SourceRange
  separatorRange: SourceRange
  valueRange: SourceRange
  terminatorRange?: SourceRange
}

export interface CSSDirectiveRuleRange extends SourceRange {
  name: CSSDirectiveRangeName
  keywordRange: SourceRange
  preludeRange: SourceRange
  blockRange?: SourceRange
  blockContentRange?: SourceRange
  blockCloseRange?: SourceRange
  semicolonRange?: SourceRange
  quotedStringRanges: CSSQuotedStringRange[]
  depth: number
  origin: 'source-scan'
}

export const CSS_DIRECTIVE_RANGE_NAMES = [
  'master',
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
  'custom-variant',
  'compose',
  'variant',
  'slot',
  'dark',
  'light'
] as const

const CSS_DIRECTIVE_SOURCE_NAME_SET = new Set<string>(CSS_DIRECTIVE_RANGE_NAMES)

export function collectCSSQuotedStringRanges(source: string, start = 0, end = source.length) {
  const ranges: CSSQuotedStringRange[] = []
  for (let index = start; index < end; index++) {
    const char = source[index]
    if (char === '\\') {
      index++
      continue
    }
    if (char === '/' && source[index + 1] === '*') {
      index = findCSSCommentEnd(source, index, end) - 1
      continue
    }
    if (char === '"' || char === '\'') {
      const close = findCSSClosingQuote(source, index, char, end)
      ranges.push({
        start: index,
        end: close + 1,
        quote: char,
        contentRange: {
          start: index + 1,
          end: Math.max(index + 1, close)
        }
      })
      index = close
    }
  }
  return ranges
}

export function collectCSSDeclarationRanges(source: string, start: number, end: number) {
  const ranges: CSSDeclarationRange[] = []
  let depth = 0
  let blockDepth = 0
  let propertyStart = -1
  let colon = -1

  const flushDeclaration = (declarationEnd: number, terminatorRange?: SourceRange) => {
    if (propertyStart === -1 || colon === -1) return
    const propertyText = source.slice(propertyStart, colon)
    const propertyLeading = propertyText.search(/\S/)
    if (propertyLeading === -1) return
    const propertyRangeStart = propertyStart + propertyLeading
    const propertyRangeEnd = propertyStart + propertyText.search(/\s*$/)
    const valueStart = skipCSSWhitespace(source, colon + 1)
    const rawValueEnd = source.slice(valueStart, declarationEnd).search(/\s*$/)
    const valueEnd = rawValueEnd === -1 ? declarationEnd : valueStart + rawValueEnd
    ranges.push({
      start: propertyRangeStart,
      end: terminatorRange?.end ?? valueEnd,
      propertyRange: {
        start: propertyRangeStart,
        end: propertyRangeEnd
      },
      separatorRange: {
        start: colon,
        end: colon + 1
      },
      valueRange: {
        start: valueStart,
        end: valueEnd
      },
      ...(terminatorRange ? { terminatorRange } : {})
    })
  }

  for (let index = start; index < end; index++) {
    const skipped = skipCSSEscapeStringOrComment(source, index, end)
    if (skipped !== index) {
      index = skipped - 1
      continue
    }
    const char = source[index]
    if (char === '(' || char === '[') {
      depth++
      continue
    }
    if (char === ')' || char === ']') {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (char === '{') {
      propertyStart = -1
      colon = -1
      blockDepth++
      continue
    }
    if (char === '}') {
      propertyStart = -1
      colon = -1
      blockDepth = Math.max(0, blockDepth - 1)
      continue
    }
    if (blockDepth !== 0) continue
    if (depth !== 0) continue
    if (propertyStart === -1 && isCSSIdentStart(char)) {
      propertyStart = index
    }
    if (char === ':' && colon === -1 && propertyStart !== -1) {
      colon = index
      continue
    }
    if (char === ';') {
      flushDeclaration(index, { start: index, end: index + 1 })
      propertyStart = -1
      colon = -1
    }
  }
  flushDeclaration(end)
  return ranges
}

function isCSSWhitespaceChar(char: string) {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r' || char === '\f'
}

export function collectCSSDirectiveRanges(source: string) {
  const ranges: CSSDirectiveRuleRange[] = []
  let depth = 0
  // Only whitespace and comments since the start of the source or the last `;`, `{` or `}`.
  // `@master` is located only there: every located `@master` is rejected, and text such as
  // `url(logo@master.png)` must not be.
  let atStatementStart = true
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    const skipped = skipCSSEscapeStringOrComment(source, index)
    if (skipped !== index) {
      // A comment leaves a statement start as it found it; an escape or a string starts content.
      if (char !== '/') atStatementStart = false
      index = skipped - 1
      continue
    }
    if (char === '{') {
      depth++
      atStatementStart = true
      continue
    }
    if (char === '}') {
      depth = Math.max(0, depth - 1)
      atStatementStart = true
      continue
    }
    if (char === ';') {
      atStatementStart = true
      continue
    }
    if (char !== '@') {
      if (!isCSSWhitespaceChar(char)) atStatementStart = false
      continue
    }
    const startsStatement = atStatementStart
    atStatementStart = false

    const name = readCSSIdent(source, index + 1)
    if (!CSS_DIRECTIVE_SOURCE_NAME_SET.has(name.value)) continue
    if (name.value === 'master' && !startsStatement) continue

    // Inside a block, a `}` ends a statement written without its last `;`, as in native CSS.
    const statementEnd = findCSSStatementEnd(source, name.end, depth > 0)
    const blockStart = statementEnd.reason === 'block' ? statementEnd.end : -1
    const blockEnd = blockStart === -1 ? -1 : findCSSBlockEnd(source, blockStart)
    const end = blockStart === -1
      ? statementEnd.end
      : blockEnd === -1
        ? source.length
        : blockEnd + 1
    const preludeEnd = blockStart === -1
      ? statementEnd.reason === 'semicolon'
        ? statementEnd.end - 1
        : statementEnd.end
      : blockStart
    const semicolonRange = statementEnd.reason === 'semicolon'
      ? statementEnd.delimiterRange
      : undefined
    ranges.push({
      start: index,
      end,
      name: name.value as CSSDirectiveRangeName,
      keywordRange: {
        start: index,
        end: name.end
      },
      preludeRange: {
        start: name.end,
        end: preludeEnd
      },
      ...(blockStart !== -1
        ? {
          blockRange: {
            start: blockStart,
            end
          },
          blockContentRange: {
            start: blockStart + 1,
            end: blockEnd === -1 ? end : blockEnd
          },
          ...(blockEnd === -1
            ? {}
            : {
              blockCloseRange: {
                start: blockEnd,
                end: blockEnd + 1
              }
            })
        }
        : {}),
      ...(semicolonRange ? { semicolonRange } : {}),
      quotedStringRanges: collectCSSQuotedStringRanges(source, name.end, preludeEnd),
      depth,
      origin: 'source-scan'
    })

    if (blockStart === -1) {
      index = Math.max(index, end - 1)
      atStatementStart = true
    }
  }
  return ranges
}

/** The first `@master` at-rule that starts a statement; every one is a removed directive. */
export function findMasterAtRule(source: string) {
  if (!source.includes('@master')) return
  return collectCSSDirectiveRanges(source).find((range) => range.name === 'master')
}
