import { exceedsScriptNestingLimit } from '@stet-css/lexer'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const tsxRegisterURL = pathToFileURL(require.resolve('tsx/esm/api')).href
const sourceEntryURL = pathToFileURL(resolve(__dirname, '../src/index.ts')).href
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')

// The five shapes the upstream Master CSS fix tests, plus template literals,
// which crash oxc at the shallowest depth. The JSX shape carries a class so
// the text-extraction fallback has something to find.
const shapes: [name: string, file: string, nest: (depth: number) => string][] = [
  ['nested arrays', 'a.js', (depth) => `x=${'[ '.repeat(depth)}'block'${' ]'.repeat(depth)}`],
  ['chained arrow functions', 'a.js', (depth) => `x=${'a=>'.repeat(depth)}'block'`],
  ['chained conditionals', 'a.js', (depth) => `x=${'a?b:'.repeat(depth)}'block'`],
  ['nested JSX elements', 'a.tsx', (depth) => `x=<a className="block">${'<a>'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['nested type arguments', 'a.ts', (depth) => `let x:${'A<'.repeat(depth)}B${'>'.repeat(depth)}='block'`],
  ['nested template literals', 'a.js', (depth) => `x=${'`${ '.repeat(depth)}'block'${' }`'.repeat(depth)}`]
]

function deepestAllowed(nest: (depth: number) => string) {
  let allowed = 1
  let rejected = 1 << 16
  while (rejected - allowed > 1) {
    const depth = (allowed + rejected) >> 1
    if (exceedsScriptNestingLimit(nest(depth))) rejected = depth
    else allowed = depth
  }
  return allowed
}

// Extracts on a worker thread with default resource limits, the smallest stack
// the extraction runs on, inside a child process that a native crash can kill.
function extractOnWorkerInChild(file: string, content: string) {
  const worker = [
    'import { parentPort, workerData } from \'node:worker_threads\'',
    `import { register } from ${JSON.stringify(tsxRegisterURL)}`,
    'register()',
    `const { extractOxcClasses } = await import(${JSON.stringify(sourceEntryURL)})`,
    'parentPort.postMessage(extractOxcClasses(workerData.file, workerData.content))'
  ].join('\n')
  const script = [
    'import { readFileSync } from \'node:fs\'',
    'import { Worker } from \'node:worker_threads\'',
    `const worker = new Worker(new URL('data:text/javascript,' + encodeURIComponent(${JSON.stringify(worker)})), {`,
    '  workerData: { file: process.argv[1], content: readFileSync(0, \'utf8\') }',
    '})',
    'worker.on(\'message\', (classes) => process.stdout.write(JSON.stringify(classes)))'
  ].join('\n')
  return new Promise<{ code: number | null, signal: NodeJS.Signals | null, stdout: string, stderr: string }>((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '--eval', script, file], {
      env: { ...process.env, TSX_TSCONFIG_PATH: tsconfigPath }
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code, signal) => resolvePromise({ code, signal, stdout, stderr }))
    child.stdin.end(content)
  })
}

/**
 * Guards: a JS/TS file nested deeper than oxc-parser's native stack allows
 * (generated data, minified bundles) kills the whole build or dev server with
 * a signal no try/catch can catch, so the file must never reach oxc. The class
 * must still come back through the text-extraction fallback. Reverse check:
 * removing the prescan from `extractOxcClasses` turns only these six cases
 * red, each child killed by SIGILL.
 */
describe.concurrent('JavaScript and TypeScript nested 20,000 deep', () => {
  test.each(shapes)('%s survive extraction and keep their classes', async (_, file, nest) => {
    const { code, signal, stdout, stderr } = await extractOnWorkerInChild(file, nest(20_000))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})

/**
 * Guards: the nesting limit stays below the depth oxc survives on the smallest
 * stack. Each shape goes in at the deepest level the prescan still hands to
 * oxc, so an oxc upgrade that needs more stack per level, or a raised limit,
 * crashes here instead of in a user's build. Reverse check: raising the limit
 * to 2048 turns the arrays, type-arguments and template-literals cases red;
 * arrows, conditionals and JSX still parse at 2048 on a worker stack.
 */
describe.concurrent('JavaScript and TypeScript at the deepest nesting oxc still parses', () => {
  test.each(shapes)('%s parse without crashing', async (_, file, nest) => {
    const { code, signal, stdout, stderr } = await extractOnWorkerInChild(file, nest(deepestAllowed(nest)))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})
