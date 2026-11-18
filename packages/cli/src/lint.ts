import { createCSSWithNativeDeclarations } from '@stet-css/validator'
import {
  fixStetCSSContent,
  lintStetCSSContent,
  resolveStetCSSLintRules,
  summarizeStetCSSLintFiles,
  type StetCSSLintFileResult,
  type StetCSSLintRuleId,
  type StetCSSLintSourceDiagnostic,
  type StetCSSLintSummary
} from '@stet-css/lint'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { PROJECT_SOURCE_EXTENSIONS } from '@stet-css/project/sources'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'

const REPORT_VERSION = 1
/** The project's own sources, as the build reads them, plus the stylesheets lint checks. */
const DEFAULT_SOURCE_EXTENSIONS = [...PROJECT_SOURCE_EXTENSIONS, '.css', '.scss', '.less']
const DEFAULT_SOURCE_PATTERNS = [`**/*.{${DEFAULT_SOURCE_EXTENSIONS.map((extension) => extension.slice(1)).join(',')}}`]
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

export interface LintOptions {
  fix?: boolean
  fixDryRun?: boolean
  fixDirectives?: boolean
  format?: 'stylish' | 'json'
  maxWarnings?: string | number
  cwd?: string
  stdin?: boolean
  stdinFilepath?: string
  exitCode?: 'diagnostics' | 'never'
  rules?: string
}

interface CLILintReport {
  version: typeof REPORT_VERSION
  cwd: string
  manifest: {
    status: 'loaded' | 'error'
    entries: string[]
    diagnostics: StetCSSLintSourceDiagnostic[]
  }
  files: StetCSSLintFileResult[]
  summary: StetCSSLintSummary
}

interface SourceInput {
  filePath: string
  content: string
  stdin?: boolean
}

type CSSWithNativeDeclarations = ReturnType<typeof createCSSWithNativeDeclarations>

function normalizeSourcePatterns(specifiedSourcePaths?: string[]) {
  return specifiedSourcePaths?.length ? specifiedSourcePaths : DEFAULT_SOURCE_PATTERNS
}

function normalizeGlobPatterns(patterns: string[]) {
  return patterns.map((pattern) => pattern.replace(/\\/g, '/'))
}

function resolveSourcePaths(cwd: string, sourcePatterns: string[], ignore: string[] = []) {
  return fg.sync(normalizeGlobPatterns(sourcePatterns), {
    cwd,
    ignore: normalizeGlobPatterns(ignore),
    onlyFiles: true
  }).filter(Boolean)
}

function parseMaxWarnings(value: string | number | undefined) {
  if (value === undefined) return Number.POSITIVE_INFINITY
  const maxWarnings = Number(value)
  return Number.isFinite(maxWarnings) && maxWarnings >= 0 ? maxWarnings : 0
}

function createManifestDiagnostic(cwd: string, error: unknown): StetCSSLintSourceDiagnostic {
  const range = { start: 0, end: 0 }
  return {
    ruleId: 'manifest',
    code: 'manifest-loading-error',
    severity: 'error',
    message: `Failed to load StetCSS manifest: ${error instanceof Error ? error.message : String(error)}`,
    range,
    loc: {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 1 }
    },
    source: 'StetCSS',
    sourceKind: 'manifest',
    data: {
      cwd
    }
  }
}

function createManifestFileResult(cwd: string, diagnostics: StetCSSLintSourceDiagnostic[]): StetCSSLintFileResult {
  return {
    filePath: cwd,
    languageId: 'manifest',
    sourceKind: 'manifest',
    diagnostics
  }
}

function createReport(cwd: string, manifest: CLILintReport['manifest'], files: StetCSSLintFileResult[]): CLILintReport {
  return {
    version: REPORT_VERSION,
    cwd,
    manifest,
    files,
    summary: summarizeStetCSSLintFiles(files)
  }
}

function formatStylish(report: CLILintReport) {
  const lines: string[] = []
  for (const result of report.files) {
    if (!result.diagnostics.length) continue
    lines.push(result.filePath)
    for (const diagnostic of result.diagnostics) {
      lines.push(`  ${diagnostic.loc.start.line}:${diagnostic.loc.start.column}  ${diagnostic.severity}  ${diagnostic.message}  ${diagnostic.ruleId ? `@stet-css/core/${diagnostic.ruleId}` : diagnostic.code}`)
    }
  }
  return lines.length ? `${lines.join('\n')}\n` : ''
}

function outputReport(report: CLILintReport, format: 'stylish' | 'json') {
  if (format === 'stylish') {
    const output = formatStylish(report)
    if (output) process.stdout.write(output)
  } else {
    console.log(JSON.stringify(report, null, 2))
  }
}

function resolveSourceInputs(cwd: string, specifiedSourcePaths: string[], options: LintOptions): SourceInput[] {
  if (options.stdin) {
    const filePath = path.resolve(cwd, options.stdinFilepath || 'stdin.html')
    return [{
      filePath,
      content: fs.readFileSync(0, 'utf8'),
      stdin: true
    }]
  }
  const sourcePatterns = normalizeSourcePatterns(specifiedSourcePaths)
  return resolveSourcePaths(cwd, sourcePatterns, specifiedSourcePaths.length ? [] : DEFAULT_IGNORE_PATTERNS).map((source) => {
    const filePath = path.resolve(cwd, source)
    return {
      filePath,
      content: fs.readFileSync(filePath, 'utf8')
    }
  })
}

function lintInputs(
  inputs: SourceInput[],
  css: CSSWithNativeDeclarations,
  rules: Record<StetCSSLintRuleId, boolean>
) {
  return inputs.map((input) => lintStetCSSContent({
    content: input.content,
    filePath: input.filePath,
    css,
    rules
  })).filter((result) => result.diagnostics.length)
}

function applyFileFixes(
  inputs: SourceInput[],
  css: CSSWithNativeDeclarations,
  rules: Record<StetCSSLintRuleId, boolean>,
  includeDirectiveFixes: boolean
) {
  for (const input of inputs) {
    if (input.stdin) continue
    const fixed = fixStetCSSContent({
      content: input.content,
      filePath: input.filePath,
      css,
      rules,
      includeDirectiveFixes
    })
    if (fixed !== input.content) {
      fs.writeFileSync(input.filePath, fixed)
      input.content = fixed
    }
  }
}

export default async function runLint(specifiedSourcePaths: string[] = [], options: LintOptions = {}) {
  const cwd = path.resolve(options.cwd || process.cwd())
  const format = options.format || 'json'
  const exitCode = options.exitCode || 'diagnostics'
  const rules = resolveStetCSSLintRules(options.rules)
  const inputs = resolveSourceInputs(cwd, specifiedSourcePaths, options)
  let manifest: CLILintReport['manifest']
  let files: StetCSSLintFileResult[]

  try {
    const manifestResult = await loadProjectManifest(cwd)
    const css = createCSSWithNativeDeclarations(manifestResult.manifest)
    manifest = {
      status: 'loaded',
      entries: manifestResult.entries,
      diagnostics: []
    }
    files = lintInputs(inputs, css, rules)
    if (options.fix && !options.fixDryRun) {
      applyFileFixes(inputs, css, rules, Boolean(options.fixDirectives))
      files = lintInputs(inputs, css, rules)
    }
  } catch (error) {
    const diagnostic = createManifestDiagnostic(cwd, error)
    manifest = {
      status: 'error',
      entries: [],
      diagnostics: [diagnostic]
    }
    files = [createManifestFileResult(cwd, [diagnostic])]
  }

  const report = createReport(cwd, manifest, files)
  outputReport(report, format)

  if (exitCode !== 'never' && (report.summary.errors || report.summary.warnings > parseMaxWarnings(options.maxWarnings))) {
    process.exitCode = 1
  }
  return report
}
