import type CSSScanner from '@stet-css/scanner'
import type { StyleCSSSources } from '@stet-css/stylesheet'
import type { FSWatcher } from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_SCAN_OUTPUT } from './constants'

type Chokidar = typeof import('chokidar').default
type Logger = ReturnType<typeof import('consola').createConsola>
type Bytes = (value: number) => string
type CSSScannerConstructor = typeof import('@stet-css/scanner').default
type StylesheetModule = typeof import('@stet-css/stylesheet')
type ProjectEntriesModule = typeof import('@stet-css/project/entries')

let scannerModulePromise: Promise<CSSScannerConstructor> | undefined
let stylesheetModulePromise: Promise<StylesheetModule> | undefined
let projectEntriesModulePromise: Promise<ProjectEntriesModule> | undefined
let chokidarModulePromise: Promise<Chokidar> | undefined
let loggerPromise: Promise<Logger> | undefined
let bytesPromise: Promise<Bytes> | undefined

export interface ScanOptions {
  watch?: boolean
  output?: string
  /** Log level: 0 is silent, 1 (the default) reports the written file, 2 also lists the files read. */
  verbose?: string | number
  export?: boolean
  cwd?: string
}

async function registerManagedCSSEntries(scanner: CSSScanner, styleCSSSources: StyleCSSSources) {
  const [
    { registerStyleCSSSource },
    { findCSSManifestEntryFiles }
  ] = await Promise.all([
    loadStylesheetModule(),
    loadProjectEntriesModule()
  ])
  styleCSSSources.clear()
  for (const entry of await findCSSManifestEntryFiles(scanner.cwd)) {
    await registerStyleCSSSource(scanner, styleCSSSources, entry, fs.readFileSync(entry, 'utf8'), {
      projectDir: scanner.cwd
    })
  }
  scanner.resetDependencies = [...new Set(
    Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
  )]
}

/** Source path arguments replace the project's own source files; globs use `/` on every platform. */
function normalizeSourcePatterns(specifiedSourcePaths: string[]) {
  return specifiedSourcePaths.length
    ? specifiedSourcePaths.map((pattern) => pattern.replace(/\\/g, '/'))
    : undefined
}

async function exportCSS(scanner: CSSScanner, css: string, verbose: number, filename = DEFAULT_SCAN_OUTPUT) {
  const filepath = path.resolve(scanner.cwd, filename)
  const dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filepath, css)
  if (verbose) {
    const [logger, bytes] = await Promise.all([
      loadLogger(),
      loadBytes()
    ])
    logger.success(`${filename} exported ${bytes(css.length)}`)
  }
  scanner.emit('export', filename, filepath)
}

function formatWatchedPath(cwd: string, file: string) {
  return path.isAbsolute(file) ? path.relative(cwd, file) : file
}

async function waitForWatcherReady(watcher: FSWatcher) {
  await new Promise<void>((resolve) => watcher.once('ready', resolve))
  // Let chokidar finish registering native watchers before callers mutate files.
  await new Promise((resolve) => setTimeout(resolve, 0))
}

export default async function runScan(specifiedSourcePaths: string[] = [], options: ScanOptions = {}) {
  const pipelineModules = Promise.all([
    loadStylesheetModule(),
    loadProjectEntriesModule()
  ])
  const CSSScanner = await loadCSSScanner()
  const { watch, output, cwd } = options
  const verbose = options.verbose === undefined ? 1 : Number(options.verbose) || 0
  const scanner = new CSSScanner({}, cwd)
  const styleCSSSources: StyleCSSSources = new Map()
  const sources = normalizeSourcePatterns(specifiedSourcePaths)
  const resolveSourceFiles = async () => {
    const { resolveStylesheetSourceFiles } = await loadStylesheetModule()
    return resolveStylesheetSourceFiles({
      scanner,
      styleCSSSources,
      projectDir: scanner.cwd,
      sources
    })
  }
  const writeOutput = async () => {
    const { createExtractedCSS } = await loadStylesheetModule()
    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: scanner.cwd,
      sources
    })
    if (verbose > 1) {
      const logger = await loadLogger()
      for (const file of await resolveSourceFiles()) {
        logger.info(`read ${formatWatchedPath(scanner.cwd, file)}`)
      }
    }
    if (options.export) {
      await exportCSS(scanner, css, verbose, output)
    } else {
      console.log(css)
    }
  }
  await scanner.init()
  if (watch) {
    const chokidar = await loadChokidar()
    const watchers: FSWatcher[] = []
    let restarting = false
    let writing = Promise.resolve()
    const queueWrite = () => {
      writing = writing.then(writeOutput)
      return writing
    }
    const closeWatchers = async () => {
      await Promise.all(watchers.splice(0).map((watcher) => watcher.close()))
    }
    const startWatchers = async () => {
      const sourcePaths = await resolveSourceFiles()
      if (sourcePaths.length) {
        const sourceWatcher = chokidar.watch(sourcePaths, {
          ignoreInitial: true
        })
        sourceWatcher.on('add', () => {
          void queueWrite()
        })
        sourceWatcher.on('change', () => {
          void queueWrite()
        })
        watchers.push(sourceWatcher)
        await waitForWatcherReady(sourceWatcher)
      }
      if (scanner.resetDependencies.length) {
        const planWatcher = chokidar.watch(scanner.resetDependencies, {
          ignoreInitial: true
        })
        const handlePlanChange = async (resetDependency: string) => {
          if (restarting) return
          restarting = true
          try {
            if (verbose) {
              const logger = await loadLogger()
              logger.log('')
              logger.info(`[change] ${formatWatchedPath(scanner.cwd, resetDependency)}`)
            }
            await closeWatchers()
            await scanner.reset(scanner.customOptions, { emit: false })
            await registerManagedCSSEntries(scanner, styleCSSSources)
            await queueWrite()
            await startWatchers()
            const logger = await loadLogger()
            logger.log('')
            logger.info('Restart watching source changes')
            scanner.emit('resetDependencyChange')
          } finally {
            restarting = false
          }
        }
        planWatcher.on('add', (resetDependency) => {
          void handlePlanChange(resetDependency)
        })
        planWatcher.on('change', (resetDependency) => {
          void handlePlanChange(resetDependency)
        })
        planWatcher.on('unlink', (resetDependency) => {
          void handlePlanChange(resetDependency)
        })
        watchers.push(planWatcher)
        await waitForWatcherReady(planWatcher)
      }
    }
    process.once('SIGTERM', () => {
      void closeWatchers().finally(() => process.exit(0))
    })
    process.once('SIGINT', () => {
      void closeWatchers().finally(() => process.exit(0))
    })
    await pipelineModules
    await registerManagedCSSEntries(scanner, styleCSSSources)
    await queueWrite()
    await startWatchers()
    const logger = await loadLogger()
    logger.log('')
    logger.info('Start watching source changes')
  } else {
    await pipelineModules
    await registerManagedCSSEntries(scanner, styleCSSSources)
    await writeOutput()
  }
}

function loadCSSScanner() {
  scannerModulePromise ||= import('@stet-css/scanner').then((mod) => mod.default)
  return scannerModulePromise
}

function loadStylesheetModule() {
  stylesheetModulePromise ||= import('@stet-css/stylesheet')
  return stylesheetModulePromise
}

function loadProjectEntriesModule() {
  projectEntriesModulePromise ||= import('@stet-css/project/entries')
  return projectEntriesModulePromise
}

function loadChokidar() {
  chokidarModulePromise ||= import('chokidar').then((mod) => mod.default)
  return chokidarModulePromise
}

function loadLogger() {
  loggerPromise ||= import('consola').then(({ createConsola }) => createConsola({ level: 3 }))
  return loggerPromise
}

function loadBytes() {
  bytesPromise ||= import('bytes').then((mod) => (mod as unknown as { default?: Bytes }).default || mod as unknown as Bytes)
  return bytesPromise
}
