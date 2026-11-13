import { execFile, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { resolveCSSImportGraph } from '../src'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const compilerSource = resolve(testDirectory, '../src/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const tsconfigPath = resolve(testDirectory, '../../../tsconfig.json')
/** Covers loading the sources too, so a busy machine does not fail a call that returns. */
const CHILD_DEADLINE_MS = 30_000
/** The sources load well below this; reading `/dev/zero` passes it within milliseconds. */
const CHILD_MEMORY_CAP_BYTES = 1024 * 1024 * 1024

type IsolatedCall =
  | { outcome: 'returned', cpuMs: number }
  | { outcome: 'threw', message: string, cpuMs: number }
  | { outcome: 'did not finish', detail: string }

/**
 * Calls one export of a source module in a child Node process. An input that makes the call block
 * or allocate without end then fails the test instead of hanging the runner or exhausting the
 * machine; the child also kills itself at the deadline in case the runner dies first.
 * `cpuMs` is the CPU time of the call alone, which stays steady when the machine is busy.
 */
function callIsolated(moduleFile: string, exportName: string, args: string[]): Promise<IsolatedCall> {
  const script = `
    import { writeSync } from 'node:fs'
    import { Worker } from 'node:worker_threads'
    const watchdog = new Worker(\`
      import { writeSync } from 'node:fs'
      const kill = (reason) => {
        writeSync(2, reason)
        process.kill(process.pid, 'SIGKILL')
      }
      setTimeout(() => kill('killed after ${CHILD_DEADLINE_MS} ms'), ${CHILD_DEADLINE_MS})
      setInterval(() => {
        if (process.memoryUsage.rss() > ${CHILD_MEMORY_CAP_BYTES}) kill('killed past ${CHILD_MEMORY_CAP_BYTES} bytes of resident memory')
      }, 10)
    \`, { eval: true })
    await new Promise((resolve) => watchdog.once('online', resolve))
    watchdog.unref()
    const target = (await import(${JSON.stringify(pathToFileURL(moduleFile).href)}))[${JSON.stringify(exportName)}]
    const started = process.cpuUsage()
    let result
    try {
      target(...${JSON.stringify(args)})
      result = { outcome: 'returned' }
    } catch (error) {
      result = { outcome: 'threw', message: error instanceof Error ? error.message : String(error) }
    }
    const { user, system } = process.cpuUsage(started)
    writeSync(1, JSON.stringify({ ...result, cpuMs: (user + system) / 1000 }))
    process.exit(0)
  `
  return new Promise((resolveCall) => {
    execFile(process.execPath, ['--import', tsxLoaderURL, '--input-type=module', '--eval', script], {
      encoding: 'utf8',
      env: { ...process.env, TSX_TSCONFIG_PATH: tsconfigPath },
      killSignal: 'SIGKILL',
      timeout: CHILD_DEADLINE_MS
    }, (error, stdout, stderr) => {
      if (!error) return resolveCall(JSON.parse(stdout) as IsolatedCall)
      resolveCall({
        outcome: 'did not finish',
        detail: stderr || (error.killed ? `killed after ${CHILD_DEADLINE_MS} ms` : error.message)
      })
    })
  })
}

async function withRoot(run: (root: string) => Promise<void> | void) {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-import-graph-inputs-'))
  try {
    await run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const notRegularFiles = [
  { kind: 'a FIFO', create: (file: string) => execFileSync('mkfifo', [file]) },
  { kind: 'a symlink to /dev/zero', create: (file: string) => symlinkSync('/dev/zero', file) }
]

/**
 * Guards: an `@import` of a `*.css` path that is not a regular file used to hang the build. A FIFO
 * blocks until a writer opens it; `/dev/zero` never ends and fills memory at gigabytes per second.
 * Both must fail with the imported path instead.
 * Runs in a child process with a deadline and a memory cap, so the old behaviour fails the test
 * rather than hanging the runner or exhausting the machine.
 */
test.skipIf(process.platform === 'win32').concurrent.each(notRegularFiles)('an @import of $kind fails with its path instead of reading it', ({ create }) => withRoot(async (root) => {
  const entry = join(root, 'entry.css')
  const imported = join(root, 'imported.css')
  create(imported)
  writeFileSync(entry, "@import './imported.css';\n.example { color: red; }")

  expect(await callIsolated(compilerSource, 'resolveCSSImportGraph', [entry])).toEqual({
    outcome: 'threw',
    message: `CSS file is not a regular file: ${imported}`,
    cpuMs: expect.any(Number)
  })
}))

/**
 * Guards: a stylesheet reached through a symlink, such as a token file linked into several
 * packages, must still be inlined; checking the link itself instead of its target would reject it
 * as not a regular file.
 */
test.skipIf(process.platform === 'win32')('an @import of a symlink to a regular stylesheet still inlines it', () => withRoot((root) => {
  const entry = join(root, 'entry.css')
  writeFileSync(join(root, 'tokens.css'), '.example { color: red; }')
  symlinkSync(join(root, 'tokens.css'), join(root, 'linked.css'))
  writeFileSync(entry, "@import './linked.css';")

  expect(resolveCSSImportGraph(entry).source).toBe('.example { color: red; }')
}))

/**
 * Guards: an `@import` of a stylesheet over 16 MiB, such as a mistyped path to a generated dump,
 * must fail with its path instead of being inlined.
 * Runs in process: without the check the file is read and the call returns, so the test fails
 * rather than hangs.
 */
test('an @import of a stylesheet over 16 MiB fails with its path', () => withRoot((root) => {
  const entry = join(root, 'entry.css')
  const imported = join(root, 'imported.css')
  writeFileSync(imported, ' '.repeat(16 * 1024 * 1024 + 1))
  writeFileSync(entry, "@import './imported.css';")

  expect(() => resolveCSSImportGraph(entry)).toThrow(`CSS file is larger than 16 MiB: ${imported}`)
}))

/**
 * Guards: every `@import` inlines its file again, so 30 levels that each import the next level twice
 * used to inline 2^31 stylesheets and never finish. The graph must stop with an error once it has
 * inlined 10,000 stylesheets, within 5 seconds.
 * Runs in a child process with a deadline, so the old behaviour fails the test instead of hanging it.
 * The 5 seconds are the call's CPU time rather than wall-clock time, so a busy machine does not
 * fail a bounded call.
 */
test.concurrent('a diamond @import graph stops at 10,000 inlined stylesheets instead of growing exponentially', () => withRoot(async (root) => {
  for (let level = 0; level < 30; level++) {
    writeFileSync(join(root, `level-${level}.css`), `@import './level-${level + 1}.css';\n@import './level-${level + 1}.css';\n`)
  }
  writeFileSync(join(root, 'level-30.css'), '.example { color: red; }')

  const result = await callIsolated(compilerSource, 'resolveCSSImportGraph', [join(root, 'level-0.css')])

  expect(result).toMatchObject({
    outcome: 'threw',
    message: expect.stringMatching(/^CSS imports inline more than 10000 stylesheets, counting repeated imports of the same file: .+level-\d+\.css$/)
  })
  expect('cpuMs' in result && result.cpuMs).toBeLessThan(5_000)
}))

/**
 * Guards: stylesheets under the 16 MiB file limit can still add up when imported repeatedly; five
 * imports of a 13 MiB file must fail once the graph has inlined more than 64 MiB, instead of
 * building an ever larger string.
 * Runs in process: without the limit the call returns a 65 MiB source, so the test fails rather
 * than hangs.
 */
test('an @import graph stops once it has inlined more than 64 MiB', () => withRoot((root) => {
  const entry = join(root, 'entry.css')
  writeFileSync(join(root, 'part.css'), ' '.repeat(13 * 1024 * 1024))
  writeFileSync(entry, "@import './part.css';\n".repeat(5))

  expect(() => resolveCSSImportGraph(entry)).toThrow(`CSS imports inline more than 64 MiB: ${join(root, 'part.css')}`)
}))

/**
 * Guards: a graph reads each imported file once and reuses it; that reuse must end with the graph,
 * or a dev server rebuilding after an edit would keep inlining the old imported stylesheet.
 */
test('an imported stylesheet edited between two resolutions is read again', () => withRoot((root) => {
  const entry = join(root, 'entry.css')
  const imported = join(root, 'imported.css')
  writeFileSync(imported, '.example { color: red; }')
  writeFileSync(entry, "@import './imported.css';")
  expect(resolveCSSImportGraph(entry).source).toBe('.example { color: red; }')

  writeFileSync(imported, '.example { color: blue; }')

  expect(resolveCSSImportGraph(entry).source).toBe('.example { color: blue; }')
}))
