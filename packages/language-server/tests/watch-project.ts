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
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { URI } from 'vscode-uri'
import { vi } from 'vitest'
import { connect } from './connection'

export const ENTRY_CSS = `@import '@stet-css/core';\n@import './components.css';\n`

export function components(name: string, display: string) {
  return `@components {\n  ${name} {\n    display: ${display};\n  }\n}\n`
}

export async function until(check: () => boolean | Promise<boolean>, message: string, timeout = 10_000) {
  const startedAt = Date.now()
  while (!await check()) {
    if (Date.now() - startedAt > timeout) throw new Error(`Timed out waiting for ${message}`)
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

const projects: { dispose(): void }[] = []

/** Call from `afterEach`: restores real timers and removes every project a test opened. */
export function disposeProjects() {
  vi.useRealTimers()
  projects.splice(0).forEach((project) => project.dispose())
}

/** Fakes only the watcher's clock, so a test decides when the server checks the files. */
export function controlFileChecks() {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  return () => vi.advanceTimersToNextTimer()
}

/**
 * Starts a server on a temporary project, the way an editor does over LSP, and returns helpers
 * that change the project's files from outside the editor.
 */
export async function openProject(files: Record<string, string>) {
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
    path: (file: string) => join(cwd, file),
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
