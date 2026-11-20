import {
  CompletionRequest,
  CompletionTriggerKind,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  HoverRequest,
  InitializeRequest,
  InitializedNotification,
  PublishDiagnosticsNotification,
  type CompletionItem,
  type CompletionList,
  type InitializeParams,
  type MarkupContent,
  type PublishDiagnosticsParams
} from 'vscode-languageserver/node'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { URI } from 'vscode-uri'
import { afterEach, expect, test, vi } from 'vitest'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { connect } from './connection'

const ENTRY_CSS = `@import '@stet-css/core';\n@import './components.css';\n`

function components(name: string, display: string) {
  return `@components {\n  ${name} {\n    display: ${display};\n  }\n}\n`
}

async function until(check: () => boolean | Promise<boolean>, message: string, timeout = 10_000) {
  const startedAt = Date.now()
  while (!await check()) {
    if (Date.now() - startedAt > timeout) throw new Error(`Timed out waiting for ${message}`)
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

const projects: { dispose(): void }[] = []

afterEach(() => {
  vi.useRealTimers()
  projects.splice(0).forEach((project) => project.dispose())
})

/** Fakes only the watcher's clock, so a test decides when the server checks the files. */
function controlFileChecks() {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  return () => vi.advanceTimersToNextTimer()
}

/**
 * Starts a server on a temporary project, the way an editor does over LSP, and returns helpers
 * that change the project's files from outside the editor.
 */
async function openProject(files: Record<string, string>) {
  const cwd = mkdtempSync(join(tmpdir(), 'stet-css-language-server-watch-'))
  const write = (file: string, text: string) => {
    const path = join(cwd, file)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  for (const [file, text] of Object.entries(files)) write(file, text)
  const { server, clientConnection } = connect()
  const project = {
    server,
    write,
    /** Replaces a file the way `git checkout` does: a new file at the same path. */
    replace(file: string, text: string) {
      unlinkSync(join(cwd, file))
      write(file, text)
    },
    remove(path: string) {
      rmSync(join(cwd, path), { recursive: true, force: true })
    },
    dispose() {
      server.stop()
      clientConnection.dispose()
      rmSync(cwd, { recursive: true, force: true })
    }
  }
  projects.push(project)
  const published: PublishDiagnosticsParams[] = []
  clientConnection.onNotification(PublishDiagnosticsNotification.method, (params: PublishDiagnosticsParams) => { published.push(params) })
  const rootUri = URI.file(cwd).toString()
  await clientConnection.sendRequest(InitializeRequest.type, {
    rootUri,
    capabilities: { workspace: { configuration: false, workspaceFolders: true } },
    workspaceFolders: [{ uri: rootUri, name: 'watch' }]
  } as InitializeParams)
  await clientConnection.sendNotification(InitializedNotification.method, {})
  await server.init()

  return {
    ...project,
    /** Opens an HTML document in the project and waits until the server has loaded its workspace. */
    async open(text: string) {
      const uri = URI.file(join(cwd, `document-${published.length}.html`)).toString()
      const diagnostics = () => published.filter((params) => params.uri === uri)
      await clientConnection.sendNotification(DidOpenTextDocumentNotification.type, {
        textDocument: { uri, languageId: 'html', version: 1, text }
      })
      const workspace = () => server.findClosestWorkspace(uri)
      await until(() => workspace().openedTextDocuments.some((document) => document.uri === uri), 'the document to open')
      const position = (offset: number) => {
        const lines = text.slice(0, offset).split('\n')
        return { line: lines.length - 1, character: lines.at(-1)!.length }
      }
      // A request answered after the open delivers every diagnostic the open published.
      await clientConnection.sendRequest(HoverRequest.type, { textDocument: { uri }, position: position(0) })
      return {
        workspace,
        diagnostics,
        async close() {
          await clientConnection.sendNotification(DidCloseTextDocumentNotification.type, { textDocument: { uri } })
          await until(() => diagnostics().at(-1)?.diagnostics.length === 0 && !server.findClosestWorkspace(uri).languageService, 'the document to close')
        },
        async hover(className: string) {
          const hover = await clientConnection.sendRequest(HoverRequest.type, {
            textDocument: { uri },
            position: position(text.indexOf(className) + 1)
          })
          return hover ? (hover.contents as MarkupContent).value.replace(/\s+/g, '') : undefined
        },
        async completionLabels(offset: number) {
          const result = await clientConnection.sendRequest(CompletionRequest.type, {
            textDocument: { uri },
            position: position(offset),
            context: { triggerKind: CompletionTriggerKind.Invoked }
          }) as CompletionItem[] | CompletionList | null
          const items = Array.isArray(result) ? result : result?.items ?? []
          return items.map((item) => item.label)
        }
      }
    }
  }
}

/**
 * Guards #248: the server loaded a workspace's manifest once, when its first document opened, so a
 * `git checkout` that changed an imported CSS file left completion and hover on the old components
 * until a `.css` save in the editor or a restart. The replaced file must show in both, with no
 * editor event at all.
 */
test('shows a component that a `git checkout` adds to an imported CSS file', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const text = '<div class="watch-chip"></div>'
  const document = await project.open(text)
  const completionOffset = text.indexOf('watch-') + 'watch-'.length
  expect(await document.hover('watch-chip')).toBeUndefined()
  expect(await document.completionLabels(completionOffset)).not.toContain('watch-chip')

  project.replace('components.css', components('watch-chip', 'flex'))

  await until(async () => (await document.hover('watch-chip'))?.includes('display:flex') ?? false, 'hover to show watch-chip')
  expect(await document.completionLabels(completionOffset)).toContain('watch-chip')
})

/** A package in the project's node_modules whose CSS the compiler reads through its `style` field. */
function stylePackage(name: string, version: string, css: string) {
  return {
    [`node_modules/${name}/package.json`]: JSON.stringify({ name, version, style: './index.css' }),
    [`node_modules/${name}/index.css`]: css
  }
}

/**
 * Guards #248 for a preset update: the preset's CSS lives in node_modules, outside every editor
 * event, and an install replaces its whole directory. Completion and hover must move to the new
 * preset once the install has written it.
 */
test('shows a component from a preset that an install replaced in node_modules', async () => {
  const project = await openProject({
    'index.css': `@import '@stet-css/core';\n`,
    ...stylePackage('@stet-css/core', '1.0.0', `@import '@stet-css/preset';\n`),
    ...stylePackage('@stet-css/preset', '1.0.0', components('preset-card', 'block'))
  })
  const text = '<div class="preset-chip"></div>'
  const document = await project.open(text)
  const completionOffset = text.indexOf('preset-') + 'preset-'.length
  expect(await document.completionLabels(completionOffset)).toContain('preset-card')
  expect(await document.hover('preset-chip')).toBeUndefined()

  project.remove('node_modules/@stet-css/preset')
  for (const [file, content] of Object.entries(stylePackage('@stet-css/preset', '2.0.0', components('preset-chip', 'grid')))) {
    project.write(file, content)
  }

  await until(async () => (await document.hover('preset-chip'))?.includes('display:grid') ?? false, 'hover to show preset-chip')
  expect(await document.completionLabels(completionOffset)).toContain('preset-chip')
  expect(await document.completionLabels(completionOffset)).not.toContain('preset-card')
})

/** A package that re-exports a built workspace package, so the server loads it as the project's own runtime. */
function runtimePackage(name: string, entry: string) {
  const url = pathToFileURL(entry).href
  return {
    [`node_modules/${name}/package.json`]: JSON.stringify({ name, version: '1.0.0', type: 'module', exports: { '.': './index.js' } }),
    [`node_modules/${name}/index.js`]: `export * from ${JSON.stringify(url)}\n`
  }
}

/**
 * Guards #248 for a preset update in a workspace with no CSS entry: its manifest is the installed
 * preset's `default-manifest.json`, read when the workspace loads, so a new preset version must
 * reach completion and hover the same way.
 */
test('uses the default manifest of a preset that an install updated in node_modules', async () => {
  const require = createRequire(import.meta.url)
  const coreEntry = require.resolve('@stet-css/core')
  const engineEntry = createRequire(coreEntry).resolve('@stet-css/engine')
  const defaultManifest = JSON.parse(readFileSync(require.resolve('@stet-css/preset/default-manifest.json'), 'utf8')) as StetCSSManifest
  const presetManifest = (manifest: StetCSSManifest) => ({
    'node_modules/@stet-css/preset/package.json': JSON.stringify({
      name: '@stet-css/preset',
      version: '1.0.0',
      exports: { './default-manifest.json': './default-manifest.json' }
    }),
    'node_modules/@stet-css/preset/default-manifest.json': JSON.stringify(manifest)
  })
  const project = await openProject({
    'package.json': JSON.stringify({ private: true, dependencies: { '@stet-css/core': '1.0.0' } }),
    ...runtimePackage('@stet-css/core', coreEntry),
    ...runtimePackage('@stet-css/engine', engineEntry),
    ...presetManifest(defaultManifest)
  })
  const document = await project.open('<div class="preset-block"></div>')
  expect(document.workspace().languageRuntimeSource).toBe('workspace')
  expect(await document.hover('preset-block')).toBeUndefined()

  const block = defaultManifest.utilities!.find((utility) => utility.name === 'block')!
  project.write('node_modules/@stet-css/preset/default-manifest.json', JSON.stringify({
    ...defaultManifest,
    utilities: [
      ...defaultManifest.utilities!,
      { ...block, id: '.preset-block', name: 'preset-block', matchers: [{ type: 'static', name: 'preset-block' }] }
    ]
  }))

  await until(async () => (await document.hover('preset-block'))?.includes('display:block') ?? false, 'hover to show preset-block')
})

/**
 * Guards #248: a branch switch writes many watched files, a few at a time, and reloading the
 * workspace for each check that finds a change rebuilds the manifest over and over while the
 * editor waits. The server must wait until a check finds nothing new, then reload once.
 * Catches: reporting changes at every check that finds one (`changed ||` dropped in
 * `FileWatcher.check`), which reloads three times here.
 */
test('reloads once after a branch switch that rewrites the watched files over several checks', async () => {
  const checkFiles = controlFileChecks()
  const project = await openProject({
    'index.css': `@import '@stet-css/core';\n@import './a.css';\n@import './b.css';\n@import './c.css';\n`,
    'a.css': components('watch-a', 'block'),
    'b.css': components('watch-b', 'block'),
    'c.css': components('watch-c', 'block')
  })
  const document = await project.open('<div class="watch-c2"></div>')
  const publishedBefore = document.diagnostics().length

  for (const [file, name] of [['a.css', 'watch-a2'], ['b.css', 'watch-b2'], ['c.css', 'watch-c2']]) {
    project.replace(file, components(name, 'grid'))
    checkFiles()
  }
  checkFiles()
  checkFiles()
  checkFiles()
  await project.server.reloading

  expect(await document.hover('watch-c2')).toContain('display:grid')
  expect(document.diagnostics().length - publishedBefore).toBe(1)
})

/**
 * Guards #248 for diagnostics: a branch whose imported CSS imports a file that is not there must
 * show the manifest error on open documents, and switching back must clear it, although the failed
 * load stopped before it could list the files it imports.
 * Catches: watching only what the failed load read (`keepWatched` false in
 * `initWorkspaceLanguageService`), which leaves the error up after the switch back.
 */
test('shows and then clears a manifest error that a branch switch brings and takes away', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const document = await project.open('<div class="watch-card"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []
  expect(lastDiagnostics()).toEqual([])

  project.replace('components.css', `@import './missing.css';\n`)
  await until(() => lastDiagnostics().some(({ code }) => code === 'manifest-loading-error'), 'the manifest error')

  project.replace('components.css', components('watch-card', 'flex'))
  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
  expect(await document.hover('watch-card')).toContain('display:flex')
})

/**
 * Guards #248 for a document opened while an imported file fails to compile: no earlier load
 * listed that file and the failed compile lists none, yet fixing it outside the editor must clear
 * the error.
 * Catches: a failed load that watches only the entries; before the import graph fallback in
 * `loadWorkspacePlan` existed, the error stayed up and this test alone was red.
 */
test('clears a manifest error once the imported file it points at is fixed', async () => {
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': '.watch-card {\n  @compose "block";\n}\n'
  })
  const document = await project.open('<div class="watch-card"></div>')
  const lastDiagnostics = () => document.diagnostics().at(-1)?.diagnostics ?? []
  expect(lastDiagnostics().map(({ code }) => code)).toContain('manifest-loading-error')

  project.replace('components.css', components('watch-card', 'flex'))

  await until(() => lastDiagnostics().length === 0, 'the manifest error to clear')
  expect(await document.hover('watch-card')).toContain('display:flex')
})

/**
 * Prevents the server from checking a workspace's files for the rest of the session after its
 * last document closed, when nothing it could reload is in use.
 */
test('stops checking files once no document of the workspace is open', async () => {
  controlFileChecks()
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  const document = await project.open('<div class="watch-card"></div>')
  expect(vi.getTimerCount()).toBe(1)

  await document.close()

  expect(vi.getTimerCount()).toBe(0)
})
