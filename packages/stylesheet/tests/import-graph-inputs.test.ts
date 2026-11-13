import { execFile, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const stylesheetSource = resolve(testDirectory, '../src/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const tsconfigPath = resolve(testDirectory, '../../../tsconfig.json')
/** Covers loading the sources too, so a busy machine does not fail a call that returns. */
const CHILD_DEADLINE_MS = 30_000

/** Both stylesheet `@import` expansions: the Vite, webpack and Next style entries, and the `@source` directive collection. */
const expansions = [
  { name: 'resolveStyleCSSImportGraph' },
  { name: 'collectStylesheetDirectivesFromCSSGraph' }
]

type IsolatedCall =
  | { outcome: 'returned', ms: number }
  | { outcome: 'threw', message: string, ms: number }
  | { outcome: 'did not finish', detail: string }

/**
 * Calls `<name>(entry, source)` from the stylesheet sources in a child Node process. An input that
 * makes the call block then fails the test instead of hanging the runner.
 */
function expandIsolated(name: string, entry: string, source: string): Promise<IsolatedCall> {
  const script = `
    import { writeSync } from 'node:fs'
    const expand = (await import(${JSON.stringify(pathToFileURL(stylesheetSource).href)}))[${JSON.stringify(name)}]
    const started = performance.now()
    let result
    try {
      expand(${JSON.stringify(entry)}, ${JSON.stringify(source)})
      result = { outcome: 'returned' }
    } catch (error) {
      result = { outcome: 'threw', message: error instanceof Error ? error.message : String(error) }
    }
    writeSync(1, JSON.stringify({ ...result, ms: performance.now() - started }))
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

  expect(await expandIsolated(name, entry, source)).toEqual({
    outcome: 'threw',
    message: `CSS file is not a regular file: ${fifo}`,
    ms: expect.any(Number)
  })
}))

/**
 * Guards: each stylesheet `@import` expansion used to follow 30 levels that each import the next
 * level twice into 2^31 inclusions and never finish. It must stop at 10,000 inlined stylesheets,
 * well within 5 seconds, through the same limit the compiler's import graph uses.
 * Runs in a child process with a deadline, so the old behaviour fails the test instead of hanging it.
 */
test.concurrent.each(expansions)('$name stops a diamond @import graph at 10,000 inlined stylesheets', ({ name }) => withRoot(async (root) => {
  const source = "@import './level-1.css';\n@import './level-1.css';\n"
  writeFileSync(join(root, 'level-0.css'), source)
  for (let level = 1; level < 30; level++) {
    writeFileSync(join(root, `level-${level}.css`), `@import './level-${level + 1}.css';\n@import './level-${level + 1}.css';\n`)
  }
  writeFileSync(join(root, 'level-30.css'), '.example { color: red; }')

  const result = await expandIsolated(name, join(root, 'level-0.css'), source)

  expect(result).toMatchObject({
    outcome: 'threw',
    message: expect.stringMatching(/^CSS imports inline more than 10000 stylesheets, counting repeated imports of the same file: .+level-\d+\.css$/)
  })
  expect('ms' in result && result.ms).toBeLessThan(5_000)
}))
