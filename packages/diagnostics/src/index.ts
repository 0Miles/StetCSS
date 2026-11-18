import CSSScanner, { type ScannerSourceResult } from '@stet-css/scanner'
import {
  createExtractedCSSResult,
  getStyleCSSSourcesDirectives,
  isClassBlocklisted,
  registerStyleCSSSource,
  resolveStylesheetSourceFiles,
  type StyleCSSSources,
  type StylesheetDirectives
} from '@stet-css/stylesheet'
import { findCSSManifestEntryFiles } from '@stet-css/project/entries'
import { loadProjectManifest } from '@stet-css/project/manifest'
import fs from 'node:fs'
import path from 'node:path'

export const STET_CSS_INSPECTION_REPORT_VERSION = 1

export type StetCSSInspectionDiagnosticSeverity = 'error' | 'warning'
export type StetCSSInspectionDiagnosticCode =
  | 'invalid-scanner-class'
  | 'missing-css'
  | 'stylesheet-error'
  | 'stylesheet-warning'
  | 'scanner-error'
export type StetCSSInspectionDiagnosticSourceKind = 'scanner' | 'stylesheet' | 'missing-css'

export interface StetCSSInspectionDiagnostic {
  code: StetCSSInspectionDiagnosticCode
  severity: StetCSSInspectionDiagnosticSeverity
  message: string
  source: 'StetCSS'
  sourceKind: StetCSSInspectionDiagnosticSourceKind
  filePath?: string
  data?: unknown
}

export interface StetCSSSourceInspection {
  filePath: string
  source: string
  scanned: boolean
  changed: boolean
  discovered: {
    latent: string[]
    valid: string[]
    invalid: string[]
  }
}

export interface StetCSSStylesheetInspection {
  filePath: string
  stetCSS: boolean
  dependencies: string[]
  sourceDependencies: string[]
  warnings: string[]
  errors: string[]
}

export interface StetCSSStylesheetError {
  filePath: string
  message: string
}

export interface StetCSSMissingCSSResult {
  className: string
  status: 'present' | 'missing'
  reason: 'generated' | 'native-css' | 'safelist' | 'invalid' | 'blocklisted' | 'not-detected'
}

export interface StetCSSInspectionReport {
  version: typeof STET_CSS_INSPECTION_REPORT_VERSION
  cwd: string
  inputs: {
    patterns: string[]
    files: string[]
    classes: string[]
  }
  scanner: {
    counts: {
      latent: number
      valid: number
      invalid: number
      safelist: number
      blocklist: number
    }
    classes: {
      latent: string[]
      valid: string[]
      invalid: string[]
      safelist: string[]
      blocklist: string[]
    }
    resetDependencies: string[]
  }
  stylesheets: {
    entries: StetCSSStylesheetInspection[]
    dependencies: string[]
    warnings: string[]
    errors: StetCSSStylesheetError[]
  }
  css: {
    bytes: number
    included: boolean
    text?: string
    emittedGlobals: {
      variables: number
      animations: number
    }
  }
  missingCSS: {
    checked: string[]
    present: StetCSSMissingCSSResult[]
    missing: StetCSSMissingCSSResult[]
  }
  files: StetCSSSourceInspection[]
  diagnostics: StetCSSInspectionDiagnostic[]
  summary: {
    files: number
    stylesheets: number
    diagnostics: number
    errors: number
    warnings: number
    missingCSS: number
    invalidClasses: number
  }
}

export interface CreateStetCSSInspectionReportOptions {
  cwd?: string
  /** Glob patterns that replace the project's own source files, as the root command's arguments do. */
  patterns?: string[]
  classes?: string[] | string
  includeCss?: boolean
  /** Glob patterns, relative to `cwd`, removed from the inspected files. */
  ignore?: string[]
  resolveExistingFile?: (filePath: string) => string | Promise<string>
  validatePatterns?: (patterns: string[]) => void
}

function normalizeGlobPatterns(patterns: string[]) {
  return patterns.map((pattern) => pattern.replace(/\\/g, '/'))
}

/**
 * The files the root command reads for the same patterns, as `cwd`-relative paths, minus
 * any `ignore` patterns.
 */
async function resolveSourcePaths(
  scanner: CSSScanner,
  styleCSSSources: StyleCSSSources,
  sources: string[] | undefined,
  ignore: string[] = []
) {
  const ignorePatterns = normalizeGlobPatterns(ignore)
  return (await resolveStylesheetSourceFiles({ scanner, styleCSSSources, projectDir: scanner.cwd, sources }))
    .map((file) => path.relative(scanner.cwd, file).replace(/\\/g, '/'))
    .filter((source) => !ignorePatterns.some((pattern) => path.matchesGlob(source, pattern)))
}

function sortedValues(values: Iterable<string>) {
  return [...new Set(values)].sort()
}

function parseClassChecks(value: string[] | string | undefined) {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : value?.split(/\s+/).map((item) => item.trim()).filter(Boolean) ?? []
}

function createScannerClassDiagnostics(scanner: CSSScanner, firstSourceByClass: Map<string, string>): StetCSSInspectionDiagnostic[] {
  return sortedValues(scanner.invalidClasses).map((className) => ({
    code: 'invalid-scanner-class',
    severity: 'warning',
    message: `Scanner candidate "${className}" did not generate StetCSS rules.`,
    source: 'StetCSS',
    sourceKind: 'scanner',
    filePath: firstSourceByClass.get(className),
    data: {
      className
    }
  }))
}

const CSS_CLASS_SELECTOR_RE = /\.((?:\\.|[-_a-zA-Z\u00a0-\uffff])(?:\\.|[-\w\u00a0-\uffff])*)/g

/**
 * Class names that have a selector in an entry's native CSS. Entries keep every native rule,
 * so such a class is styled whether or not markup uses it. Only rule preludes are read, so
 * declaration values such as `url(a.png)` are not mistaken for selectors.
 */
function collectNativeCSSClassNames(css: string, classNames: Set<string>) {
  let preludeStart = 0
  for (let index = 0; index < css.length; index++) {
    const char = css[index]
    if (char === '"' || char === '\'') {
      const close = css.indexOf(char, index + 1)
      index = close === -1 ? css.length : close
    } else if (char === '/' && css[index + 1] === '*') {
      const close = css.indexOf('*/', index + 2)
      index = close === -1 ? css.length : close + 1
    } else if (char === ';' || char === '}') {
      preludeStart = index + 1
    } else if (char === '{') {
      for (const match of css.slice(preludeStart, index).matchAll(CSS_CLASS_SELECTOR_RE)) {
        classNames.add(match[1].replace(/\\(.)/g, '$1'))
      }
      preludeStart = index + 1
    }
  }
  return classNames
}

/**
 * Classifies a checked class by the class set's rule: `@blocklist` removes a class whatever
 * detected it, and `@safelist` adds one no file uses.
 */
function classifyMissingCSS(
  scanner: CSSScanner,
  directives: StylesheetDirectives,
  nativeRuleClasses: Set<string>,
  className: string
): StetCSSMissingCSSResult {
  if (nativeRuleClasses.has(className)) {
    return { className, status: 'present', reason: 'native-css' }
  }
  if (isClassBlocklisted(className, directives.blocklist)) {
    return { className, status: 'missing', reason: 'blocklisted' }
  }
  if (scanner.validClasses.has(className)) {
    return { className, status: 'present', reason: 'generated' }
  }
  if (directives.safelist.includes(className)) {
    return { className, status: 'present', reason: 'safelist' }
  }
  if (scanner.invalidClasses.has(className)) {
    return { className, status: 'missing', reason: 'invalid' }
  }
  return { className, status: 'missing', reason: 'not-detected' }
}

function createMissingCSSDiagnostics(results: StetCSSMissingCSSResult[]): StetCSSInspectionDiagnostic[] {
  return results
    .filter((result) => result.status === 'missing')
    .map((result) => ({
      code: 'missing-css',
      severity: 'error',
      message: `No generated CSS found for "${result.className}" (${result.reason}).`,
      source: 'StetCSS',
      sourceKind: 'missing-css',
      data: result
    }))
}

async function resolveFilePath(cwd: string, filePath: string, resolver?: CreateStetCSSInspectionReportOptions['resolveExistingFile']) {
  return resolver
    ? await resolver(filePath)
    : path.resolve(cwd, filePath)
}

async function resolveCSSEntryFiles(cwd: string, resolver?: CreateStetCSSInspectionReportOptions['resolveExistingFile']) {
  return Promise.all((await findCSSManifestEntryFiles(cwd)).map((entry) => resolveFilePath(cwd, entry, resolver)))
}

/**
 * The manifest the build compiles from the project's entries, with their tokens, modes and
 * utilities, so the scanner judges classes the way the build does. Any broken entry fails the
 * build and is reported per entry by `registerManagedCSSEntries`; until it is fixed, classes
 * from every entry fall back to the preset manifest.
 */
async function loadEntryManifest(cwd: string, entryFiles: string[]) {
  if (!entryFiles.length) return undefined
  try {
    return (await loadProjectManifest(cwd, { entries: entryFiles })).manifest
  } catch {
    return undefined
  }
}

async function registerManagedCSSEntries(
  scanner: CSSScanner,
  styleCSSSources: StyleCSSSources,
  entryFiles: string[]
) {
  const entries: StetCSSStylesheetInspection[] = []
  const warnings: string[] = []
  const errors: StetCSSStylesheetError[] = []
  const nativeRuleClasses = new Set<string>()
  styleCSSSources.clear()
  for (const filePath of entryFiles) {
    try {
      const result = await registerStyleCSSSource(scanner, styleCSSSources, filePath, fs.readFileSync(filePath, 'utf8'), {
        projectDir: scanner.cwd
      })
      const styleSource = styleCSSSources.get(filePath)
      entries.push({
        filePath,
        stetCSS: Boolean(styleSource?.stetCSS),
        dependencies: sortedValues(styleSource?.dependencies ?? []),
        sourceDependencies: sortedValues(styleSource?.sourceDependencies ?? []),
        warnings: result.warnings ?? [],
        errors: []
      })
      warnings.push(...(result.warnings ?? []))
      collectNativeCSSClassNames(result.nativeCSS, nativeRuleClasses)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      entries.push({
        filePath,
        stetCSS: false,
        dependencies: [],
        sourceDependencies: [],
        warnings: [],
        errors: [message]
      })
      errors.push({
        filePath,
        message
      })
    }
  }
  scanner.resetDependencies = sortedValues(
    Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
  )
  return {
    entries,
    warnings: sortedValues(warnings),
    errors,
    nativeRuleClasses
  }
}

/**
 * One file's own candidates, classified by the scanner's class sets once every file is
 * scanned, so a class several files use is listed under each of them.
 */
function inspectSourceFile(
  scanner: CSSScanner,
  source: string,
  filePath: string,
  scan: ScannerSourceResult,
  firstSourceByClass: Map<string, string>
): StetCSSSourceInspection {
  const latent = sortedValues(scan.candidates)
  const valid = latent.filter((className) => scanner.validClasses.has(className))
  const invalid = latent.filter((className) => scanner.invalidClasses.has(className))
  for (const className of latent) {
    if (!firstSourceByClass.has(className)) firstSourceByClass.set(className, filePath)
  }
  return {
    filePath,
    source,
    scanned: true,
    changed: scan.changed,
    discovered: {
      latent,
      valid,
      invalid
    }
  }
}

function createSummary(report: Omit<StetCSSInspectionReport, 'summary'>): StetCSSInspectionReport['summary'] {
  const errors = report.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
  const warnings = report.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
  return {
    files: report.files.length,
    stylesheets: report.stylesheets.entries.length,
    diagnostics: report.diagnostics.length,
    errors,
    warnings,
    missingCSS: report.missingCSS.missing.length,
    invalidClasses: report.scanner.counts.invalid
  }
}

function createEmptyReport(cwd: string, sourcePatterns: string[], classChecks: string[], diagnostics: StetCSSInspectionDiagnostic[]): StetCSSInspectionReport {
  const baseReport: Omit<StetCSSInspectionReport, 'summary'> = {
    version: STET_CSS_INSPECTION_REPORT_VERSION,
    cwd,
    inputs: {
      patterns: sourcePatterns,
      files: [],
      classes: classChecks
    },
    scanner: {
      counts: {
        latent: 0,
        valid: 0,
        invalid: 0,
        safelist: 0,
        blocklist: 0
      },
      classes: {
        latent: [],
        valid: [],
        invalid: [],
        safelist: [],
        blocklist: []
      },
      resetDependencies: []
    },
    stylesheets: {
      entries: [],
      dependencies: [],
      warnings: [],
      errors: []
    },
    css: {
      bytes: 0,
      included: false,
      emittedGlobals: {
        variables: 0,
        animations: 0
      }
    },
    missingCSS: {
      checked: classChecks,
      present: [],
      missing: []
    },
    files: [],
    diagnostics
  }
  return {
    ...baseReport,
    summary: createSummary(baseReport)
  }
}

export async function createStetCSSInspectionReport(options: CreateStetCSSInspectionReportOptions = {}): Promise<StetCSSInspectionReport> {
  const cwd = path.resolve(options.cwd || process.cwd())
  const classChecks = parseClassChecks(options.classes)
  const sources = options.patterns?.length ? normalizeGlobPatterns(options.patterns) : undefined
  const sourcePatterns = sources ?? []
  options.validatePatterns?.(sourcePatterns)
  const styleCSSSources: StyleCSSSources = new Map()
  const firstSourceByClass = new Map<string, string>()
  const diagnostics: StetCSSInspectionDiagnostic[] = []

  try {
    const entryFiles = await resolveCSSEntryFiles(cwd, options.resolveExistingFile)
    // Classes are judged by the entry's manifest, as the build judges them.
    const scanner = new CSSScanner({}, cwd, { manifest: await loadEntryManifest(cwd, entryFiles) })
    await scanner.init()
    const stylesheetInspection = await registerManagedCSSEntries(scanner, styleCSSSources, entryFiles)
    diagnostics.push(...stylesheetInspection.entries.flatMap((entry) => entry.warnings.map((warning) => ({
      code: 'stylesheet-warning' as const,
      severity: 'warning' as const,
      message: warning,
      source: 'StetCSS' as const,
      sourceKind: 'stylesheet' as const,
      filePath: entry.filePath
    }))))
    diagnostics.push(...stylesheetInspection.errors.map((error) => ({
      code: 'stylesheet-error' as const,
      severity: 'error' as const,
      message: error.message,
      source: 'StetCSS' as const,
      sourceKind: 'stylesheet' as const,
      filePath: error.filePath
    })))
    const sourcePaths = await resolveSourcePaths(scanner, styleCSSSources, sources, options.ignore)
    const resolvedSourcePaths = await Promise.all(sourcePaths.map((source) => resolveFilePath(cwd, source, options.resolveExistingFile)))
    const scans = await Promise.all(sourcePaths.map((source, index) => scanner.scanSource(
      source, fs.readFileSync(resolvedSourcePaths[index], 'utf8')
    )))
    const files = sourcePaths.map((source, index) => inspectSourceFile(
      scanner, source, resolvedSourcePaths[index], scans[index], firstSourceByClass
    ))
    const cssResult = await createExtractedCSSResult({
      scanner,
      styleCSSSources,
      projectDir: scanner.cwd,
      sources
    })
    const directives = getStyleCSSSourcesDirectives(styleCSSSources)
    const missingResults = classChecks.map((className) => classifyMissingCSS(scanner, directives, stylesheetInspection.nativeRuleClasses, className))
    diagnostics.push(...createScannerClassDiagnostics(scanner, firstSourceByClass))
    diagnostics.push(...createMissingCSSDiagnostics(missingResults))

    const baseReport: Omit<StetCSSInspectionReport, 'summary'> = {
      version: STET_CSS_INSPECTION_REPORT_VERSION,
      cwd,
      inputs: {
        patterns: sourcePatterns,
        files: resolvedSourcePaths,
        classes: classChecks
      },
      scanner: {
        counts: {
          latent: scanner.latentClasses.size,
          valid: scanner.validClasses.size,
          invalid: scanner.invalidClasses.size,
          safelist: directives.safelist.length,
          blocklist: directives.blocklist.length
        },
        classes: {
          latent: sortedValues(scanner.latentClasses),
          valid: sortedValues(scanner.validClasses),
          invalid: sortedValues(scanner.invalidClasses),
          safelist: sortedValues(directives.safelist),
          blocklist: directives.blocklist.map(String).sort()
        },
        resetDependencies: sortedValues(scanner.resetDependencies)
      },
      stylesheets: {
        entries: stylesheetInspection.entries,
        dependencies: sortedValues(stylesheetInspection.entries.flatMap((entry) => entry.dependencies)),
        warnings: stylesheetInspection.warnings,
        errors: stylesheetInspection.errors
      },
      css: {
        bytes: cssResult.css.length,
        included: Boolean(options.includeCss),
        ...(options.includeCss ? { text: cssResult.css } : {}),
        emittedGlobals: {
          variables: Object.keys(cssResult.emittedGlobals.variables).length,
          animations: Object.keys(cssResult.emittedGlobals.animations).length
        }
      },
      missingCSS: {
        checked: classChecks,
        present: missingResults.filter((result) => result.status === 'present'),
        missing: missingResults.filter((result) => result.status === 'missing')
      },
      files,
      diagnostics
    }
    return {
      ...baseReport,
      summary: createSummary(baseReport)
    }
  } catch (error) {
    diagnostics.push({
      code: 'scanner-error',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      source: 'StetCSS',
      sourceKind: 'scanner',
      data: {
        cwd
      }
    })
    return createEmptyReport(cwd, sourcePatterns, classChecks, diagnostics)
  }
}
