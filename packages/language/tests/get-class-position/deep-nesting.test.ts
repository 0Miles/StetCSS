import { exceedsScriptNestingLimit } from '@stet-css/lexer'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import type { languageIdOfExt } from '../helpers/create-doc'

const require = createRequire(import.meta.url)
const tsxRegisterURL = pathToFileURL(require.resolve('tsx/esm/api')).href
const languageEntryURL = pathToFileURL(resolve(__dirname, '../../src/index.ts')).href
const createDocURL = pathToFileURL(resolve(__dirname, '../helpers/create-doc.ts')).href
const tsconfigPath = resolve(__dirname, '../../../../tsconfig.json')

// The five shapes the upstream Master CSS fix tests, plus template literals,
// which crash oxc at the shallowest depth. Each carries a class where the
// default settings' regex fallback looks for one: a class function after
// whitespace, or a class attribute.
const shapes: [name: string, ext: keyof typeof languageIdOfExt, nest: (depth: number) => string][] = [
  ['nested arrays', 'js', (depth) => `x=${'['.repeat(depth)} clsx('block')${']'.repeat(depth)}`],
  ['chained arrow functions', 'js', (depth) => `x=${'a=>'.repeat(depth)} clsx('block')`],
  ['chained conditionals', 'js', (depth) => `x=${'a?b:'.repeat(depth)} clsx('block')`],
  ['nested JSX elements', 'tsx', (depth) => `x=<a className="block">${'<a>'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['nested type arguments', 'ts', (depth) => `let x:${'A<'.repeat(depth)}B${'>'.repeat(depth)}= clsx('block')`],
  ['nested template literals', 'tsx', (depth) => `x=${'`${'.repeat(depth)} clsx('block')${'}`'.repeat(depth)}`]
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

// Scans on a worker thread with default resource limits, the smallest stack
// the scan runs on (`eslint --concurrency` lints on such workers), inside a
// child process that a native crash can kill.
function getClassTokensOnWorkerInChild(ext: string, content: string) {
  const worker = [
    'import { parentPort, workerData } from \'node:worker_threads\'',
    `import { register } from ${JSON.stringify(tsxRegisterURL)}`,
    'register()',
    `const { getClassPositions, languageSettings } = await import(${JSON.stringify(languageEntryURL)})`,
    `const { default: createDoc } = await import(${JSON.stringify(createDocURL)})`,
    'const doc = createDoc(workerData.ext, workerData.content)',
    'parentPort.postMessage(getClassPositions(doc, languageSettings).map(({ token }) => token))'
  ].join('\n')
  const script = [
    'import { readFileSync } from \'node:fs\'',
    'import { Worker } from \'node:worker_threads\'',
    `const worker = new Worker(new URL('data:text/javascript,' + encodeURIComponent(${JSON.stringify(worker)})), {`,
    '  workerData: { ext: process.argv[1], content: readFileSync(0, \'utf8\') }',
    '})',
    'worker.on(\'message\', (tokens) => process.stdout.write(JSON.stringify(tokens)))'
  ].join('\n')
  return new Promise<{ code: number | null, signal: NodeJS.Signals | null, stdout: string, stderr: string }>((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '--eval', script, ext], {
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
 * Guards: an open JS/TS document nested deeper than oxc-parser's native stack
 * allows kills the language server with a signal no try/catch can catch, so
 * the editor loses every StetCSS feature until it restarts. Class positions
 * must still come back through the regex scan. Reverse check: disabling the
 * prescan in `createOxcClassPositions` turns only these six cases red.
 */
describe.concurrent('documents nested 20,000 deep', () => {
  test.each(shapes)('%s survive class position scanning and keep their classes', async (_, ext, nest) => {
    const { code, signal, stdout, stderr } = await getClassTokensOnWorkerInChild(ext, nest(20_000))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})

/**
 * Guards: the nesting limit stays below the depth oxc survives on the smallest
 * stack. Each shape goes in at the deepest level the prescan still hands to
 * oxc, so an oxc upgrade that needs more stack per level, or a raised limit,
 * crashes here instead of in a user's editor or lint run. Reverse check:
 * raising the limit to 2048 turns the arrays, type-arguments and
 * template-literals cases red; arrows, conditionals and JSX still parse at
 * 2048 on a worker stack.
 */
describe.concurrent('documents at the deepest nesting oxc still parses', () => {
  test.each(shapes)('%s parse without crashing', async (_, ext, nest) => {
    const { code, signal, stdout, stderr } = await getClassTokensOnWorkerInChild(ext, nest(deepestAllowed(nest)))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})
