import { ConfigurationRequest, InitializeRequest, InitializedNotification, type InitializeParams, type InitializeResult } from 'vscode-languageserver/node'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URI } from 'vscode-uri'
import { expect, test } from 'vitest'
import { connect } from './connection'

type Context = ReturnType<typeof connect> & { rootUri: string }

async function withServer(cb: (context: Context) => Promise<void>) {
  const cwd = mkdtempSync(join(tmpdir(), 'stet-css-language-server-settings-'))
  const context = connect()
  try {
    await cb({ ...context, rootUri: URI.file(cwd).toString() })
  } finally {
    context.server.stop()
    context.clientConnection.dispose()
    rmSync(cwd, { recursive: true, force: true })
  }
}

function initialize(context: Context, params: Partial<InitializeParams> = {}) {
  return context.clientConnection.sendRequest(InitializeRequest.type, {
    rootUri: context.rootUri,
    capabilities: { workspace: { configuration: false, workspaceFolders: true } },
    workspaceFolders: [{ uri: context.rootUri, name: 'settings' }],
    ...params
  } as InitializeParams) as Promise<InitializeResult>
}

async function start(context: Context, params: Partial<InitializeParams> = {}) {
  await initialize(context, params)
  await context.clientConnection.sendNotification(InitializedNotification.method, {})
  await context.server.init()
}

/**
 * Prevents: an editor client (VS Code, Neovim, Helix) passing `initializationOptions.stetCSS`
 * and the server ignoring it, so turning off `formatDirectives` still advertises formatting.
 * Reverse check: `getInitializationSettings` in `src/core.ts` returning `options` without
 * reading `options.stetCSS` turns only this test red.
 */
test('reads initialization options under the stetCSS section', async () => {
  await withServer(async (context) => {
    const result = await initialize(context, { initializationOptions: { stetCSS: { formatDirectives: false } } })

    expect(result.capabilities.documentFormattingProvider).toBeUndefined()
  })
})

/**
 * Prevents: settings left under the pre-rename `masterCSS` key still steering the server, so a
 * half-migrated config works by accident until the old key is finally dropped.
 * Reverse check: `getInitializationSettings` in `src/core.ts` preferring `options.masterCSS`
 * turns only this test red.
 */
test('ignores initialization options under the old masterCSS section', async () => {
  await withServer(async (context) => {
    const result = await initialize(context, { initializationOptions: { masterCSS: { formatDirectives: false } } })

    expect(result.capabilities.documentFormattingProvider).toBe(true)
  })
})

/**
 * Prevents: the server asking the client for the wrong `workspace/configuration` section, so
 * per-folder `stetCSS.*` settings (`workspaces`, `classAttributes`) never reach the workspace.
 * Reverse check: `section: 'stetCSS'` in `initWorkspaceFolder` (`src/core.ts`) changed to
 * `'masterCSS'` turns only this test red.
 */
test('requests workspace folder settings from the stetCSS section', async () => {
  await withServer(async (context) => {
    const sections: (string | undefined)[] = []
    context.clientConnection.onRequest(ConfigurationRequest.type, (params) => {
      sections.push(...params.items.map((item) => item.section))
      return params.items.map(() => ({}))
    })
    await start(context, { capabilities: { workspace: { configuration: true, workspaceFolders: true } } })

    expect(sections).toEqual(['stetCSS'])
  })
})

/**
 * Prevents: editing `stetCSS.*` settings not restarting the client, or the server sending the
 * restart under a method the VS Code client no longer handles, so changed settings only apply
 * after a manual restart. A `masterCSS` change must trigger nothing: it is sent first with a
 * different payload, so one restart and only the `stetCSS` payload prove it was ignored.
 * Reverse check: `changedSettings?.stetCSS` in `onDidChangeConfiguration` (`src/core.ts`)
 * changed to `changedSettings?.masterCSS`, or its restart request renamed back to
 * `masterCSS/restart`, turns only this test red.
 */
test('applies stetCSS configuration changes and asks the client to restart through stetCSS/restart', async () => {
  await withServer(async (context) => {
    const restarts: unknown[] = []
    const changedSettings: unknown[] = []
    context.clientConnection.onRequest('stetCSS/restart', (params) => { restarts.push(params) })
    context.clientConnection.onNotification('stetCSS/globalSettingsChanged', (params) => { changedSettings.push(params) })
    await start(context)

    await context.server.onDidChangeConfiguration({ settings: { masterCSS: { formatDirectives: false } } })
    await context.server.onDidChangeConfiguration({ settings: { stetCSS: { verbose: true } } })

    await expect.poll(() => restarts.length).toBe(1)
    await expect.poll(() => changedSettings).toEqual([{ verbose: true }])
  })
})
