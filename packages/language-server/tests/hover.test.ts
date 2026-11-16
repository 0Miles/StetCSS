import { InitializeRequest, InitializedNotification, type InitializeParams } from 'vscode-languageserver/node'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URI } from 'vscode-uri'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type CSSLanguageServer from '../src'
import { connect } from './connection'
import createDocument from '../src/utils/create-document'
import { withFixture } from './setup'

async function hoverText(server: CSSLanguageServer, textDocument: TextDocument, className: string) {
  await server.onDidOpen({ document: textDocument })
  try {
    const hover = server.findClosestWorkspace(textDocument.uri)?.languageService
      ?.inspectSyntax(textDocument, textDocument.positionAt(textDocument.getText().indexOf(className) + 1))
    return hover ? (hover.contents as { value: string }).value.replace(/\s+/g, '') : undefined
  } finally {
    await server.onDidClose({ document: textDocument })
  }
}

/**
 * Guards #82: hover showed CSS the build never emits. `top:48` hovered as
 * `.top\:48{top:48}`, `font:14` as `font-size:14`, and a group showed its
 * invalid declarations, while the build drops each of them. Hover must show
 * what the build emits: nothing for an invalid class, and a group without its
 * invalid declarations. These rows run on a workspace-resolved runtime.
 *
 * Reverse check: removing `generateRules` from `buildValidity` in
 * `src/core.ts` reddens the alias and group rows here, the bundled `font:14`
 * row and the semantic token test; also restoring the property-only native
 * matcher reddens the native rows. Valid rows stay green.
 */
withFixture('monorepo', async (context) => {
  const hover = (className: string) =>
    hoverText(context.server, context.createDocument(`<div class="${className}"></div>`), className)

  test('runs on the workspace runtime', async () => {
    const textDocument = context.createDocument('<div class=""></div>')
    await context.server.onDidOpen({ document: textDocument })
    expect(context.rootWorkspace?.languageRuntimeSource).toBe('workspace')
    await context.server.onDidClose({ document: textDocument })
  })

  test.each([
    'top:48', 'flex:col', 'float:banana',
    'font:14', 'size:48',
    '{top:48;flex:col}'
  ])('shows no hover for %s, which the build drops', async (className) => {
    expect(await hover(className)).toBeUndefined()
  })

  test.each([
    ['top:0', '{top:0}'],
    ['float:left', '{float:left}'],
    ['font:14px', '{font-size:14px}'],
    ['{top:48;float:left}', '{float:left}'],
    ['{mt:48;float:left}:hover', ':hover{float:left}']
  ])('shows the CSS the build emits for %s', async (className, css) => {
    expect(await hover(className)).toContain(css)
  })
})

/**
 * Guards #82 on the bundled runtime, which the server falls back to when a
 * workspace has no StetCSS packages installed: it must judge classes like the
 * build too.
 *
 * Reverse check: building `bundledLanguageRuntime` without `buildValidity` in
 * `src/core.ts` reddens the two invalid rows of this block only.
 */
describe('bundled runtime', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'stet-css-language-server-hover-'))
  const { server, clientConnection } = connect()
  const rootUri = URI.file(cwd).toString()
  const hover = (className: string) =>
    hoverText(server, createDocument(`<div class="${className}"></div>`, { dir: cwd }), className)

  beforeAll(async () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ private: true }))
    await clientConnection.sendRequest(InitializeRequest.type, {
      rootUri,
      capabilities: { workspace: { configuration: false, workspaceFolders: true } },
      workspaceFolders: [{ uri: rootUri, name: 'bundled' }]
    } as InitializeParams)
    await clientConnection.sendNotification(InitializedNotification.method, {})
    await server.init()
  })

  afterAll(() => {
    server.stop()
    clientConnection.dispose()
    rmSync(cwd, { recursive: true, force: true })
  })

  test('runs on the bundled runtime', async () => {
    const textDocument = createDocument('<div class=""></div>', { dir: cwd })
    await server.onDidOpen({ document: textDocument })
    expect(server.workspaces.get(rootUri)?.languageRuntimeSource).toBe('bundled')
    await server.onDidClose({ document: textDocument })
  })

  test.each(['top:48', 'font:14'])('shows no hover for %s, which the build drops', async (className) => {
    expect(await hover(className)).toBeUndefined()
  })

  test('shows the CSS the build emits for top:0', async () => {
    expect(await hover('top:0')).toContain('{top:0}')
  })
})
