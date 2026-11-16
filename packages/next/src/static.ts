import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import CSSScanner, { type ScannerOptions } from '@stet-css/scanner'
import {
  createExtractedCSS,
  registerStyleCSSSource,
  resolveStylesheetSourceFiles,
  type StyleCSSSources
} from '@stet-css/stylesheet'
import { findCSSManifestEntryFiles, STYLE_ENTRY_EXTENSIONS } from '@stet-css/project/entries'

// Not under node_modules/.master-css like the virtual modules: webpack snapshots
// node_modules as immutable (`managedPaths`), so it would not see the file being rewritten.
const STATIC_OUTPUT_FILE = '.master/next.css'
const STATIC_OUTPUT_PLACEHOLDER = '/* Replaced by @stet-css/next with the CSS generated from the project files. */\n'

export interface StaticCSSOptions {
  projectDir: string
  scannerOptions?: ScannerOptions
}

export interface StaticCSSResult {
  css: string
  /** Every file the CSS was computed from: stylesheet entries, their imports, and the class set's source files. */
  dependencies: string[]
}

/** The one module every stylesheet entry imports; the generated CSS loader fills it in. */
export function resolveStaticOutputPath(projectDir: string) {
  return resolve(projectDir, STATIC_OUTPUT_FILE)
}

/**
 * Bundlers resolve the generated CSS module from disk, so the file must exist before the
 * first stylesheet entry is compiled; its content is never served.
 */
export function ensureStaticOutputFile(projectDir: string) {
  const outputPath = resolveStaticOutputPath(projectDir)
  const outputDir = dirname(outputPath)
  if (!existsSync(outputPath)) {
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(outputPath, STATIC_OUTPUT_PLACEHOLDER)
  }
  // The directory ignores itself, so projects need no `.gitignore` entry.
  const gitignorePath = resolve(outputDir, '.gitignore')
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, '*\n')
  }
  return outputPath
}

/**
 * Writes the generated CSS through a temporary file and a rename: parallel compilers write
 * the same file, and none may read it half-written.
 */
export async function writeStaticOutputFile(outputPath: string, css: string) {
  try {
    if (await readFile(outputPath, 'utf8') === css) return
  } catch {
    // Written below.
  }
  mkdirSync(dirname(outputPath), { recursive: true })
  const temporaryPath = `${outputPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
  await writeFile(temporaryPath, css)
  await rename(temporaryPath, outputPath)
}

export function toCSSImportPath(fromFile: string, toFile: string) {
  const importPath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
  return importPath.startsWith('.') ? importPath : './' + importPath
}

/**
 * Computes the project's CSS in one pass from what is on disk: every stylesheet entry and
 * the class set `@stet-css/stylesheet` decides from the project's files. No module scan
 * feeds it, so the result does not depend on which modules the bundler compiled first.
 */
export async function createStaticCSS({ projectDir, scannerOptions = {} }: StaticCSSOptions): Promise<StaticCSSResult> {
  const scanner = new CSSScanner(scannerOptions, projectDir)
  await scanner.init()
  const styleCSSSources: StyleCSSSources = new Map()
  for (const entry of await findCSSManifestEntryFiles(projectDir, { extensions: STYLE_ENTRY_EXTENSIONS })) {
    await registerStyleCSSSource(scanner, styleCSSSources, entry, await readFile(entry, 'utf8'), {
      projectDir
    })
  }
  const context = { scanner, styleCSSSources, projectDir }
  const [css, sourceFiles] = await Promise.all([
    // Nothing is scanned module by module: every class comes from the project's class set.
    createExtractedCSS(context),
    resolveStylesheetSourceFiles(context)
  ])
  return {
    css,
    dependencies: [...new Set([
      ...Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies),
      ...sourceFiles
    ])]
  }
}
