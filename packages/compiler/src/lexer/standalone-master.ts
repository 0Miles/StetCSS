import {
  createCSSDirectiveSourceReference,
  CSSDirectiveError,
  type CSSDirectiveExtractionPolicy
} from '@stet-css/schema/css-directives'
import { collectCSSDirectiveRanges, escapeRegExp, type CSSDirectiveRuleRange, type SourceRange } from '@stet-css/lexer'
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

export interface RemovedDirectiveCheckOptions {
  /**
   * Offsets in `source` are offsets in `filename`, so the error carries a source reference the
   * editor can underline. Leave it off when `source` holds an expanded import graph.
   */
  locate?: boolean
}

function createRemovedDirectiveError(
  code: string,
  message: string,
  source: string,
  range: SourceRange,
  filename: string | undefined,
  options: RemovedDirectiveCheckOptions
) {
  const location = filename ? ` (in ${filename} or a stylesheet it imports)` : ''
  return new CSSDirectiveError(
    code,
    message + location,
    options.locate ? createCSSDirectiveSourceReference(filename, { start: range.start, end: range.end }, source) : undefined
  )
}

/**
 * `@preserve` is still located so an entry that keeps `@preserve native;` fails loudly instead
 * of carrying a directive that no longer does anything.
 */
function createRemovedPreserveDirectiveError(
  source: string,
  statement: StandaloneCSSDirectiveStatement,
  filename: string | undefined,
  options: RemovedDirectiveCheckOptions = {}
) {
  return createRemovedDirectiveError(
    'removed-preserve-directive',
    `@preserve was removed; stylesheet entries keep all native CSS, so delete "${statement.statement.trim()}"`,
    source,
    statement,
    filename,
    options
  )
}

function formatMasterAtRule(source: string, range: CSSDirectiveRuleRange) {
  const prelude = source.slice(range.preludeRange.start, range.preludeRange.end).trim()
  const head = prelude ? `@master ${prelude}` : '@master'
  return range.blockRange ? `${head} { … }` : `${head};`
}

/**
 * Every `@master` at-rule was removed: `@master entry;` gave way to `@import '@stet-css/core'`,
 * and `@master { … }` blocks never had an effect (settings live in `@settings`). Each one fails
 * with the replacement instead of passing through as an unknown at-rule.
 */
function createRemovedMasterAtRuleError(
  source: string,
  range: CSSDirectiveRuleRange,
  filename: string | undefined,
  options: RemovedDirectiveCheckOptions
) {
  const statement = formatMasterAtRule(source, range)
  const message = statement === '@master entry;'
    ? `@master entry; was removed; mark stylesheet entries with @import '@stet-css/core'; instead`
    : `@master at-rules were removed; mark stylesheet entries with @import '@stet-css/core'; and put settings in @settings, so delete "${statement}"`
  return createRemovedDirectiveError('removed-master-at-rule', message, source, range, filename, options)
}

/**
 * Throws on the first `@master` at-rule that starts a statement in `source`. Bundler routing
 * filters (local-style directive names, the Next Turbopack content condition) are deliberately
 * wider and send any file mentioning `@master` here; this check decides.
 */
export function assertNoMasterAtRules(source: string, filename?: string, options: RemovedDirectiveCheckOptions = {}) {
  if (!source.includes('@master')) return
  const range = collectCSSDirectiveRanges(source).find((directive) => directive.name === 'master')
  if (range) throw createRemovedMasterAtRuleError(source, range, filename, options)
}

/** Throws, with a source reference into `source`, on any removed directive it holds. */
export function assertNoRemovedDirectives(source: string, filename?: string) {
  assertNoMasterAtRules(source, filename, { locate: true })
  if (!source.includes('@preserve')) return
  const statement = findStandaloneCSSDirectiveStatements(source, filename)
    .find((directive) => directive.atRuleName === 'preserve')
  if (statement) throw createRemovedPreserveDirectiveError(source, statement, filename, { locate: true })
}

const STANDALONE_CSS_DIRECTIVE_NAMES = new Set<StandaloneCSSDirectiveName>([
  'source',
  'safelist',
  'blocklist',
  'preserve'
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
      if (char === '"' || char === '\'') {
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
  let quote = ''
  let comment = false
  let word = ''
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
      if (char === '\\') index++
      else if (char === quote) quote = ''
      continue
    }
    if (char === '/' && next === '*') {
      comment = true
      index++
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      if (word) {
        words.push(word)
        word = ''
      }
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

export function findStandaloneCSSDirectiveStatements(source: string, filename = 'master.css') {
  void filename
  const statements: StandaloneCSSDirectiveStatement[] = []
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

export function collectStandaloneCSSDirectiveExtractionPolicy(source: string, filename?: string) {
  assertNoMasterAtRules(source, filename)
  const policy = createCSSDirectiveExtractionPolicy()
  for (const statement of findStandaloneCSSDirectiveStatements(source, filename)) {
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
        throw createRemovedPreserveDirectiveError(source, statement, filename)
    }
  }
  return policy
}

export function removeStandaloneCSSDirectives(source: string, filename = 'master.css') {
  return removeSourceRanges(source, findStandaloneCSSDirectiveStatements(source, filename))
}
