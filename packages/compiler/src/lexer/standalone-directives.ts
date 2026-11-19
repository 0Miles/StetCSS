import {
  createCSSDirectiveSourceReference,
  CSSDirectiveError,
  type CSSDirectiveExtractionPolicy
} from '@stet-css/schema/css-directives'
import {
  escapeRegExp,
  findMasterAtRule,
  skipCSSEscapeStringOrComment,
  type CSSDirectiveRuleRange,
  type SourceRange
} from '@stet-css/lexer'
import { countSourcePatternExpansions, MAX_SOURCE_PATTERN_EXPANSIONS } from './source-pattern'
import { findAtRuleStatementEnd, removeSourceRanges } from './source'

export type StandaloneCSSDirectiveName = 'source' | 'safelist' | 'blocklist' | 'preserve'

export interface StandaloneCSSDirectiveStatement {
  start: number
  end: number
  atRuleName: StandaloneCSSDirectiveName
  name: string
  statement: string
  args: string[]
  modifiers: string[]
}

export const REMOVED_MASTER_AT_RULE_ERROR_CODE = 'removed-master-at-rule'

const UNQUOTED_DIRECTIVE_ARGUMENT_ERROR_CODE = 'unquoted-directive-argument'

/**
 * `locate` means offsets in `source` are offsets in `filename`, so the error carries a source
 * reference the editor can underline; leave it off when `source` holds an expanded import graph.
 */
function createRemovedDirectiveError(
  code: string,
  message: string,
  source: string,
  range: SourceRange,
  filename: string | undefined,
  locate: boolean
) {
  const location = filename ? ` (in ${filename} or a stylesheet it imports)` : ''
  return new CSSDirectiveError(
    code,
    message + location,
    locate ? createCSSDirectiveSourceReference(filename, { start: range.start, end: range.end }, source) : undefined
  )
}

/**
 * `@preserve` is still located so an entry that keeps `@preserve native;` fails loudly instead
 * of carrying a directive that no longer does anything.
 */
function removedPreserveDirectiveMessage(statement: StandaloneCSSDirectiveStatement) {
  return `@preserve was removed; stylesheet entries keep all native CSS, so delete "${statement.statement.trim()}"`
}

/**
 * Every `@master` at-rule was removed: `@master entry;` gave way to `@import '@stet-css/core'`,
 * and `@master { … }` blocks never had an effect (settings live in `@settings`). Each one fails
 * with the replacement instead of passing through as an unknown at-rule.
 */
function removedMasterAtRuleMessage(source: string, range: CSSDirectiveRuleRange) {
  const prelude = source.slice(range.preludeRange.start, range.preludeRange.end).trim()
  const head = prelude ? `@master ${prelude}` : '@master'
  const statement = range.blockRange ? `${head} { … }` : `${head};`
  return statement === '@master entry;'
    ? `@master entry; was removed; mark stylesheet entries with @import '@stet-css/core'; instead`
    : `@master at-rules were removed; mark stylesheet entries with @import '@stet-css/core'; and put settings in @settings, so delete "${statement}"`
}

/**
 * Throws on the first `@master` at-rule that starts a statement in `source`. The import-graph
 * reader runs it on every stylesheet it reads; routing filters upstream (local-style directive
 * names, the Next Turbopack content condition, project discovery) are deliberately wider and only
 * send files here.
 */
export function assertNoMasterAtRules(source: string, filename?: string, locate = false) {
  const range = findMasterAtRule(source)
  if (range) {
    throw createRemovedDirectiveError(REMOVED_MASTER_AT_RULE_ERROR_CODE, removedMasterAtRuleMessage(source, range), source, range, filename, locate)
  }
}

const STANDALONE_CSS_DIRECTIVE_NAMES = new Set<StandaloneCSSDirectiveName>([
  'source',
  'safelist',
  'blocklist',
  'preserve'
])

/**
 * StetCSS directives a stylesheet accepts only at its top level: the standalone statements, which
 * are read only there, and the blocks the compile rejects anywhere else. They configure the manifest
 * rather than emit CSS where they stand.
 */
export const TOP_LEVEL_CSS_DIRECTIVE_NAMES: ReadonlySet<string> = new Set([
  ...STANDALONE_CSS_DIRECTIVE_NAMES,
  'settings',
  'theme',
  'defaults',
  'components',
  'utilities',
  'custom-variant',
  'reference'
])

function isIdentChar(char: string | undefined) {
  return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

function parseQuotedStrings(source: string) {
  const values: string[] = []
  let quote = ''
  let value = ''
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (!quote) {
      if (char === '\\') {
        index++
      } else if (char === '"' || char === '\'') {
        quote = char
        value = ''
      }
      continue
    }
    if (char === '\\') {
      value += source[index + 1] || ''
      index++
      continue
    }
    if (char === quote) {
      values.push(value)
      quote = ''
      continue
    }
    value += char
  }
  return values
}

function parseUnquotedWords(source: string) {
  const words: string[] = []
  let word = ''
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    const skipped = skipCSSEscapeStringOrComment(source, index)
    if (skipped !== index) {
      // A string or an escape ends the word before it; a comment leaves it open.
      if (char !== '/' && word) {
        words.push(word)
        word = ''
      }
      index = skipped - 1
      continue
    }
    if (isIdentChar(char)) {
      word += char
      continue
    }
    if (word) {
      words.push(word)
      word = ''
    }
  }
  if (word) words.push(word)
  return words
}

/** The keywords each string-argument directive takes besides its quoted arguments. */
const STRING_ARGUMENT_DIRECTIVE_KEYWORDS: Partial<Record<StandaloneCSSDirectiveName, readonly string[]>> = {
  source: ['not'],
  safelist: [],
  blocklist: []
}

interface DirectivePreludeToken {
  type: 'string' | 'word' | 'comma'
  start: number
  end: number
}

/**
 * Splits the prelude between `start` and `end` into quoted strings, commas, and unquoted words.
 * Whitespace and comments separate tokens; an escape belongs to the word it stands in.
 */
function tokenizeDirectivePrelude(source: string, start: number, end: number) {
  const tokens: DirectivePreludeToken[] = []
  let wordStart = -1
  const endWord = (index: number) => {
    if (wordStart === -1) return
    tokens.push({ type: 'word', start: wordStart, end: index })
    wordStart = -1
  }
  for (let index = start; index < end; index++) {
    const char = source[index]
    if (char === '\\') {
      if (wordStart === -1) wordStart = index
      index++
      continue
    }
    const skipped = skipCSSEscapeStringOrComment(source, index, end)
    if (skipped !== index) {
      endWord(index)
      if (char !== '/') tokens.push({ type: 'string', start: index, end: skipped })
      index = skipped - 1
      continue
    }
    if (char === ',' || /\s/.test(char)) {
      endWord(index)
      if (char === ',') tokens.push({ type: 'comma', start: index, end: index + 1 })
      continue
    }
    if (wordStart === -1) wordStart = index
  }
  endWord(end)
  return tokens
}

/**
 * `@source`, `@safelist` and `@blocklist` read only quoted arguments; an unquoted one would leave
 * the statement while its glob, class or pattern never applies, so it fails with the quoted form.
 */
function assertQuotedDirectiveArguments(
  source: string,
  statement: StandaloneCSSDirectiveStatement,
  filename: string | undefined,
  locate: boolean
) {
  const keywords = STRING_ARGUMENT_DIRECTIVE_KEYWORDS[statement.atRuleName]
  if (!keywords) return
  const preludeStart = statement.start + statement.atRuleName.length + 1
  const preludeEnd = source[statement.end - 1] === ';' ? statement.end - 1 : statement.end
  const tokens = tokenizeDirectivePrelude(source, preludeStart, preludeEnd)
  const isUnquoted = (token: DirectivePreludeToken) =>
    token.type === 'word' && !keywords.includes(source.slice(token.start, token.end))
  const unquoted = tokens.filter(isUnquoted)
  if (!unquoted.length) return
  let quoted = `@${statement.atRuleName}`
  for (const token of tokens) {
    const text = source.slice(token.start, token.end)
    quoted += token.type === 'comma' ? ',' : ` ${isUnquoted(token) ? `'${text}'` : text}`
  }
  const location = filename ? ` (in ${filename})` : ''
  const range = { start: unquoted[0].start, end: unquoted[unquoted.length - 1].end }
  throw new CSSDirectiveError(
    UNQUOTED_DIRECTIVE_ARGUMENT_ERROR_CODE,
    `@${statement.atRuleName} takes only quoted arguments, so write "${quoted};"${location}`,
    locate ? createCSSDirectiveSourceReference(filename, range, source) : undefined
  )
}

/**
 * Throws on the first `@source`, `@safelist` or `@blocklist` with an unquoted argument in `source`.
 * The import-graph reader runs it on every stylesheet it reads, so the error points into the file
 * that holds the directive rather than into the expanded graph.
 */
export function assertQuotedCSSDirectiveArguments(source: string, filename?: string, locate = false) {
  if (!source.includes('@source') && !source.includes('@safelist') && !source.includes('@blocklist')) return
  for (const statement of findStandaloneCSSDirectiveStatements(source)) {
    assertQuotedDirectiveArguments(source, statement, filename, locate)
  }
}

function wildcardToRegExp(source: string) {
  return new RegExp(`^${source.split(/([*?])/g).map((part) => {
    if (part === '*') return '.*'
    if (part === '?') return '.'
    return escapeRegExp(part)
  }).join('')}$`)
}

function normalizeBlocklistPattern(pattern: string) {
  return /[*?]/.test(pattern) ? wildcardToRegExp(pattern) : pattern
}

function addUnique<T>(target: T[], values: Iterable<T>) {
  for (const value of values) {
    if (!target.includes(value)) {
      target.push(value)
    }
  }
}

export function createCSSDirectiveExtractionPolicy(): CSSDirectiveExtractionPolicy {
  return {
    include: [],
    exclude: [],
    safelist: [],
    blocklist: []
  }
}

export function mergeCSSDirectiveExtractionPolicy(...policies: (Partial<CSSDirectiveExtractionPolicy> | undefined)[]) {
  const merged = createCSSDirectiveExtractionPolicy()
  for (const policy of policies) {
    if (!policy) continue
    addUnique(merged.include, policy.include || [])
    addUnique(merged.exclude, policy.exclude || [])
    addUnique(merged.safelist, policy.safelist || [])
    addUnique(merged.blocklist, policy.blocklist || [])
  }
  return merged
}

function parseAtRuleName(source: string, start: number) {
  let cursor = start + 1
  while (isIdentChar(source[cursor])) cursor++
  return source.slice(start + 1, cursor)
}

function parseStandaloneCSSDirectiveStatement(
  source: string,
  start: number,
  atRuleName: StandaloneCSSDirectiveName
) {
  const end = findAtRuleStatementEnd(source, start)
  if (end === -1) return
  const statement = source.slice(start, end)
  const prelude = statement
    .replace(new RegExp(`^@${atRuleName}\\b`), '')
    .replace(/;$/, '')
  return {
    start,
    end,
    atRuleName,
    name: atRuleName,
    statement,
    args: parseQuotedStrings(prelude),
    modifiers: parseUnquotedWords(prelude)
  } satisfies StandaloneCSSDirectiveStatement
}

export function findStandaloneCSSDirectiveStatements(source: string, filename = 'stet.css') {
  void filename
  const statements: StandaloneCSSDirectiveStatement[] = []
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
    if (depth !== 0 || char !== '@') continue

    const name = parseAtRuleName(source, index)
    if (!STANDALONE_CSS_DIRECTIVE_NAMES.has(name as StandaloneCSSDirectiveName)) continue
    if (isIdentChar(source[index + name.length + 1])) continue
    const statement = parseStandaloneCSSDirectiveStatement(source, index, name as StandaloneCSSDirectiveName)
    if (!statement) continue
    statements.push(statement)
    index = statement.end - 1
  }
  return statements
}

/** Rejects an `@source` pattern whose braces would make glob matching expand it without bound. */
function assertSourcePatternsExpandable(patterns: string[], directive: string, filename?: string) {
  const location = filename ? ` (in ${filename})` : ''
  for (const pattern of patterns) {
    if (countSourcePatternExpansions(pattern) > MAX_SOURCE_PATTERN_EXPANSIONS) {
      throw new Error(`${directive} '${pattern}' expands its braces into more than ${MAX_SOURCE_PATTERN_EXPANSIONS} patterns${location}`)
    }
  }
}

/**
 * Rejects removed directives (`@master`, `@preserve`) on the way; pass `locate` when `source` is
 * the whole of `filename`, so the errors carry source references.
 */
export function collectStandaloneCSSDirectiveExtractionPolicy(source: string, filename?: string, locate = false) {
  assertNoMasterAtRules(source, filename, locate)
  const policy = createCSSDirectiveExtractionPolicy()
  for (const statement of findStandaloneCSSDirectiveStatements(source, filename)) {
    assertQuotedDirectiveArguments(source, statement, filename, locate)
    switch (statement.atRuleName) {
      case 'source': {
        const negated = statement.modifiers.includes('not')
        assertSourcePatternsExpandable(statement.args, negated ? '@source not' : '@source', filename)
        policy[negated ? 'exclude' : 'include'].push(...statement.args)
        break
      }
      case 'safelist':
        policy.safelist.push(...statement.args.flatMap((arg) => arg.split(/\s+/).filter(Boolean)))
        break
      case 'blocklist':
        policy.blocklist.push(...statement.args
          .flatMap((arg) => arg.split(/\s+/).filter(Boolean))
          .map(normalizeBlocklistPattern))
        break
      case 'preserve':
        throw createRemovedDirectiveError('removed-preserve-directive', removedPreserveDirectiveMessage(statement), source, statement, filename, locate)
    }
  }
  return policy
}

export function removeStandaloneCSSDirectives(source: string, filename = 'stet.css') {
  return removeSourceRanges(source, findStandaloneCSSDirectiveStatements(source, filename))
}
