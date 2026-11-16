import { exceedsScriptNestingLimit } from '@stet-css/lexer'
import { MAX_PARSE_LENGTH } from '../../src/utils/oxc-stack'
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

// Chains written one level per line. The prescan ends a chain at each newline
// (or never counts the construct), so these reach oxc at full depth.
const lineShapes: [name: string, ext: keyof typeof languageIdOfExt, nest: (depth: number) => string][] = [
  ['chained conditionals', 'js', (depth) => `x=${'a?b:\n'.repeat(depth)} clsx('block')`],
  ['else-if chains', 'js', (depth) => `if(a){}${'else if(a){}\n'.repeat(depth)}else{x= clsx('block')}`],
  ['assignment chains', 'js', (depth) => `x=${'a=\n'.repeat(depth)} clsx('block')`],
  ['chained arrow functions', 'js', (depth) => `x=${'a=>\n'.repeat(depth)} clsx('block')`],
  ['nested JSX elements', 'tsx', (depth) => `x=<a className="block">${'<a>\n'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['new chains', 'js', (depth) => `x=${'new\n'.repeat(depth)}A( clsx('block'))`]
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
 * must still come back. Reverse check: disabling the prescan in
 * `parseOxcOnSourceStack` keeps these green, because the stack sized to the
 * source now carries them; the dense-brackets case below guards the prescan.
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

/**
 * Guards: a chain written one level per line passes the prescan, which cannot
 * tell a newline that ends a statement from one inside a formatted expression,
 * and still overflows oxc-parser's native stack at 20,000 levels, killing the
 * language server. oxc must parse these on a stack sized to the source, and
 * the document's class positions must come back, from the regex scan when the
 * tree is too deep to walk. Reverse check: setting `INLINE_LENGTH` in
 * `oxc-stack.ts` to `1 << 30` turns only these six cases red; dropping the
 * `RangeError` fallback in `createOxcClassPositions` turns only the `new`
 * chains case red.
 */
describe.concurrent('documents chained one level per line, 20,000 deep', () => {
  test.each(lineShapes)('%s survive class position scanning and keep their classes', async (_, ext, nest) => {
    const { code, signal, stdout, stderr } = await getClassTokensOnWorkerInChild(ext, nest(20_000))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})

/**
 * Guards: a document longer than `MAX_PARSE_LENGTH` needs more stack than the
 * parse thread can get, and 4 MB of labels overflows even that, killing the
 * language server. It must skip oxc and keep its class positions through the
 * regex scan. Reverse check: setting `MAX_PARSE_LENGTH` to `Infinity` turns
 * only this case red.
 */
test('documents longer than the parse limit survive class position scanning and keep their classes', async () => {
  const content = `${'a:'.repeat(2_000_000)}x= clsx('block')`
  expect(content.length).toBeGreaterThan(MAX_PARSE_LENGTH)

  const { code, signal, stdout, stderr } = await getClassTokensOnWorkerInChild('js', content)

  expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
  expect(JSON.parse(stdout)).toContain('block')
})

/**
 * Guards: brackets written back to back cost oxc more native stack per
 * character than the stack sized to the source provides, so past the nesting
 * limit they must skip oxc, or the language server dies. Class positions must
 * come back through the regex scan. The input is exactly 128 KiB, the most a
 * 128 MiB stack is sized for, and needs about 170 MiB. Source's copy of the
 * module is the same (`oxc-stack-copy.test.ts`); source has no such case
 * because its text extraction is too slow on runs of brackets. Reverse check:
 * disabling the prescan in `parseOxcOnSourceStack` turns only this case red.
 */
test('documents with dense brackets nested 65,528 deep survive class position scanning and keep their classes', async () => {
  const content = `x=${'['.repeat(65_528)} clsx('block')${']'.repeat(65_528)}`
  expect(content.length).toBe(128 * 1024)

  const { code, signal, stdout, stderr } = await getClassTokensOnWorkerInChild('js', content)

  expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
  expect(JSON.parse(stdout)).toContain('block')
})
