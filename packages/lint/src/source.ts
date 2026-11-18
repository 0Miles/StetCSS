import type { StetCSS } from '@stet-css/engine'
import {
  collectCSSDirectiveRanges,
  type CSSDirectiveRuleRange,
  type SourceRange,
  type StetCSSScriptStringQuote
} from '@stet-css/lexer'
import { getClassPositions, languageSettings } from '@stet-css/language'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  createCanonicalComposeDirectiveReport,
  createClassListLintReport,
  createConflictingClassesReport,
  createInvalidClassesReport,
  createSortClassesReport,
  createUnapprovedRawValueClassesReport,
  type StetCSSCanonicalClassesReportOptions,
  type StetCSSClassListLintReportOptions,
  type StetCSSInvalidClassesReportOptions,
  type StetCSSLintReportOptions,
  type StetCSSLintDiagnostic,
  type StetCSSLintDiagnosticData,
  type StetCSSLintDiagnosticSeverity,
  type StetCSSLintFix,
  type StetCSSLintRange,
  type StetCSSLintRuleId,
  type StetCSSUnapprovedRawValueClassesReportOptions
} from './diagnostics'
import { defaultClassLintSettings } from './constants'

const MAX_FIX_PASSES = 10

export const stetCSSLintRuleIds: StetCSSLintRuleId[] = [
  'sort-classes',
  'no-invalid-classes',
  'no-conflicting-classes',
  'prefer-canonical-classes',
  'no-unapproved-raw-values'
]

export const defaultStetCSSLintRules: Record<StetCSSLintRuleId, boolean> = {
  'sort-classes': true,
  'no-invalid-classes': true,
  'no-conflicting-classes': true,
  'prefer-canonical-classes': true,
  'no-unapproved-raw-values': false
}

export type StetCSSLintFileSourceKind = 'source' | 'stylesheet' | 'manifest'
export type StetCSSLintDiagnosticSourceKind = 'class-attribute' | 'class-expression' | 'compose-directive' | 'manifest'
export type StetCSSLintSourceFixKind = 'class-list' | 'directive'
export type StetCSSLintSourceFixSafety = 'safe' | 'structural'

export interface StetCSSLintSourceLocation {
  line: number
  column: number
}

export interface StetCSSLintSourceLocationRange {
  start: StetCSSLintSourceLocation
  end: StetCSSLintSourceLocation
}

export interface StetCSSLintSourceFix {
  kind: StetCSSLintSourceFixKind
  safety: StetCSSLintSourceFixSafety
  range: StetCSSLintRange
  text: string
  description: string
  requiresFormatting: boolean
}

export interface StetCSSLintSourceDiagnostic {
  ruleId?: StetCSSLintRuleId | 'manifest'
  code: string
  severity: StetCSSLintDiagnosticSeverity
  message: string
  range: StetCSSLintRange
  loc: StetCSSLintSourceLocationRange
  source: 'StetCSS'
  sourceKind: StetCSSLintDiagnosticSourceKind
  data?: StetCSSLintDiagnosticData
  fixes?: StetCSSLintSourceFix[]
}

export interface StetCSSLintFileResult {
  filePath: string
  languageId: string
  sourceKind: StetCSSLintFileSourceKind
  diagnostics: StetCSSLintSourceDiagnostic[]
}

export interface StetCSSLintSummary {
  files: number
  diagnostics: number
  errors: number
  warnings: number
  fixable: number
  safeFixes: number
  structuralFixes: number
}

export interface StetCSSLintContentOptions {
  content: string
  filePath: string
  css: StetCSS
  rules?: Partial<Record<StetCSSLintRuleId, boolean>>
  ruleOptions?: StetCSSLintContentRuleOptions
  severities?: Partial<Record<StetCSSLintRuleId, StetCSSLintDiagnosticSeverity>>
  /**
   * Object keys whose values hold no classes; defaults to `defaultClassLintSettings.ignoredKeys`
   * (cva's `compoundVariants` and `defaultVariants`).
   */
  ignoredKeys?: string[]
}

export interface StetCSSFixContentOptions extends StetCSSLintContentOptions {
  includeDirectiveFixes?: boolean
}

export interface StetCSSLintContentRuleOptions {
  'no-invalid-classes'?: StetCSSInvalidClassesReportOptions
  'prefer-canonical-classes'?: StetCSSCanonicalClassesReportOptions
  'no-unapproved-raw-values'?: StetCSSUnapprovedRawValueClassesReportOptions
}

interface TextDocumentLike {
  uri: string
  languageId: string
  version: number
  getText(): string
}

interface ClassListContext {
  range: SourceRange
  text: string
  sourceKind: Exclude<StetCSSLintDiagnosticSourceKind, 'manifest'>
  unescape?: string | false
  scriptString?: StetCSSScriptStringQuote
  directive?: CSSDirectiveRuleRange
}

const languageByExtension: Record<string, string> = {
  '.astro': 'astro',
  '.css': 'css',
  '.htm': 'html',
  '.html': 'html',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'javascriptreact',
  '.less': 'less',
  '.md': 'markdown',
  '.mdx': 'mdx',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.php': 'html',
  '.pug': 'html',
  '.scss': 'scss',
  '.svelte': 'svelte',
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.vue': 'vue'
}

const stylesheetLanguageIds = new Set(['css', 'scss', 'less'])

export function resolveStetCSSLintRules(option: string | undefined): Record<StetCSSLintRuleId, boolean> {
  if (!option) return { ...defaultStetCSSLintRules }
  const resolved = Object.fromEntries(stetCSSLintRuleIds.map((ruleId) => [ruleId, false])) as Record<StetCSSLintRuleId, boolean>
  for (const rule of option.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (rule === 'recommended') {
      Object.assign(resolved, defaultStetCSSLintRules)
      continue
    }
    if (rule === 'all') {
      for (const ruleId of stetCSSLintRuleIds) resolved[ruleId] = true
      continue
    }
    if (!stetCSSLintRuleIds.includes(rule as StetCSSLintRuleId)) {
      throw new Error(`Unknown StetCSS lint rule "${rule}".`)
    }
    resolved[rule as StetCSSLintRuleId] = true
  }
  return resolved
}

function resolveRules(rules: Partial<Record<StetCSSLintRuleId, boolean>> | undefined) {
  return {
    ...defaultStetCSSLintRules,
    ...rules
  }
}

function getLanguageId(filePath: string) {
  return languageByExtension[extname(filePath).toLowerCase()] || 'html'
}

function getFileSourceKind(languageId: string): StetCSSLintFileSourceKind {
  return stylesheetLanguageIds.has(languageId) ? 'stylesheet' : 'source'
}

function createTextDocument(filePath: string, content: string): TextDocumentLike {
  return {
    uri: pathToFileURL(filePath).href,
    languageId: getLanguageId(filePath),
    version: 0,
    getText: () => content
  }
}

function detectClassListUnescape(content: string, range: SourceRange) {
  const quote = content[range.start - 1]
  return quote === '"' || quote === '\'' || quote === '`' ? quote : false
}

function findComposeDirective(directives: CSSDirectiveRuleRange[], range: SourceRange) {
  return directives.find((directive) => {
    if (directive.name !== 'compose') return false
    if (directive.blockRange || directive.quotedStringRanges.length) return false
    return range.start >= directive.preludeRange.start && range.end <= directive.preludeRange.end
  })
}

function inferClassSourceKind(content: string, range: SourceRange): Exclude<StetCSSLintDiagnosticSourceKind, 'compose-directive' | 'manifest'> {
  const prefix = content.slice(Math.max(0, range.start - 80), range.start)
  return /(?:^|[\s{<])(?:class|className|class:list|:class|v-bind:class|\[class\]|\[className\]|\[ngClass\])\s*=\s*(?:"|'|`|\{[^]*$)/.test(prefix)
    ? 'class-attribute'
    : 'class-expression'
}

function collectClassListContexts(
  content: string,
  filePath: string,
  ignoredKeys: string[] = defaultClassLintSettings.ignoredKeys
): ClassListContext[] {
  const textDocument = createTextDocument(filePath, content)
  const positions = getClassPositions(textDocument as any, { ...languageSettings, ignoredKeys })
  const contexts = new Map<string, ClassListContext>()
  const directives = collectCSSDirectiveRanges(content)
  for (const position of positions) {
    // Part of a class that only exists at runtime: neither reported nor fixed.
    if (position.fragment) continue
    const contextRange = position.contextRange
    const key = `${contextRange.start}:${contextRange.end}`
    if (contexts.has(key)) continue
    const directive = findComposeDirective(directives, contextRange)
    contexts.set(key, {
      range: contextRange,
      text: content.slice(contextRange.start, contextRange.end),
      sourceKind: directive ? 'compose-directive' : inferClassSourceKind(content, contextRange),
      unescape: detectClassListUnescape(content, contextRange),
      scriptString: position.scriptString,
      ...(directive ? { directive } : {})
    })
  }
  return [...contexts.values()].sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end)
}

function offsetToLocation(content: string, offset: number): StetCSSLintSourceLocation {
  let line = 1
  let lineStart = 0
  for (let index = 0; index < offset; index++) {
    if (content[index] === '\n') {
      line++
      lineStart = index + 1
    }
  }
  return {
    line,
    column: offset - lineStart + 1
  }
}

function toLocationRange(content: string, range: SourceRange): StetCSSLintSourceLocationRange {
  return {
    start: offsetToLocation(content, range.start),
    end: offsetToLocation(content, range.end)
  }
}

function createComposeDirectiveLintDiagnostics(
  context: ClassListContext,
  css: StetCSS,
  rules: Record<StetCSSLintRuleId, boolean>,
  options: StetCSSLintContentOptions
) {
  return [
    rules['sort-classes'] && createSortClassesReport(context.text, css, withSourceRuleOptions(context, options, 'sort-classes')),
    rules['no-invalid-classes'] && createInvalidClassesReport(context.text, css, withSourceRuleOptions(context, options, 'no-invalid-classes')),
    rules['no-conflicting-classes'] && createConflictingClassesReport(context.text, css, withSourceRuleOptions(context, options, 'no-conflicting-classes')),
    rules['prefer-canonical-classes'] && createCanonicalComposeDirectiveReport(context.text, css, withSourceRuleOptions(context, options, 'prefer-canonical-classes')),
    rules['no-unapproved-raw-values'] && createUnapprovedRawValueClassesReport(context.text, css, withSourceRuleOptions(context, options, 'no-unapproved-raw-values'))
  ].filter((report): report is { diagnostics: StetCSSLintDiagnostic[] } => Boolean(report))
    .flatMap((report) => report.diagnostics)
}

function createContextLintDiagnostics(
  context: ClassListContext,
  css: StetCSS,
  rules: Record<StetCSSLintRuleId, boolean>,
  options: StetCSSLintContentOptions
) {
  return context.sourceKind === 'compose-directive'
    ? createComposeDirectiveLintDiagnostics(context, css, rules, options)
    : createClassListLintReport(context.text, css, {
      ...createClassListLintOptions(context, options),
      rules,
      severities: options.severities
    }).diagnostics
}

function getRuleOptions(options: StetCSSLintContentOptions): StetCSSClassListLintReportOptions {
  return {
    ...options.ruleOptions?.['no-invalid-classes'],
    ...options.ruleOptions?.['prefer-canonical-classes'],
    ...options.ruleOptions?.['no-unapproved-raw-values']
  }
}

function createClassListLintOptions(
  context: ClassListContext,
  options: StetCSSLintContentOptions
): StetCSSClassListLintReportOptions {
  return {
    ...getRuleOptions(options),
    unescape: context.unescape,
    scriptString: context.scriptString
  }
}

function withSourceRuleOptions(
  context: ClassListContext,
  options: StetCSSLintContentOptions,
  ruleId: StetCSSLintRuleId
): StetCSSLintReportOptions {
  return {
    ...getRuleOptions(options),
    ...getSpecificRuleOptions(options, ruleId),
    severity: options.severities?.[ruleId],
    unescape: context.unescape,
    scriptString: context.scriptString
  }
}

function getSpecificRuleOptions(options: StetCSSLintContentOptions, ruleId: StetCSSLintRuleId) {
  switch (ruleId) {
    case 'no-invalid-classes':
      return options.ruleOptions?.['no-invalid-classes']
    case 'prefer-canonical-classes':
      return options.ruleOptions?.['prefer-canonical-classes']
    case 'no-unapproved-raw-values':
      return options.ruleOptions?.['no-unapproved-raw-values']
    default:
      return undefined
  }
}

function toSourceFix(context: ClassListContext, fix: StetCSSLintFix): StetCSSLintSourceFix | undefined {
  if (fix.scope === 'directive') {
    if (!context.directive) return
    return {
      kind: 'directive',
      safety: 'structural',
      range: {
        start: context.directive.start,
        end: context.directive.end
      },
      text: fix.text,
      description: 'Apply structural @compose rewrite.',
      requiresFormatting: true
    }
  }
  return {
    kind: 'class-list',
    safety: 'safe',
    range: {
      start: context.range.start + fix.range.start,
      end: context.range.start + fix.range.end
    },
    text: fix.text,
    description: 'Replace the class list text.',
    requiresFormatting: false
  }
}

function toSourceDiagnostic(
  content: string,
  context: ClassListContext,
  diagnostic: StetCSSLintDiagnostic
): StetCSSLintSourceDiagnostic {
  const range = {
    start: context.range.start + diagnostic.range.start,
    end: context.range.start + diagnostic.range.end
  }
  const fix = diagnostic.fix && toSourceFix(context, diagnostic.fix)

  return {
    ruleId: diagnostic.ruleId,
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    range,
    loc: toLocationRange(content, range),
    source: 'StetCSS',
    sourceKind: context.sourceKind,
    ...(diagnostic.data ? { data: diagnostic.data } : {}),
    ...(fix ? { fixes: [fix] } : {})
  }
}

export function lintStetCSSContent(options: StetCSSLintContentOptions): StetCSSLintFileResult {
  const diagnostics: StetCSSLintSourceDiagnostic[] = []
  const rules = resolveRules(options.rules)
  for (const context of collectClassListContexts(options.content, options.filePath, options.ignoredKeys)) {
    diagnostics.push(...createContextLintDiagnostics(context, options.css, rules, options).map((diagnostic) => toSourceDiagnostic(options.content, context, diagnostic)))
  }
  const languageId = getLanguageId(options.filePath)
  return {
    filePath: options.filePath,
    languageId,
    sourceKind: getFileSourceKind(languageId),
    diagnostics
  }
}

function applyReplacement(content: string, range: SourceRange, text: string) {
  return content.slice(0, range.start) + text + content.slice(range.end)
}

function uniqueFixes(fixes: StetCSSLintSourceFix[]) {
  const seen = new Set<string>()
  return fixes.filter((fix) => {
    const key = `${fix.kind}:${fix.range.start}:${fix.range.end}:${fix.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function collectStructuralFixes(file: StetCSSLintFileResult) {
  return uniqueFixes(file.diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? []))
    .filter((fix) => fix.kind === 'directive')
    .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)
}

function applyFixes(content: string, fixes: StetCSSLintSourceFix[]) {
  let fixed = content
  for (const fix of fixes) {
    fixed = applyReplacement(fixed, fix.range, fix.text)
  }
  return fixed
}

function fixClassListText(context: ClassListContext, css: StetCSS, rules: Record<StetCSSLintRuleId, boolean>, options: StetCSSLintContentOptions) {
  let fixed = context.text
  for (let pass = 0; pass < MAX_FIX_PASSES; pass++) {
    const nextContext: ClassListContext = {
      ...context,
      range: { start: 0, end: fixed.length },
      text: fixed
    }
    const fix = createContextLintDiagnostics(nextContext, css, rules, options)
      .map((diagnostic) => diagnostic.fix)
      .find((fix): fix is StetCSSLintFix => Boolean(fix && fix.scope !== 'directive'))
    if (!fix) return fixed
    const next = applyReplacement(fixed, fix.range, fix.text)
    if (next === fixed) return fixed
    fixed = next
  }
  return fixed
}

function fixSafeClassLists(content: string, filePath: string, css: StetCSS, rules: Record<StetCSSLintRuleId, boolean>, options: StetCSSLintContentOptions) {
  const replacements = collectClassListContexts(content, filePath, options.ignoredKeys)
    .map((context) => ({
      range: context.range,
      text: fixClassListText(context, css, rules, options)
    }))
    .filter((replacement) => content.slice(replacement.range.start, replacement.range.end) !== replacement.text)
    .sort((a, b) => b.range.start - a.range.start || b.range.end - a.range.end)

  return applyFixes(content, replacements.map((replacement) => ({
    kind: 'class-list',
    safety: 'safe',
    range: replacement.range,
    text: replacement.text,
    description: 'Replace the class list text.',
    requiresFormatting: false
  })))
}

export function fixStetCSSContent(options: StetCSSFixContentOptions) {
  const rules = resolveRules(options.rules)
  let fixed = fixSafeClassLists(options.content, options.filePath, options.css, rules, options)
  if (!options.includeDirectiveFixes) return fixed
  const structuralFixes = collectStructuralFixes(lintStetCSSContent({
    ...options,
    content: fixed,
    rules
  }))
  if (structuralFixes.length) fixed = applyFixes(fixed, structuralFixes)
  return fixed
}

export function summarizeStetCSSLintFiles(files: StetCSSLintFileResult[]): StetCSSLintSummary {
  const diagnostics = files.flatMap((file) => file.diagnostics)
  const fixes = diagnostics.flatMap((diagnostic) => diagnostic.fixes ?? [])
  return {
    files: files.length,
    diagnostics: diagnostics.length,
    errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
    warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length,
    fixable: diagnostics.filter((diagnostic) => diagnostic.fixes?.length).length,
    safeFixes: fixes.filter((fix) => fix.safety === 'safe').length,
    structuralFixes: fixes.filter((fix) => fix.safety === 'structural').length
  }
}
