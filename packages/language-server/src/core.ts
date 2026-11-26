import { createConnection, TextDocuments, InitializeParams, InitializeResult, WorkspaceFolder, Disposable, Connection, ClientCapabilities, TextDocumentChangeEvent, DidChangeConfigurationParams, HoverParams, CompletionParams, DocumentColorParams, ColorPresentationParams, DocumentFormattingParams, DocumentRangeFormattingParams, RemoteConsole, SemanticTokensParams, TextDocumentPositionParams, DiagnosticSeverity, TextDocumentSyncKind, type ColorInformation, type ColorPresentation, type CompletionItem, type Diagnostic, type DiagnosticRelatedInformation, type Hover, type SemanticTokens, type Range, type ServerCapabilities, type TextEdit } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import CSSLanguageService, { collectSFCStyleBlocks, CSS_STYLE_LANGUAGE_IDS, SFC_LANGUAGE_IDS } from '@stet-css/language-service'
import { assertQuotedCSSDirectiveArguments, compileCSSManifest } from '@stet-css/compiler'
import { cssTreeNativeDeclarationMatcher, generateValidRules } from '@stet-css/validator'
import { Settings } from './settings'
import { FileWatcher, readFileStamp, type FileStamp } from './file-watcher'
import {
  findCSSManifestEntryFiles,
  findStetCSSWorkspaceDirectories,
  hasStetCSSManifestEntrypoint
} from '@stet-css/project/entries'
import { loadProjectManifest } from '@stet-css/project/manifest'
import { resolveStetCSSWorkspacePackages, type StetCSSWorkspacePackageResolution } from '@stet-css/project/workspace'
import { defu } from 'defu'
import settings from './settings'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import {
  AT_TRIGGER_CHARACTER,
  DECLARATION_SEPARATOR_TRIGGER_CHARACTER,
  GROUP_TRIGGER_CHARACTER,
  INVOKED_TRIGGER_CHARACTERS,
  QUERY_TRIGGER_CHARACTERS,
  SELECTOR_TRIGGER_CHARACTERS,
  VALUE_TRIGGER_CHARACTERS
} from '@stet-css/language-service/common'
import {
  defaultCSSLanguageRuntime,
  SEMANTIC_TOKENS_LEGEND,
  type CSSLanguageRuntime
} from '@stet-css/language'
import glob from 'fast-glob'
import { URI } from 'vscode-uri'
import { CSSDirectiveError, type CSSDirectiveSourceReference } from '@stet-css/schema/css-directives'

export declare interface Workspace {
  uri: string
  openedTextDocuments: TextDocument[]
  languageService?: CSSLanguageService
  languageServiceSettings: Settings
  languageRuntime?: CSSLanguageRuntime
  languageRuntimeResolution?: StetCSSWorkspacePackageResolution
  languageRuntimeSource?: 'workspace' | 'bundled'
  manifestErrors?: unknown[]
  planEntries?: string[]
  /** Every stylesheet the last manifest load reached from the entries, as absolute paths. */
  stetCSSGraphFiles?: Set<string>
}

export const ACTIVE_SEMANTIC_TOKENS_REQUEST = 'stetCSS/renderActiveSemanticTokens'
export const DOCUMENT_SEMANTIC_TOKENS_REQUEST = 'stetCSS/renderDocumentSemanticTokens'

const SERVER_CAPABILITIES: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Incremental,
  completionProvider: {
    resolveProvider: false,
    workDoneProgress: false,
    triggerCharacters: [
      ...new Set([
        ...INVOKED_TRIGGER_CHARACTERS,
        ...VALUE_TRIGGER_CHARACTERS,
        ...SELECTOR_TRIGGER_CHARACTERS,
        ...QUERY_TRIGGER_CHARACTERS,
        DECLARATION_SEPARATOR_TRIGGER_CHARACTER,
        AT_TRIGGER_CHARACTER,
        GROUP_TRIGGER_CHARACTER,
      ])
    ]
  },
  colorProvider: true,
  hoverProvider: true,
  documentFormattingProvider: true,
  documentRangeFormattingProvider: true,
  semanticTokensProvider: {
    legend: SEMANTIC_TOKENS_LEGEND,
    full: true
  },
  workspace: {
    workspaceFolders: {
      supported: true,
    },
  }
}

/**
 * What every runtime the server builds shares with the build: css-tree judges
 * native `property:value` classes, and the validator's rule filter decides
 * which rules a class emits, so hover and highlighting show the build's output.
 */
const buildValidity: Pick<CSSLanguageRuntime, 'nativeDeclarationMatcher' | 'generateRules'> = {
  nativeDeclarationMatcher: cssTreeNativeDeclarationMatcher,
  generateRules: (css, className) => generateValidRules(className, css)
}

const bundledLanguageRuntime: CSSLanguageRuntime = {
  ...defaultCSSLanguageRuntime,
  ...buildValidity
}

interface CSSDiagnosticSource {
  source: string
  offset: number
}

function isCSSDiagnosticDocument(textDocument: TextDocument) {
  return CSS_STYLE_LANGUAGE_IDS.has(textDocument.languageId)
    || SFC_LANGUAGE_IDS.has(textDocument.languageId)
}

function getCSSDiagnosticSources(textDocument: TextDocument): CSSDiagnosticSource[] {
  const text = textDocument.getText()
  if (CSS_STYLE_LANGUAGE_IDS.has(textDocument.languageId)) {
    return [{ source: text, offset: 0 }]
  }
  if (!SFC_LANGUAGE_IDS.has(textDocument.languageId)) return []
  return collectSFCStyleBlocks(text).map(({ content, start }) => ({ source: content, offset: start }))
}

/** Languages whose `//` starts a line comment, which CSS directive scanning does not know. */
const LINE_COMMENT_LANGUAGE_IDS = new Set(['scss', 'less'])

const UNQUOTED_URL_START_RE = /url\(\s*[^\s'")]/iy

function matchesAt(pattern: RegExp, source: string, index: number) {
  pattern.lastIndex = index
  return pattern.test(source)
}

/**
 * `source` with each `//` line comment blanked, offsets kept, so a directive mentioned in a Sass or
 * Less comment (`// old: @safelist fg:blue;`) is not read. Strings, block comments, escapes and
 * unquoted `url(...)` stay as written.
 */
function blankLineComments(source: string) {
  let output = ''
  let index = 0
  while (index < source.length) {
    const char = source[index]
    let end = index + 1
    if (char === '\\') {
      end = index + 2
    } else if (char === '"' || char === '\'') {
      end = index + 1
      while (end < source.length && source[end] !== char && source[end] !== '\n') {
        end += source[end] === '\\' ? 2 : 1
      }
      end++
    } else if (source.startsWith('/*', index)) {
      const close = source.indexOf('*/', index + 2)
      end = close === -1 ? source.length : close + 2
    } else if (matchesAt(UNQUOTED_URL_START_RE, source, index)) {
      const close = source.indexOf(')', index)
      end = close === -1 ? source.length : close + 1
    } else if (source.startsWith('//', index)) {
      const lineEnd = source.indexOf('\n', index)
      end = lineEnd === -1 ? source.length : lineEnd
      output += ' '.repeat(end - index)
      index = end
      continue
    }
    output += source.slice(index, end)
    index = end
  }
  return output
}

function isCSSDirectiveError(error: unknown): error is CSSDirectiveError {
  return error instanceof CSSDirectiveError
    || (
      !!error
      && typeof error === 'object'
      && (error as { name?: unknown }).name === 'CSSDirectiveError'
      && typeof (error as { code?: unknown }).code === 'string'
    )
}

function getInitializationSettings(initializationOptions: unknown): Settings | undefined {
  if (!initializationOptions || typeof initializationOptions !== 'object') return
  const options = initializationOptions as { stetCSS?: Settings } & Settings
  return options.stetCSS ?? options
}

function isWindowsFilePath(fsPath: string) {
  return /^[a-z]:[\\/]/i.test(fsPath) || fsPath.startsWith('\\\\') || fsPath.startsWith('//')
}

function getFilePathTools(...fsPaths: string[]) {
  return fsPaths.some(isWindowsFilePath) ? path.win32 : path
}

function toComparableFilePath(uri: string) {
  const parsedURI = URI.parse(uri)
  if (parsedURI.scheme !== 'file') return
  const fsPath = parsedURI.fsPath
  if (!fsPath) return
  const filePathTools = getFilePathTools(fsPath)
  const resolvedPath = filePathTools.resolve(fsPath)
  return isWindowsFilePath(resolvedPath) ? resolvedPath.toLowerCase() : resolvedPath
}

function containsFilePath(parentPath: string, childPath: string) {
  const filePathTools = getFilePathTools(parentPath, childPath)
  const relativePath = filePathTools.relative(parentPath, childPath)
  return relativePath === ''
    || (
      !!relativePath
      && relativePath !== '..'
      && !relativePath.startsWith(`..${filePathTools.sep}`)
      && !filePathTools.isAbsolute(relativePath)
    )
}

export default class CSSLanguageServer {
  workspaceFolders: WorkspaceFolder[] = []
  workspaces = new Map<string, Workspace>()
  globalWorkspace: Workspace = {
    uri: '',
    openedTextDocuments: [],
    languageServiceSettings: this.settings as Settings,
    languageRuntime: bundledLanguageRuntime,
    languageRuntimeSource: 'bundled'
  }
  documents: TextDocuments<TextDocument>
  initializing?: Promise<void>
  /** Settles once every workspace reload that a watched file change queued has finished. */
  reloading?: Promise<void>
  clientCapabilities: ClientCapabilities = {}
  settings?: Settings
  console: RemoteConsole
  private disposables: Disposable[] = []
  private stopped = false
  /**
   * Watches each loaded workspace's manifest files (entries, every file they import, including
   * package CSS in node_modules, and the workspace preset's default manifest), so a change made
   * outside the editor reloads the workspace without a save or restart.
   */
  private fileWatcher = new FileWatcher((uri, files) => this.reloadWorkspace(uri, files))

  constructor(
    public connection: Connection = process.argv.includes('--stdio')
      ? createConnection(process.stdin, process.stdout)
      : createConnection(),
    public customSettings?: Settings
  ) {
    this.documents = new TextDocuments(TextDocument)
    this.settings = defu(this.customSettings, settings) as Settings
    this.globalWorkspace.languageServiceSettings = this.settings as Settings
    this.console = new Proxy(this.connection.console, {
      get: (target, prop: keyof RemoteConsole) => {
        if (!this.settings?.verbose) return () => { }
        return this.connection.console[prop]
      }
    })
  }

  start() {
    this.disposables.push(
      this.documents.onDidSave(this.onDidSave.bind(this)),
      this.documents.onDidOpen(this.onDidOpen.bind(this)),
      this.documents.onDidChangeContent(this.onDidChangeContent.bind(this)),
      this.documents.onDidClose(this.onDidClose.bind(this)),
      this.documents.listen(this.connection),
      this.connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this)),
      this.connection.onHover(this.onHover.bind(this)),
      this.connection.onCompletion(this.onCompletion.bind(this)),
      this.connection.onDocumentColor(this.onDocumentColor.bind(this)),
      this.connection.onColorPresentation(this.onColorPresentation.bind(this)),
      this.connection.onDocumentFormatting(this.onDocumentFormatting.bind(this)),
      this.connection.onDocumentRangeFormatting(this.onDocumentRangeFormatting.bind(this)),
      this.connection.languages.semanticTokens.on(this.onSemanticTokens.bind(this)),
      this.connection.onRequest(DOCUMENT_SEMANTIC_TOKENS_REQUEST, this.onDocumentSemanticTokens.bind(this)),
      this.connection.onRequest(ACTIVE_SEMANTIC_TOKENS_REQUEST, this.onActiveSemanticTokens.bind(this)),
      this.connection.onInitialize(this.onInitialize.bind(this)),
      this.connection.onInitialized(() => this.init())
    )
    this.connection.listen()
  }

  init() {
    if (this.initializing) return this.initializing
    return this.initializing = new Promise(async (resolve) => {
      await Promise.all(this.workspaceFolders.map((folder) => this.initWorkspaceFolder(folder.uri)))
      resolve()
    })
  }

  onInitialize(params: InitializeParams): InitializeResult {
    this.clientCapabilities = params.capabilities
    const initializationSettings = getInitializationSettings(params.initializationOptions)
    if (initializationSettings) {
      this.customSettings = defu(initializationSettings, this.customSettings) as Settings
      this.settings = defu(this.customSettings, settings) as Settings
      this.globalWorkspace.languageServiceSettings = this.settings as Settings
    }
    if (params.workspaceFolders?.length) {
      this.workspaceFolders = params.workspaceFolders
    }
    const capabilities = {
      ...SERVER_CAPABILITIES
    }
    if (this.settings?.embeddedSyntaxHighlighting !== 'always') {
      delete capabilities.semanticTokensProvider
    }
    if (!this.settings?.formatDirectives) {
      delete capabilities.documentFormattingProvider
      delete capabilities.documentRangeFormattingProvider
    }
    return {
      capabilities
    }
  }

  async onHover(params: HoverParams): Promise<Hover | undefined> {
    await this.init()
    const workspace = this.findClosestWorkspace(params.textDocument.uri)
    if (workspace?.languageService) {
      const document = this.documents.get(params.textDocument.uri)
      if (document) return workspace.languageService.inspectSyntax(document, params.position)
    }
  }

  async onCompletion(params: CompletionParams): Promise<CompletionItem[] | undefined> {
    await this.init()
    const workspace = this.findClosestWorkspace(params.textDocument.uri)
    if (workspace?.languageService) {
      const document = this.documents.get(params.textDocument.uri)
      if (document) return workspace.languageService.suggestSyntax(document, params.position, params.context)
    }
  }

  async onDocumentColor(params: DocumentColorParams): Promise<ColorInformation[]> {
    await this.init()
    const workspace = this.findClosestWorkspace(params.textDocument.uri)
    if (workspace?.languageService) {
      const document = this.documents.get(params.textDocument.uri)
      if (document) return (await workspace.languageService.renderSyntaxColors(document)) ?? []
    }
    return []
  }

  async onColorPresentation(params: ColorPresentationParams): Promise<ColorPresentation[]> {
    await this.init()
    const workspace = this.findClosestWorkspace(params.textDocument.uri)
    if (workspace?.languageService) {
      const document = this.documents.get(params.textDocument.uri)
      if (document) return workspace.languageService.editSyntaxColors(document, params.color, params.range) ?? []
    }
    return []
  }

  private getWorkspaceDocument(uri: string) {
    const workspace = this.findClosestWorkspace(uri)
    if (!workspace?.languageService) return
    const document = this.documents.get(uri)
      ?? workspace.openedTextDocuments.find((document) => document.uri === uri)
    if (!document) return
    return {
      workspace,
      document
    }
  }

  async onDocumentFormatting(params: DocumentFormattingParams): Promise<TextEdit[]> {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    return context?.workspace.languageService?.formatDirectives(context.document) ?? []
  }

  async onDocumentRangeFormatting(params: DocumentRangeFormattingParams): Promise<TextEdit[]> {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    return context?.workspace.languageService?.formatDirectives(context.document, params.range) ?? []
  }

  async onSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens> {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    if (context) return context.workspace.languageService?.renderSemanticTokens(context.document) ?? { data: [] }
    return { data: [] }
  }

  async onDocumentSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens> {
    return this.onSemanticTokens(params)
  }

  async onActiveSemanticTokens(params: TextDocumentPositionParams): Promise<SemanticTokens> {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    if (context) return context.workspace.languageService?.renderSemanticTokensAtPosition(context.document, params.position) ?? { data: [] }
    return { data: [] }
  }

  async onDidOpen(params: TextDocumentChangeEvent<TextDocument>) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.document.uri)
    if (!workspace) return
    if (workspace.openedTextDocuments.includes(params.document)) {
      this.publishDiagnostics(params.document, workspace)
      return
    }
    if (!workspace.openedTextDocuments.length) {
      await this.initWorkspaceLanguageService(workspace)
    }
    workspace.openedTextDocuments.push(params.document)
    this.publishDiagnostics(params.document, workspace)
  }

  async onDidChangeContent(params: TextDocumentChangeEvent<TextDocument>) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.document.uri)
    if (!workspace) return
    this.publishDiagnostics(params.document, workspace)
  }

  async onDidClose(params: TextDocumentChangeEvent<TextDocument>) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.document.uri)
    if (!workspace) return
    workspace.openedTextDocuments.splice(workspace.openedTextDocuments.indexOf(params.document), 1)
    this.connection.sendDiagnostics({ uri: params.document.uri, diagnostics: [] })
    if (!workspace.openedTextDocuments.length) {
      this.destroyLanguageService(workspace)
    }
  }

  async onDidSave(params: TextDocumentChangeEvent<TextDocument>) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.document.uri)
    if (!workspace) return
    this.publishDiagnostics(params.document, workspace)
    const name = path.basename(URI.parse(params.document.uri).fsPath)
    if (name.endsWith('.css')) {
      this.refreshSemanticTokens()
      this.connection.sendRequest('stetCSS/restart', {
        title: 'Updating StetCSS configuration',
      })
    }
  }

  async onDidChangeConfiguration({ settings: changedSettings }: DidChangeConfigurationParams) {
    await this.init()
    if (changedSettings?.stetCSS) {
      this.connection.sendNotification('stetCSS/globalSettingsChanged', changedSettings.stetCSS)
      this.customSettings = changedSettings.stetCSS
      this.settings = defu(this.customSettings, settings) as Settings
      this.globalWorkspace.languageServiceSettings = this.settings as Settings
      this.refreshSemanticTokens()
      this.connection.sendRequest('stetCSS/restart', {
        title: 'Updating StetCSS settings',
      })
      for (const workspace of [this.globalWorkspace, ...this.workspaces.values()]) {
        for (const document of workspace.openedTextDocuments) {
          this.publishDiagnostics(document, workspace)
        }
      }
    }
  }

  private async initWorkspaceFolder(workspaceFolderURI: string) {
    const workspaceFolderCWD = URI.parse(workspaceFolderURI).fsPath
    let customWorkspaceFolderSettings: Settings | undefined
    if (this.clientCapabilities.workspace?.configuration) {
      customWorkspaceFolderSettings = await this.connection.workspace.getConfiguration({
        scopeUri: workspaceFolderURI,
        section: 'stetCSS'
      }) as Settings
    }
    const { workspaces, ...languageServiceSettings } = defu(customWorkspaceFolderSettings, this.customSettings, settings) as Settings
    const resolvedWorkspaceDirectories = new Set<string>([workspaceFolderCWD])
    if (workspaceFolderCWD) {
      this.console.info(`Registered workspace folder ${workspaceFolderURI}`)
    } else {
      this.console.info(`Registered global workspace folder`)
    }
    if (workspaces === 'auto') {
      for (const workspaceDir of await findStetCSSWorkspaceDirectories(workspaceFolderCWD)) {
        resolvedWorkspaceDirectories.add(workspaceDir)
      }
    } else if (workspaces?.length) {
      (await glob(workspaces, {
        cwd: workspaceFolderCWD,
        absolute: true,
        onlyDirectories: true,
        ignore: ['**/node_modules/**']
      }))
        .forEach((workspaceDir) => resolvedWorkspaceDirectories.add(path.resolve(workspaceDir)))
    }
    for (const workspaceDir of resolvedWorkspaceDirectories) {
      const workspaceURI = URI.file(workspaceDir).toString()
      this.console.info(`Added workspace ${workspaceURI}`)
      this.workspaces.set(workspaceURI, {
        uri: workspaceURI,
        openedTextDocuments: [],
        languageServiceSettings,
        planEntries: await findCSSManifestEntryFiles(workspaceDir)
      })
    }
  }

  async initWorkspaceLanguageService(workspace: Workspace) {
    // Every file the workspace's manifest is read from, stamped before it is read.
    const manifestFiles = new Map<string, FileStamp | undefined>()
    const addManifestFile = (file: string) => {
      if (!manifestFiles.has(file)) manifestFiles.set(file, readFileStamp(file))
    }
    workspace.languageRuntime = await this.loadWorkspaceLanguageRuntime(workspace, addManifestFile)
    const languageRuntime = workspace.languageRuntime
    const createLanguageService = (manifest?: StetCSSManifest) => new CSSLanguageService(
      { ...workspace.languageServiceSettings, manifest },
      { runtime: languageRuntime }
    )
    const reportManifestError = (error: any) => {
      workspace.manifestErrors = [error]
      this.console.info(`Failed to load manifest from ${workspace.uri}`)
      this.console.error(error instanceof Error ? error.stack : error.toString())
    }
    let workspacePlan: StetCSSManifest | undefined
    workspace.manifestErrors = []
    const stetCSSGraphFiles = new Set<string>()
    workspace.stetCSSGraphFiles = stetCSSGraphFiles
    if (workspace !== this.globalWorkspace) {
      try {
        workspacePlan = await this.loadWorkspacePlan(workspace, (file) => {
          stetCSSGraphFiles.add(path.resolve(file))
          addManifestFile(file)
        })
      } catch (e: any) {
        reportManifestError(e)
      }
    }
    this.fileWatcher.watch(workspace.uri, manifestFiles)
    if (workspacePlan) {
      try {
        workspace.languageService = createLanguageService(workspacePlan)
        this.console.info(`Initialized workspace ${workspace.planEntries?.length ? '(with manifest entry)' : '(with manifest)'} ${workspace.uri}`)
        return
      } catch (manifestError) {
        // The engine validates a manifest when the service compiles it: a `manifest` setting with
        // the removed `settings.baseUnit`, or `version: 2`, throws here. It is the manifest's fault
        // only if the default manifest still builds; otherwise the runtime is broken and the
        // original error propagates as before.
        let fallback: CSSLanguageService
        try {
          fallback = createLanguageService()
        } catch {
          throw manifestError
        }
        reportManifestError(manifestError)
        workspace.languageService = fallback
        return
      }
    }
    if (workspace !== this.globalWorkspace) {
      this.console.info(`Initialized workspace ${workspace.uri}`)
    }
    workspace.languageService = createLanguageService()
  }

  /**
   * Loads the workspace's manifest, passing `addManifestFile` each entry and every stylesheet the
   * load reaches, before reading it. A load that fails still names the files it reached, the
   * missing import included, so the change that fixes it reloads the workspace.
   */
  private async loadWorkspacePlan(workspace: Workspace, addManifestFile: (file: string) => void) {
    const cwd = workspace.uri ? URI.parse(workspace.uri).fsPath : process.cwd()
    const entries = await findCSSManifestEntryFiles(cwd)
    workspace.planEntries = entries
    entries.forEach(addManifestFile)
    const result = await loadProjectManifest(cwd, {
      entries,
      baseManifest: (workspace.languageRuntime ?? defaultCSSLanguageRuntime).defaultManifest,
      onDependency: addManifestFile
    })
    return result.entries.length ? result.manifest : workspace.languageServiceSettings.manifest
  }

  /**
   * Rebuilds a workspace's language service after its watched files changed outside the editor,
   * then republishes its documents' diagnostics. Reloads run one at a time, in the order queued.
   */
  private reloadWorkspace(uri: string, files: string[]) {
    this.reloading = (this.reloading ?? Promise.resolve()).then(async () => {
      if (this.stopped) return
      const workspace = this.workspaces.get(uri)
      if (!workspace?.languageService || !workspace.openedTextDocuments.length) {
        this.fileWatcher.unwatch(uri)
        return
      }
      this.console.info(`Reloading workspace ${uri} after changes to ${files.join(', ')}`)
      await this.initWorkspaceLanguageService(workspace)
      if (this.stopped) return
      if (!workspace.openedTextDocuments.length) {
        this.destroyLanguageService(workspace)
        return
      }
      for (const document of workspace.openedTextDocuments) {
        this.publishDiagnostics(document, workspace)
      }
      this.refreshSemanticTokens()
    }).catch((error) => {
      this.console.error(error instanceof Error ? error.stack || error.message : String(error))
    })
  }

  private async loadWorkspaceLanguageRuntime(workspace: Workspace, addManifestFile: (file: string) => void): Promise<CSSLanguageRuntime> {
    if (workspace === this.globalWorkspace || !workspace.uri) {
      workspace.languageRuntimeSource = 'bundled'
      return bundledLanguageRuntime
    }

    const cwd = URI.parse(workspace.uri).fsPath
    let resolution: StetCSSWorkspacePackageResolution | undefined
    try {
      resolution = resolveStetCSSWorkspacePackages(cwd)
      workspace.languageRuntimeResolution = resolution
      if (resolution.presetManifest) addManifestFile(resolution.presetManifest.entry)
      const missingPackages = [
        !resolution.css && '@stet-css/core',
        !resolution.engine && '@stet-css/engine',
        !resolution.presetManifest && '@stet-css/preset/default-manifest.json'
      ].filter(Boolean)
      if (missingPackages.length) {
        throw new Error(`Missing workspace package(s): ${missingPackages.join(', ')}`)
      }
      const cssPackage = resolution.css
      const enginePackage = resolution.engine
      const presetManifestPackage = resolution.presetManifest
      if (!cssPackage || !enginePackage || !presetManifestPackage) {
        throw new Error('Missing required workspace StetCSS runtime packages.')
      }

      const [cssModule, engineModule, utilityTypeModule] = await Promise.all([
        this.importWorkspaceModule(cssPackage.entry),
        this.importWorkspaceModule(enginePackage.entry),
        resolution.utilityType ? this.importWorkspaceModule(resolution.utilityType.entry) : undefined
      ])
      const StetCSS = (cssModule.StetCSS || cssModule.default) as CSSLanguageRuntime['StetCSS'] | undefined
      const builtinKeyAliases = engineModule.builtinKeyAliases as CSSLanguageRuntime['builtinKeyAliases'] | undefined
      const builtinNativeValueNamespaces = engineModule.builtinNativeValueNamespaces as CSSLanguageRuntime['builtinNativeValueNamespaces'] | undefined
      if (!StetCSS) throw new Error(`Missing StetCSS export from ${cssPackage.entry}`)
      if (!builtinKeyAliases) throw new Error(`Missing builtinKeyAliases export from ${enginePackage.entry}`)
      if (!builtinNativeValueNamespaces) throw new Error(`Missing builtinNativeValueNamespaces export from ${enginePackage.entry}`)

      const manifest = JSON.parse(await readFile(presetManifestPackage.entry, 'utf8')) as StetCSSManifest
      workspace.languageRuntimeSource = 'workspace'
      this.console.info(`Using workspace StetCSS runtime ${cssPackage.version ?? '(unknown version)'} from ${cssPackage.directory}`)
      if (resolution.errors.length) {
        this.console.info(`Workspace StetCSS runtime optional resolution warnings: ${resolution.errors.map(({ name, message }) => `${name}: ${message}`).join('; ')}`)
      }
      return {
        StetCSS,
        UtilityType: (utilityTypeModule?.UtilityType || utilityTypeModule?.default || defaultCSSLanguageRuntime.UtilityType) as CSSLanguageRuntime['UtilityType'],
        defaultManifest: manifest,
        builtinKeyAliases,
        builtinNativeValueNamespaces,
        ...buildValidity
      }
    } catch (error) {
      workspace.languageRuntimeSource = 'bundled'
      this.console.info(`Using bundled StetCSS runtime for ${workspace.uri}`)
      if (resolution?.errors.length) {
        this.console.info(`Workspace StetCSS package resolution errors: ${resolution.errors.map(({ name, message }) => `${name}: ${message}`).join('; ')}`)
      }
      this.console.error(error instanceof Error ? error.stack || error.message : String(error))
      return bundledLanguageRuntime
    }
  }

  private async importWorkspaceModule(path: string) {
    return await import(pathToFileURL(path).href) as Record<string, unknown>
  }

  destroyLanguageService(workspace: Workspace) {
    this.console.info(`Destroyed workspace ${workspace.uri}`)
    delete workspace.languageService
    this.fileWatcher.unwatch(workspace.uri)
  }

  findClosestWorkspace(textDocumentURI: string) {
    const documentPath = toComparableFilePath(textDocumentURI)
    if (!documentPath) {
      this.console.info(`This is an external document ${textDocumentURI} with the global workspace`)
      return this.globalWorkspace
    }
    let foundWorkspace: Workspace | undefined
    let foundWorkspacePath = ''
    for (const [uri, workspace] of this.workspaces) {
      if (!uri) continue
      const workspacePath = toComparableFilePath(uri)
      if (!workspacePath) continue
      if (containsFilePath(workspacePath, documentPath) && workspacePath.length > foundWorkspacePath.length) {
        foundWorkspace = workspace
        foundWorkspacePath = workspacePath
      }
    }
    if (foundWorkspace) return foundWorkspace
    this.console.info(`This is an external document ${textDocumentURI} with the global workspace`)
    return this.globalWorkspace
  }

  private publishDiagnostics(textDocument: TextDocument, workspace: Workspace) {
    const diagnostics: Diagnostic[] = []
    diagnostics.push(...this.createManifestLoadingDiagnostics(textDocument, workspace))
    diagnostics.push(...this.createCSSDirectiveDiagnostics(textDocument, workspace))

    this.connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics
    })
  }

  /**
   * Unquoted `@source`, `@safelist` and `@blocklist` arguments are reported only where the build
   * rejects them: in a stylesheet that imports `@stet-css/core` or that the workspace's entries
   * import. Any other stylesheet, such as a Tailwind entry with `@source inline(...)`, is handed
   * back to its own tooling, and Sass or Less `//` comments are not read.
   */
  private createCSSDirectiveDiagnostics(textDocument: TextDocument, workspace: Workspace) {
    if (!isCSSDiagnosticDocument(textDocument)) return []
    const diagnostics: Diagnostic[] = []
    const documentFile = path.resolve(URI.parse(textDocument.uri).fsPath)
    const report = (error: unknown, offset: number) => {
      if (!isCSSDirectiveError(error)) return
      const diagnostic = this.createCSSDirectiveDiagnostic(error, textDocument, documentFile, offset)
      if (diagnostic) diagnostics.push(diagnostic)
    }
    for (const { source, offset } of getCSSDiagnosticSources(textDocument)) {
      try {
        compileCSSManifest(source, {
          from: documentFile,
          baseManifest: (workspace.languageRuntime ?? defaultCSSLanguageRuntime).defaultManifest,
          checkDirectiveArguments: false
        })
      } catch (error) {
        report(error, offset)
      }
      if (!workspace.stetCSSGraphFiles?.has(documentFile) && !hasStetCSSManifestEntrypoint(source)) continue
      try {
        assertQuotedCSSDirectiveArguments(
          LINE_COMMENT_LANGUAGE_IDS.has(textDocument.languageId) ? blankLineComments(source) : source,
          documentFile,
          true
        )
      } catch (error) {
        report(error, offset)
      }
    }
    return diagnostics
  }

  private createManifestLoadingDiagnostics(textDocument: TextDocument, workspace: Workspace): Diagnostic[] {
    if (!workspace.manifestErrors?.length) return []
    const documentFile = path.resolve(URI.parse(textDocument.uri).fsPath)
    return workspace.manifestErrors.map((error) => {
      const directiveError = isCSSDirectiveError(error) ? error : undefined
      const source = directiveError?.source
      return {
        range: source && (!source.file || path.resolve(source.file) === documentFile)
          ? this.createCSSDirectiveRange(source, textDocument, documentFile, 0)
          : {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          },
        severity: DiagnosticSeverity.Error,
        code: 'manifest-loading-error',
        source: 'StetCSS',
        message: `Failed to load StetCSS manifest: ${error instanceof Error ? error.message : String(error)}`,
        relatedInformation: directiveError
          ? this.createCSSDirectiveRelatedInformation(directiveError.related, textDocument, documentFile, 0)
          : undefined
      }
    })
  }

  private createCSSDirectiveDiagnostic(
    error: CSSDirectiveError,
    textDocument: TextDocument,
    documentFile: string,
    sourceOffset: number
  ): Diagnostic | undefined {
    if (error.source?.file && path.resolve(error.source.file) !== documentFile) return
    return {
      range: this.createCSSDirectiveRange(error.source, textDocument, documentFile, sourceOffset),
      severity: DiagnosticSeverity.Error,
      code: error.code,
      source: 'StetCSS',
      message: error.message,
      relatedInformation: this.createCSSDirectiveRelatedInformation(error.related, textDocument, documentFile, sourceOffset)
    }
  }

  private createCSSDirectiveRelatedInformation(
    related: CSSDirectiveError['related'],
    textDocument: TextDocument,
    documentFile: string,
    sourceOffset: number
  ): DiagnosticRelatedInformation[] | undefined {
    if (!related?.length) return
    return related.map(({ message, source }) => ({
      message,
      location: {
        uri: source?.file ? URI.file(source.file).toString() : textDocument.uri,
        range: this.createCSSDirectiveRange(source, textDocument, documentFile, sourceOffset)
      }
    }))
  }

  private createCSSDirectiveRange(
    source: CSSDirectiveSourceReference | undefined,
    textDocument: TextDocument,
    documentFile: string,
    sourceOffset: number
  ): Range {
    if (source?.file && path.resolve(source.file) !== documentFile) {
      return source.loc
        ? {
          start: {
            line: Math.max(0, source.loc.start.line - 1),
            character: Math.max(0, source.loc.start.column - 1)
          },
          end: {
            line: Math.max(0, source.loc.end.line - 1),
            character: Math.max(0, source.loc.end.column - 1)
          }
        }
        : {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 }
        }
    }

    const start = Math.max(0, (source?.range.start || 0) + sourceOffset)
    const end = Math.max(start, (source?.range.end || 0) + sourceOffset)
    return {
      start: textDocument.positionAt(start),
      end: textDocument.positionAt(end)
    }
  }

  private refreshSemanticTokens() {
    if (this.settings?.embeddedSyntaxHighlighting !== 'always') return
    if (!this.clientCapabilities.workspace?.semanticTokens?.refreshSupport) return
    this.connection.languages.semanticTokens.refresh()
  }

  stop(): void {
    this.connection.sendNotification('stetCSS/dispose')
    this.stopped = true
    this.fileWatcher.dispose()
    this.disposables.forEach((disposable) => disposable.dispose())
    this.disposables.length = 0
    this.connection.dispose()
    this.initializing = undefined
  }
}
