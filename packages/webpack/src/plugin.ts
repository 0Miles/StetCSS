import { CSSScanner, validatePluginOptions, type ScannerOptions } from '@stet-css/scanner'
import type { MasterCSSEmittedGlobals, MasterCSSManifest } from '@stet-css/core'
import { toManifestJSON } from '@stet-css/integration/manifest-module'
import {
  toBrowserManifestFacadeModule,
  toInlineManifestModule
} from '@stet-css/integration/manifest-facade'
import {
  toHashedManifestAssetFileName,
  toVirtualCSSModulePath,
  toVirtualDefaultManifestModulePath,
  toVirtualEmittedGlobalsModulePath
} from '@stet-css/integration/node'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { findCSSManifestEntryFiles, STYLE_ENTRY_EXTENSIONS } from '@stet-css/project/entries'
import {
  collectStyleCSSDependencies,
  createExtractedCSSResult,
  isStylesheetSourceFile,
  registerStyleCSSSource,
  resolveMasterStyleSource,
  resolveStylesheetSourceFiles,
  type StyleCSSSources,
  type StylesheetSourceContext
} from '@stet-css/stylesheet'
import { toEmittedGlobalsModule } from '@stet-css/integration/emitted-globals-module'
import type { Compiler } from 'webpack'
import type VirtualModulesPlugin from 'webpack-virtual-modules'
import { existsSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { isInsidePath, normalizePath } from './utils/path'
import { registerHost } from './utils/hosts'
import ScannerLifecyclePlugin from './plugins/scanner-lifecycle'
import VirtualModuleRegistryPlugin from './plugins/virtual-modules'
import ManifestVirtualModulePlugin from './plugins/manifest-virtual-module'
import ManifestJSONAssetsPlugin from './plugins/manifest-json-assets'
import VirtualCSSImportPlugin from './plugins/virtual-css-import'
import ManifestLoaderPlugin from './plugins/manifest-loader'
import StyleEntryPlugin from './plugins/style-entry'
import StaticCSSDependenciesPlugin from './plugins/static-css-dependencies'
import type { PluginOptions } from './options'

const NAME = 'MasterCSSPlugin'
const SEED_FILE_TIME = new Date('2000-01-01T00:00:00Z')
let hostCount = 0

/** The static CSS of one generation and every file whose change can alter it. */
export interface StaticCSSResult {
  css?: string
  error?: unknown
  /** Files whose change must regenerate the CSS, also after a failed generation. */
  dependencies: string[]
}

export interface WebpackSubPlugin {
  apply(compiler: Compiler): void
}

export interface MasterCSSWebpackContext {
  name: string
  /** Lets the style loader report entries to this plugin instance. */
  hostId: string
  cwd: string
  compilerContext: string
  virtualCSSImportModuleId: string
  virtualManifestModuleId: string
  virtualEmittedGlobalsModuleId: string
  virtualModule?: VirtualModulesPlugin
  on(...args: Parameters<CSSScanner['on']>): unknown
  init(customOptions?: ScannerOptions): Promise<unknown>
  reset(customOptions?: ScannerOptions): Promise<unknown>
  getOptions(): ScannerOptions
  getPluginInitialized(): boolean
  setPluginInitialized(pluginInitialized: boolean): void
  getDefaultManifestDependencyPaths(): string[]
  getResetDependencyPaths(): string[]
  writeVirtualModule(modulePath: string, moduleContent: string): void
  setManifestJSONAsset(assetFileName: string, json: string): void
  getManifestJSONAssets(): [string, string][]
  createDefaultManifestModule(): Promise<string>
  createEmittedGlobalsModule(): Promise<string>
  writeDefaultManifestModule(): Promise<void>
  /** Regenerates the static CSS when a changed path can alter it; all paths when unknown. */
  writeGeneratedCSSModule(changedFiles?: Iterable<string>): Promise<void>
  getStaticCSSDependencyPaths(): string[]
  getStaticCSSError(): unknown
  /** Bumped on every write of the generated CSS module. */
  getStaticCSSVersion(): number
  /** Resolves once generations the style loader started have written their CSS. */
  waitForGeneratedCSSModule(): Promise<void>
}

/**
 * Builds static CSS: the classes come from the project's files through the stylesheet's
 * class set, never from the modules webpack happened to compile. The CSS is generated before
 * each compilation and is in the virtual CSS module from its first build, so `style-loader`
 * and CSS extraction both ship it.
 */
export class MasterCSSPlugin {

  readonly scanner: CSSScanner
  readonly hostId = `${NAME}:${hostCount++}`
  pluginInitialized = false
  manifestJSONAssets = new Map<string, string>()
  defaultManifestDependencies: string[] = []
  emittedGlobals: MasterCSSEmittedGlobals = {}
  /** The project manifest the manifest module last loaded; static CSS renders with it. */
  private projectManifest?: MasterCSSManifest
  styleCSSSources: StyleCSSSources = new Map()
  /** Entries the style loader reported that discovery may miss, e.g. outside the root. */
  loadedStyleEntries = new Set<string>()
  /** Serializes generations: the style loader can ask for one during a compilation. */
  generation: Promise<void> = Promise.resolve()
  private context?: MasterCSSWebpackContext
  /** The last generation: written CSS, its dependencies and its error, if any. */
  staticCSS?: string
  staticCSSDependencies: string[] = []
  /** `staticCSSDependencies`, normalized for lookups while watching. */
  private staticCSSDependencySet = new Set<string>()
  staticCSSError?: unknown
  staticCSSVersion = 0
  /** Set on `apply`; its `output.path` is read once webpack has filled option defaults. */
  private compiler?: Compiler
  development = false

  /**
   * @param options - Only `adapters`; a removed or unknown key throws.
   */
  constructor(
    options: PluginOptions = {},
    public cwd = process.cwd()
  ) {
    validatePluginOptions(options, '@stet-css/webpack')
    this.scanner = new CSSScanner(options, cwd)
    registerHost(this.hostId, {
      addStyleEntry: (file) => this.addStyleEntry(file)
    })
  }

  get customOptions() {
    return this.scanner.customOptions
  }

  set customOptions(customOptions: ScannerOptions) {
    this.scanner.customOptions = customOptions
  }

  get options() {
    return this.scanner.options
  }

  get css() {
    return this.scanner.css
  }

  get manifest() {
    return this.scanner.manifest
  }

  on(...args: Parameters<CSSScanner['on']>) {
    this.scanner.on(...args)
    return this
  }

  emit(...args: Parameters<CSSScanner['emit']>) {
    return this.scanner.emit(...args)
  }

  async init(customOptions: ScannerOptions = this.customOptions) {
    await this.scanner.init(customOptions)
    return this
  }

  async reset(customOptions: ScannerOptions = this.customOptions) {
    await this.scanner.reset(customOptions)
    return this
  }

  private async createDefaultManifestModule() {
    const entries = await findCSSManifestEntryFiles(this.cwd)
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStyleCSSDependencies(entry, undefined, this.cwd)) {
        dependencies.add(dependency)
      }
    }
    this.defaultManifestDependencies = [...dependencies]

    const result = await loadProjectManifest(this.cwd, { entries })
    this.projectManifest = result.manifest
    for (const dependency of result.dependencies) {
      dependencies.add(dependency)
    }
    this.defaultManifestDependencies = [...dependencies]
    const json = toManifestJSON(result.manifest)
    if (this.development) return toInlineManifestModule(json)

    const assetFileName = toHashedManifestAssetFileName(json)
    this.manifestJSONAssets.set(assetFileName, json)
    return toBrowserManifestFacadeModule(`__webpack_public_path__ + ${JSON.stringify(assetFileName)}`)
  }

  private getResetDependencyPaths() {
    return [...new Set([
      ...this.defaultManifestDependencies,
      ...Array.from(this.styleCSSSources.values()).flatMap((source) => source.dependencies),
      ...this.scanner.resetDependencies
    ])]
  }

  /**
   * Registers every stylesheet entry, `.css`, `.scss` and `.sass` ones discovery finds plus
   * the ones the style loader reported, and records the files they read. A failed entry still
   * reports its import graph, so fixing it regenerates the CSS.
   */
  private async registerStyleEntries(dependencies: Set<string>) {
    const styleCSSSources: StyleCSSSources = new Map()
    const entries = new Set([
      ...await findCSSManifestEntryFiles(this.cwd, { extensions: STYLE_ENTRY_EXTENSIONS }),
      ...this.loadedStyleEntries
    ])
    for (const entry of entries) {
      let source: string
      try {
        source = readFileSync(entry, 'utf-8')
      } catch {
        this.loadedStyleEntries.delete(entry)
        continue
      }
      dependencies.add(entry)
      try {
        if (this.loadedStyleEntries.has(entry) && !resolveMasterStyleSource(entry, source, this.cwd)) {
          this.loadedStyleEntries.delete(entry)
          continue
        }
        await registerStyleCSSSource(this.scanner, styleCSSSources, entry, source, {
          projectDir: this.cwd
        })
      } catch (error) {
        for (const dependency of collectStyleCSSDependencies(entry, source, this.cwd)) {
          dependencies.add(dependency)
        }
        throw error
      }
    }
    this.styleCSSSources = styleCSSSources
    for (const styleSource of styleCSSSources.values()) {
      for (const dependency of styleSource.dependencies) {
        dependencies.add(dependency)
      }
    }
  }

  /** The compiler's output directory when it sits inside the project root. */
  private getIgnorePaths() {
    const outputPath = this.compiler?.options.output?.path
    if (!outputPath) return []
    const resolvedOutputPath = resolve(outputPath)
    return isInsidePath(resolvedOutputPath, resolve(this.cwd)) ? [resolvedOutputPath] : []
  }

  private createSourceContext(): StylesheetSourceContext {
    return {
      scanner: this.scanner,
      styleCSSSources: this.styleCSSSources,
      projectDir: this.cwd,
      ignorePaths: this.getIgnorePaths()
    }
  }

  /**
   * The static CSS and every file it depends on: the class set's source files, the entries'
   * import graphs and the scanner's config files.
   */
  async generateCSS(): Promise<StaticCSSResult> {
    const dependencies = new Set<string>()
    try {
      if (!this.scanner.initialized) {
        await this.init()
      }
      await this.registerStyleEntries(dependencies)
      const sourceContext = this.createSourceContext()
      const [result, sourceFiles] = await Promise.all([
        // Every class comes from the project's class set, none from compiled modules.
        createExtractedCSSResult({
          ...sourceContext,
          manifest: this.projectManifest
        }),
        resolveStylesheetSourceFiles(sourceContext)
      ])
      this.emittedGlobals = result.emittedGlobals
      for (const file of sourceFiles) {
        dependencies.add(file)
      }
      return { css: result.css, dependencies: this.withResetDependencies(dependencies) }
    } catch (error) {
      return { error, dependencies: this.withResetDependencies(dependencies) }
    }
  }

  private withResetDependencies(dependencies: Set<string>) {
    for (const dependency of this.scanner.resetDependencies) {
      dependencies.add(dependency)
    }
    return [...dependencies]
  }

  /** Whether a changed path can alter the static CSS; unknown changes always can. */
  private affectsStaticCSS(changedFiles: Iterable<string> | undefined) {
    if (this.staticCSS === undefined || this.staticCSSError !== undefined || !changedFiles) return true
    const sourceContext = this.createSourceContext()
    for (const changedFile of changedFiles) {
      if (this.staticCSSDependencySet.has(normalizePath(changedFile))) return true
      if (isStylesheetSourceFile(changedFile, sourceContext)) return true
    }
    return false
  }

  private writeGeneratedCSSModule(changedFiles?: Iterable<string>) {
    this.generation = this.generation
      .catch(() => undefined)
      .then(() => this.generateAndWriteCSSModule(changedFiles))
    return this.generation
  }

  private async generateAndWriteCSSModule(changedFiles?: Iterable<string>) {
    const context = this.context
    if (!context || !this.affectsStaticCSS(changedFiles)) return
    const result = await this.generateCSS()
    this.staticCSSDependencies = result.dependencies
    this.staticCSSDependencySet = new Set(result.dependencies.map(normalizePath))
    this.staticCSSError = result.error
    if (result.css === undefined || result.css === this.staticCSS) return
    this.staticCSS = result.css
    this.staticCSSVersion++
    context.writeVirtualModule(context.virtualCSSImportModuleId, result.css)
    context.writeVirtualModule(context.virtualEmittedGlobalsModuleId, toEmittedGlobalsModule(this.emittedGlobals))
  }

  private async addStyleEntry(file: string) {
    if (this.styleCSSSources.has(file) || this.loadedStyleEntries.has(file)) return
    this.loadedStyleEntries.add(file)
    await this.writeGeneratedCSSModule()
  }

  private async createEmittedGlobalsModule() {
    if (this.staticCSS === undefined) {
      await this.writeGeneratedCSSModule()
      if (this.staticCSSError !== undefined) throw this.staticCSSError
    }
    return toEmittedGlobalsModule(this.emittedGlobals)
  }

  private createContext(compiler: Compiler): MasterCSSWebpackContext {
    const compilerContext = compiler.context || this.cwd || process.cwd()
    const isRspack = Boolean((compiler.webpack as { rspackVersion?: string } | undefined)?.rspackVersion)
    this.development = compiler.options.mode === 'development'
    // Plugins apply before webpack fills option defaults, so `output.path` is read later.
    this.compiler = compiler
    const context: MasterCSSWebpackContext = {
      name: NAME,
      hostId: this.hostId,
      cwd: this.cwd,
      compilerContext,
      virtualCSSImportModuleId: toVirtualCSSModulePath(compilerContext),
      virtualManifestModuleId: toVirtualDefaultManifestModulePath(compilerContext),
      virtualEmittedGlobalsModuleId: toVirtualEmittedGlobalsModulePath(compilerContext),
      on: (...args) => this.on(...args),
      init: (customOptions = this.customOptions) => this.init(customOptions),
      reset: (customOptions = this.customOptions) => this.reset(customOptions),
      getOptions: () => this.options,
      getPluginInitialized: () => this.pluginInitialized,
      setPluginInitialized: (pluginInitialized) => {
        this.pluginInitialized = pluginInitialized
      },
      getDefaultManifestDependencyPaths: () => this.defaultManifestDependencies,
      getResetDependencyPaths: () => this.getResetDependencyPaths(),
      writeVirtualModule: (modulePath, moduleContent) => {
        let virtualWritten = false
        try {
          // Rspack reads modules from disk on its native side, past the virtual file system.
          if (context.virtualModule && !isRspack) {
            context.virtualModule.writeModule(modulePath, moduleContent)
            virtualWritten = true
          }
        } catch (error) {
          if (!(error instanceof TypeError) || !String(error.message).includes('_writeVirtualFile')) {
            throw error
          }
        }
        // With the virtual file in place, the file on disk only seeds it. A fresh write while
        // watching would look newer than the compilation's start and rebuild once more, so the
        // seed is written once and dated in the past.
        if (virtualWritten && existsSync(modulePath)) return
        mkdirSync(dirname(modulePath), { recursive: true })
        writeFileSync(modulePath, moduleContent)
        if (virtualWritten) utimesSync(modulePath, SEED_FILE_TIME, SEED_FILE_TIME)
      },
      setManifestJSONAsset: (assetFileName, json) => {
        this.manifestJSONAssets.set(assetFileName, json)
      },
      getManifestJSONAssets: () => [...this.manifestJSONAssets],
      createDefaultManifestModule: () => this.createDefaultManifestModule(),
      createEmittedGlobalsModule: () => this.createEmittedGlobalsModule(),
      writeDefaultManifestModule: async () => {
        if (!context.virtualModule || !context.virtualManifestModuleId) return
        context.writeVirtualModule(context.virtualManifestModuleId, await this.createDefaultManifestModule())
      },
      writeGeneratedCSSModule: (changedFiles) => this.writeGeneratedCSSModule(changedFiles),
      getStaticCSSDependencyPaths: () => this.staticCSSDependencies,
      getStaticCSSError: () => this.staticCSSError,
      getStaticCSSVersion: () => this.staticCSSVersion,
      waitForGeneratedCSSModule: () => this.generation.catch(() => undefined)
    }

    this.context = context
    return context
  }

  private createSubPlugins(context: MasterCSSWebpackContext): WebpackSubPlugin[] {
    return [
      ScannerLifecyclePlugin(context),
      VirtualModuleRegistryPlugin(context),
      ManifestVirtualModulePlugin(context),
      ManifestJSONAssetsPlugin(context),
      VirtualCSSImportPlugin(context),
      ManifestLoaderPlugin(context),
      StyleEntryPlugin(context),
      StaticCSSDependenciesPlugin(context)
    ]
  }

  apply(compiler: Compiler) {
    const context = this.createContext(compiler)
    for (const plugin of this.createSubPlugins(context)) {
      plugin.apply(compiler)
    }
  }
}
