import { execFile, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { resolveStyleCSSImportGraph } from '../src'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const stylesheetSource = resolve(testDirectory, '../src/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const tsconfigPath = resolve(testDirectory, '../../../tsconfig.json')
/** Covers loading the sources too, so a busy machine does not fail a call that returns. */
const CHILD_DEADLINE_MS = 30_000
/** The sources load well below this; reading `/dev/zero` passes it within milliseconds. */
const CHILD_MEMORY_CAP_BYTES = 1024 * 1024 * 1024

/** Both stylesheet `@import` expansions: the Vite, webpack and Next style entries, and the `@source` directive collection. */
const expansions = [
  { name: 'resolveStyleCSSImportGraph' },
  { name: 'collectStylesheetDirectivesFromCSSGraph' }
]

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
  const root = mkdtempSync(join(tmpdir(), 'stet-css-stylesheet-import-graph-inputs-'))
  try {
    await run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/**
 * Guards: each stylesheet `@import` expansion used to read a FIFO named `*.css` directly, blocking
 * the dev server until a writer opened it. It must fail with the FIFO's path, through the same
 * file check the compiler's import graph uses.
 * Runs in a child process with a deadline, so the old behaviour fails the test instead of hanging it.
 */
test.skipIf(process.platform === 'win32').concurrent.each(expansions)('$name fails on an @import of a FIFO with its path', ({ name }) => withRoot(async (root) => {
  const entry = join(root, 'entry.css')
  const fifo = join(root, 'pipe.css')
  const source = "@import './pipe.css';\n.example { color: red; }"
  execFileSync('mkfifo', [fifo])
  writeFileSync(entry, source)

  expect(await callIsolated(stylesheetSource, name, [entry, source])).toEqual({
    outcome: 'threw',
    message: `CSS file is not a regular file: ${fifo}`,
    cpuMs: expect.any(Number)
  })
}))

/**
 * Guards: each stylesheet `@import` expansion used to follow 30 levels that each import the next
 * level twice into 2^31 inclusions and never finish. It must stop at 10,000 inlined stylesheets,
 * within 5 seconds, through the same limit the compiler's import graph uses.
 * Runs in a child process with a deadline, so the old behaviour fails the test instead of hanging it.
 * The 5 seconds are the call's CPU time rather than wall-clock time, so a busy machine does not
 * fail a bounded call.
 */
test.concurrent.each(expansions)('$name stops a diamond @import graph at 10,000 inlined stylesheets', ({ name }) => withRoot(async (root) => {
  const source = "@import './level-1.css';\n@import './level-1.css';\n"
  writeFileSync(join(root, 'level-0.css'), source)
  for (let level = 1; level < 30; level++) {
    writeFileSync(join(root, `level-${level}.css`), `@import './level-${level + 1}.css';\n@import './level-${level + 1}.css';\n`)
  }
  writeFileSync(join(root, 'level-30.css'), '.example { color: red; }')

  const result = await callIsolated(stylesheetSource, name, [join(root, 'level-0.css'), source])

  expect(result).toMatchObject({
    outcome: 'threw',
    message: expect.stringMatching(/^CSS imports inline more than 10000 stylesheets, counting repeated imports of the same file: .+level-\d+\.css$/)
  })
  expect('cpuMs' in result && result.cpuMs).toBeLessThan(5_000)
}))

/**
 * Guards: an inlined `@stet-css/core` package graph counts toward the 64 MiB limit, or importing
 * the package many times, for example from the leaves of a diamond graph, would build gigabytes of
 * output without an error.
 * Uses a stand-in package with a 13 MiB style entry, so the test does not depend on the size of the
 * real package. Runs in process: without the count the call returns a 65 MiB source, so the test
 * fails rather than hangs.
 */
test('an inlined @stet-css/core package graph counts toward the 64 MiB limit', () => withRoot((root) => {
  const packageRoot = join(root, 'node_modules/@stet-css/core')
  mkdirSync(packageRoot, { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: '@stet-css/core', style: './index.css' }))
  writeFileSync(join(packageRoot, 'index.css'), ' '.repeat(13 * 1024 * 1024))
  const entry = join(root, 'entry.css')
  const source = '@import "@stet-css/core";\n'.repeat(5)
  writeFileSync(entry, source)

  expect(() => resolveStyleCSSImportGraph(entry, source, root)).toThrow('CSS imports inline more than 64 MiB: @stet-css/core')
}))
