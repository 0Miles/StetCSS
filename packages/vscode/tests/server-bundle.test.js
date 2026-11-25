import { spawn } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { mkdir, mkdtemp, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import {
  NATIVE_PACKAGES_INSTALL_COMMAND,
  createStagedExtension,
  findMissingRuntimePackages,
  getCurrentTarget,
  getRuntimePackagesForTarget
} from '../scripts/package-target-core.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const distDir = resolve(packageDir, 'dist')
const serverPath = resolve(distDir, 'server.min.js')
const extensionPath = resolve(distDir, 'extension.min.js')
const sourceGrammarPath = './node_modules/@stet-css/language/syntaxes/stet-css.tmLanguage.json'
const stagedGrammarPath = './dist/node_modules/@stet-css/language/syntaxes/stet-css.tmLanguage.json'

function readPackageJSON(path = resolve(packageDir, 'package.json')) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function encode(message) {
  const body = Buffer.from(JSON.stringify(message))
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r\n\r\n`),
    body
  ])
}

function createLanguageServer(options = {}) {
  const child = spawn(process.execPath, [options.serverPath ?? serverPath, '--stdio'], {
    cwd: options.cwd ?? packageDir,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  let closed = false
  let disposed = false
  let nextId = 1
  let stdout = Buffer.alloc(0)
  const stderr = []
  const pending = new Map()
  const notifications = []
  const closedPromise = new Promise((resolvePromise) => {
    child.on('close', (code) => {
      closed = true
      if (!disposed) {
        rejectAll(new Error(`Language server exited with code ${code}\n${stderr.join('')}`))
      }
      resolvePromise(code)
    })
  })

  function rejectAll(error) {
    for (const request of pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    pending.clear()
  }

  function handleMessage(message) {
    if (Object.hasOwn(message, 'id') && pending.has(message.id)) {
      const request = pending.get(message.id)
      pending.delete(message.id)
      clearTimeout(request.timer)
      if (message.error) {
        request.reject(new Error(message.error.message))
      } else {
        request.resolve(message.result)
      }
      return
    }
    if (!Object.hasOwn(message, 'id') && message.method) notifications.push(message)
  }

  child.stdout.on('data', (chunk) => {
    stdout = Buffer.concat([stdout, chunk])
    while (true) {
      const headerEnd = stdout.indexOf('\r\n\r\n')
      if (headerEnd === -1) return
      const header = stdout.subarray(0, headerEnd).toString()
      const lengthMatch = header.match(/Content-Length: (\d+)/i)
      expect(lengthMatch, `Invalid LSP header: ${header}`).toBeTruthy()
      const bodyStart = headerEnd + 4
      const bodyEnd = bodyStart + Number(lengthMatch[1])
      if (stdout.length < bodyEnd) return
      const body = stdout.subarray(bodyStart, bodyEnd).toString()
      stdout = stdout.subarray(bodyEnd)
      handleMessage(JSON.parse(body))
    }
  })

  child.stderr.on('data', (chunk) => {
    stderr.push(chunk.toString())
  })

  child.on('error', (error) => {
    if (!disposed) rejectAll(error)
  })

  function write(message) {
    child.stdin.write(encode(message))
  }

  return {
    request(method, params) {
      const id = nextId++
      write({
        jsonrpc: '2.0',
        id,
        method,
        params
      })
      return new Promise((resolvePromise, rejectPromise) => {
        const timer = setTimeout(() => {
          pending.delete(id)
          rejectPromise(new Error(`Timed out waiting for ${method}\n${stderr.join('')}`))
        }, 5000)
        pending.set(id, {
          resolve: resolvePromise,
          reject: rejectPromise,
          timer
        })
      })
    },
    notify(method, params) {
      write({
        jsonrpc: '2.0',
        method,
        params
      })
    },
    stderr() {
      return stderr.join('')
    },
    /** The params of every `method` notification the server has sent so far, in order. */
    notifications(method) {
      return notifications.filter((message) => message.method === method).map((message) => message.params)
    },
    closed: () => closedPromise,
    async dispose() {
      disposed = true
      if (!child.stdin.destroyed && !child.stdin.writableEnded) {
        child.stdin.end()
      }
      if (!closed) {
        child.kill()
      }
      await closedPromise
    }
  }
}

async function withStagedExtension(callback, options = {}) {
  const stagingRoot = await mkdtemp(join(tmpdir(), 'stet-css-vscode-test-'))
  try {
    const target = options.target ?? getCurrentTarget()
    return await callback(
      await createStagedExtension(target, { stagingRoot, publisher: options.publisher }),
      { getCurrentTarget, getRuntimePackagesForTarget }
    )
  } finally {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  }
}

function expectStagedRuntimePackages({ stagingDir, files }, runtimePackages) {
  for (const runtimePackage of runtimePackages) {
    const packagePath = join(stagingDir, 'dist', 'node_modules', ...runtimePackage.split('/'))
    expect(statSync(packagePath).isDirectory(), runtimePackage).toBe(true)
    expect(files).toContain(`dist/node_modules/${runtimePackage}/**`)
  }
}

test('build emits the server bundle', () => {
  expect(statSync(serverPath).isFile()).toBe(true)
})

test('extension bundle keeps vscode external without default import interop', () => {
  const source = readFileSync(extensionPath, 'utf8')

  expect(statSync(extensionPath).isFile()).toBe(true)
  expect(source).toMatch(/\bfrom\s*["']vscode["']/)
  expect(source).not.toMatch(/import\s+[A-Za-z_$][\w$]*\s*,\s*\{[^}]*\}\s*from\s*["']vscode["']/)
  expect(source).not.toMatch(/import\s+[A-Za-z_$][\w$]*\s*from\s*["']vscode["']/)
})

test('extension bundle includes workspace language server resolution fallback', () => {
  const source = readFileSync(extensionPath, 'utf8')

  expect(source).toContain('@stet-css/language-server/server')
  expect(source).toContain('Using workspace language server')
  expect(source).toContain('Using bundled language server')
})

test('extension bundle reuses one StetCSS output channel for the language client', () => {
  const source = readFileSync(extensionPath, 'utf8')
  const outputChannelCalls = source.match(/\.createOutputChannel\((?:`StetCSS`|"StetCSS"|'StetCSS')/g) ?? []
  const languageClientConstruction = source.match(
    /new\s+[A-Za-z_$][\w$]*\.LanguageClient\(\s*(?:`stetCSS`|"stetCSS"|'stetCSS')\s*,\s*(?:`StetCSS`|"StetCSS"|'StetCSS')[\s\S]*?\}\)/
  )?.[0]

  expect(outputChannelCalls).toHaveLength(1)
  expect(languageClientConstruction).toContain('outputChannel:')
})

/**
 * Prevents: the extension reading, contributing or registering a different namespace than the
 * one its README and the language server use, so `stetCSS.*` settings in settings.json are
 * shown as unknown and never reach the server, or the restart command and server-initiated
 * restart go unanswered.
 * Gate 2 trade-off: the contributed keys are generated into package.json, so the check is on
 * the shared prefix of every key, not on any literal key list.
 * Reverse check: `getConfiguration('stetCSS')` in `src/extension.min.ts` changed to
 * `'masterCSS'` turns only this test red.
 */
test('extension bundle reads settings and registers commands under the stetCSS names', () => {
  const source = readFileSync(extensionPath, 'utf8')
  const packageJSON = readPackageJSON()

  expect(source).toMatch(/\.getConfiguration\([`'"]stetCSS[`'"]\)/)
  expect(source).toMatch(/registerCommand\([`'"]stetCSS\.restart[`'"]/)
  expect(source).toMatch(/onRequest\([`'"]stetCSS\/restart[`'"]/)
  expect(source).toMatch(/initializationOptions:\s*\(\)\s*=>\s*\(\{\s*stetCSS:/)
  expect(source).not.toContain('masterCSS')
  expect(packageJSON.contributes.commands.every(({ command }) => command.startsWith('stetCSS.'))).toBe(true)
  expect(Object.keys(packageJSON.contributes.configuration.properties).every((key) => key.startsWith('stetCSS.'))).toBe(true)
})

test('server bundle keeps expected native runtime imports external', () => {
  const source = readFileSync(serverPath, 'utf8')
  const imports = [...source.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((match) => match[1])
  const nativeRuntimeImports = imports.filter((specifier) =>
    /^(?:lightningcss(?:-.+)?|oxc-(?:parser|resolver|transform)|@oxc-(?:parser|resolver|transform)\/)/.test(specifier)
  )

  expect(nativeRuntimeImports.sort()).toEqual(['lightningcss', 'oxc-parser'])
})

test('staged extension includes runtime packages for the current target', async () => {
  await withStagedExtension(({ stagingDir, files }, { getCurrentTarget, getRuntimePackagesForTarget }) => {
    expectStagedRuntimePackages({ stagingDir, files }, getRuntimePackagesForTarget(getCurrentTarget()))
  })
})

test('staged extension includes runtime packages for win32-x64', async ({ skip }) => {
  const missingPackages = findMissingRuntimePackages('win32-x64')
  skip(
    missingPackages.length > 0,
    `win32-x64 native packages are not installed (${missingPackages.join(', ')}); `
    + `install them with: ${NATIVE_PACKAGES_INSTALL_COMMAND}`
  )
  await withStagedExtension(({ stagingDir, files }, { getRuntimePackagesForTarget }) => {
    expectStagedRuntimePackages({ stagingDir, files }, getRuntimePackagesForTarget('win32-x64'))
  }, { target: 'win32-x64' })
})

test('staged extension preserves the Marketplace publisher by default', async () => {
  await withStagedExtension(({ stagingDir }) => {
    expect(readPackageJSON().publisher).toBe('stet-css')
    expect(readPackageJSON(join(stagingDir, 'package.json')).publisher).toBe('stet-css')
  })
})

test('staged extension supports an Open VSX publisher override', async () => {
  await withStagedExtension(({ stagingDir }) => {
    expect(readPackageJSON().publisher).toBe('stet-css')
    expect(readPackageJSON(join(stagingDir, 'package.json')).publisher).toBe('stet')
  }, { publisher: 'stet' })
})

test('staged extension rejects unsupported targets', async () => {
  await expect(createStagedExtension('unsupported-target', { stagingRoot: tmpdir() }))
    .rejects
    .toThrow('Unsupported VS Code target "unsupported-target"')
})

test('manifest contributes TextMate grammar, semantic token scopes, and CSS diagnostic defaults', () => {
  const packageJSON = readPackageJSON()

  expect(packageJSON.contributes.languages).toBeUndefined()
  expect(packageJSON.contributes.css).toBeUndefined()
  expect(packageJSON.contributes.grammars).toEqual([
    {
      scopeName: 'stet-css.directive.injection',
      path: sourceGrammarPath,
      injectTo: [
        'source.css',
        'source.css.scss',
        'source.css.less',
        'source.css.postcss'
      ]
    }
  ])
  expect(packageJSON.contributes.configurationDefaults).toEqual({
    'css.lint.unknownAtRules': 'ignore',
    'scss.lint.unknownAtRules': 'ignore',
    'less.lint.unknownAtRules': 'ignore'
  })
  expect(packageJSON.contributes.semanticTokenScopes).toEqual([
    {
      scopes: expect.objectContaining({
        class: expect.arrayContaining(['entity.other.attribute-name.class.css']),
        'operator.declarationTerminator': expect.arrayContaining(['punctuation.terminator.rule.css']),
        'operator.declarationSeparator': expect.arrayContaining(['punctuation.separator.key-value.css']),
        'operator.selectorCombinator': expect.arrayContaining(['keyword.operator.combinator.css']),
        'operator.functionPunctuation': expect.arrayContaining(['punctuation.section.function.begin.bracket.round.css'])
      })
    }
  ])
  expect(packageJSON.contributes.semanticTokenModifiers).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'blockBrace' }),
    expect.objectContaining({ id: 'declarationSeparator' }),
    expect.objectContaining({ id: 'declarationTerminator' }),
    expect.objectContaining({ id: 'selectorCombinator' }),
    expect.objectContaining({ id: 'pseudoClassDelimiter' })
  ]))
  expect(packageJSON.contributes.configuration.properties['stetCSS.includedLanguages'].default).toEqual(expect.arrayContaining([
    'css',
    'scss',
    'less'
  ]))
  expect(packageJSON.contributes.configuration.properties['stetCSS.formatDirectives']).toMatchObject({
    type: 'boolean',
    default: true
  })
})

test('staged extension includes shared TextMate grammar asset', async () => {
  await withStagedExtension(({ stagingDir, files }) => {
    const syntaxPath = join(stagingDir, ...stagedGrammarPath.slice(2).split('/'))
    const stagedPackageJSON = readPackageJSON(join(stagingDir, 'package.json'))

    expect(statSync(syntaxPath).isFile()).toBe(true)
    expect(files).toContain(stagedGrammarPath.slice(2))
    expect(stagedPackageJSON.contributes.grammars[0].path).toBe(stagedGrammarPath)
  })
})

test('staged language server starts and shuts down', async () => {
  await withStagedExtension(async ({ stagingDir }) => {
    const server = createLanguageServer({
      cwd: stagingDir,
      serverPath: resolve(stagingDir, 'dist', 'server.min.js')
    })

    try {
      const result = await server.request('initialize', {
        processId: null,
        rootUri: null,
        capabilities: {
          workspace: {
            workspaceFolders: true
          }
        },
        workspaceFolders: []
      })

      expect(result.capabilities?.textDocumentSync).toBeTruthy()
      expect(result.capabilities?.hoverProvider).toBe(true)

      await server.request('shutdown', null)
      server.notify('exit')
      await expect(server.closed()).resolves.toBe(0)

      expect(server.stderr()).not.toContain('Cannot find module')
      expect(server.stderr()).not.toContain('Cannot find package')
    } finally {
      await server.dispose()
    }
  })
})

async function until(check, message, timeout = 10_000) {
  const startedAt = Date.now()
  while (!await check()) {
    if (Date.now() - startedAt > timeout) throw new Error(`Timed out waiting for ${message}`)
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50))
  }
}

function components(name, display) {
  return `@components {\n  ${name} {\n    display: ${display};\n  }\n}\n`
}

/**
 * Guards #248 in the extension: the language server it ships loaded a workspace's manifest only
 * when the first document opened, so a `git checkout` that changed an imported CSS file left hover
 * and completion on the old components until a `.css` save or a restart. The staged server, on a
 * project with `@stet-css/core` installed, must pick the change up on its own.
 */
test('staged language server reloads an imported CSS file changed outside the editor', async () => {
  const projectDir = await mkdtemp(join(tmpdir(), 'stet-css-vscode-watch-'))
  try {
    await mkdir(join(projectDir, 'node_modules', '@stet-css'), { recursive: true })
    await symlink(resolve(packageDir, '..', 'core'), join(projectDir, 'node_modules', '@stet-css', 'core'), 'junction')
    await writeFile(join(projectDir, 'index.css'), `@import '@stet-css/core';\n@import './components.css';\n`)
    await writeFile(join(projectDir, 'components.css'), components('watch-card', 'block'))
    const rootUri = pathToFileURL(projectDir).href
    const uri = pathToFileURL(join(projectDir, 'index.html')).href
    const text = '<div class="watch-card watch-chip"></div>'

    await withStagedExtension(async ({ stagingDir }) => {
      const server = createLanguageServer({
        cwd: stagingDir,
        serverPath: resolve(stagingDir, 'dist', 'server.min.js')
      })
      const hover = async (className) => {
        const result = await server.request('textDocument/hover', {
          textDocument: { uri },
          position: { line: 0, character: text.indexOf(className) + 1 }
        })
        return result?.contents?.value?.replace(/\s+/g, '')
      }
      const diagnostics = () => server.notifications('textDocument/publishDiagnostics')
        .filter((params) => params.uri === uri)

      try {
        await server.request('initialize', {
          processId: null,
          rootUri,
          capabilities: { workspace: { configuration: false, workspaceFolders: true } },
          workspaceFolders: [{ uri: rootUri, name: 'watch' }]
        })
        server.notify('initialized', {})
        server.notify('textDocument/didOpen', { textDocument: { uri, languageId: 'html', version: 1, text } })
        // The server compiles a workspace's manifest on its one thread, so a request sent during a
        // (re)load waits for the whole compile, which CI load can stretch past the request timeout.
        // Hover only once a load has finished, which the server signals by publishing the
        // document's diagnostics: at once when it opens, then again once its workspace has loaded.
        await until(() => diagnostics().length >= 2, 'the workspace to load')
        expect(await hover('watch-card')).toContain('display:block')
        expect(await hover('watch-chip')).toBeUndefined()

        let published = diagnostics().length
        await unlink(join(projectDir, 'components.css'))
        await writeFile(join(projectDir, 'components.css'), components('watch-chip', 'flex'))

        // Each reload republishes the diagnostics. The first may still find components.css
        // missing, and the change that restores it reloads again.
        await until(async () => {
          if (diagnostics().length === published) return false
          published = diagnostics().length
          return (await hover('watch-chip'))?.includes('display:flex')
        }, 'hover to show watch-chip')

        await server.request('shutdown', null)
        server.notify('exit')
        await expect(server.closed()).resolves.toBe(0)
      } finally {
        await server.dispose()
      }
    })
  } finally {
    await rm(projectDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  }
})
