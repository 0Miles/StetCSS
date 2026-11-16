import { exceedsScriptNestingLimit } from '@stet-css/lexer'
import { INLINE_LENGTH, MAX_PARSE_LENGTH } from '../src/adapters/oxc-stack'
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

// Chains written one level per line. The prescan ends a chain at each newline
// (or never counts the construct), so these reach oxc at full depth.
const lineShapes: [name: string, file: string, nest: (depth: number) => string][] = [
  ['chained conditionals', 'a.js', (depth) => `x=${'a?b:\n'.repeat(depth)}'block'`],
  ['else-if chains', 'a.js', (depth) => `if(a){}${'else if(a){}\n'.repeat(depth)}else{x='block'}`],
  ['assignment chains', 'a.js', (depth) => `x=${'a=\n'.repeat(depth)}'block'`],
  ['chained arrow functions', 'a.js', (depth) => `x=${'a=>\n'.repeat(depth)}'block'`],
  ['nested JSX elements', 'a.tsx', (depth) => `x=<a className="block">${'<a>\n'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['new chains', 'a.js', (depth) => `x=${'new\n'.repeat(depth)}A('block')`]
]

// Labels cost oxc the most stack per character of the chains the prescan
// never counts.
const labels = (depth: number) => `${'a:'.repeat(depth)}x='block'`

// The deepest input still short enough to parse on the caller's stack.
function deepestInline(nest: (depth: number) => string) {
  let allowed = 1
  let rejected = Math.min(INLINE_LENGTH + 1, 1 << 16)
  while (rejected - allowed > 1) {
    const depth = (allowed + rejected) >> 1
    const content = nest(depth)
    if (content.length > INLINE_LENGTH || exceedsScriptNestingLimit(content)) rejected = depth
    else allowed = depth
  }
  return allowed
}

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

/**
 * Guards: a chain written one level per line passes the prescan, which cannot
 * tell a newline that ends a statement from one inside a formatted expression,
 * and still overflows oxc-parser's native stack at 20,000 levels, killing the
 * build or dev server. oxc must parse these on a stack sized to the source and
 * return the file's class. Reverse check: setting `INLINE_LENGTH` in
 * `oxc-stack.ts` to `1 << 30`, so every source parses on the caller's stack,
 * turns these six cases red, plus the inline cases below for the uncounted
 * chains, whose inputs grow with `INLINE_LENGTH`.
 */
describe.concurrent('JavaScript and TypeScript chained one level per line, 20,000 deep', () => {
  test.each(lineShapes)('%s survive extraction and keep their classes', async (_, file, nest) => {
    const { code, signal, stdout, stderr } = await extractOnWorkerInChild(file, nest(20_000))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})

/**
 * Guards: sources up to `INLINE_LENGTH` parse on the caller's own stack, so
 * the deepest input that short, in every shape, must fit the smallest stack
 * extraction runs on. Reverse check: raising `INLINE_LENGTH` to 16384 turns
 * the labels and `new` chains cases red.
 */
describe.concurrent('JavaScript and TypeScript short enough to parse inline', () => {
  test.each([...shapes, ...lineShapes, ['labels', 'a.js', labels] as const])('%s parse without crashing', async (_, file, nest) => {
    const { code, signal, stdout, stderr } = await extractOnWorkerInChild(file, nest(deepestInline(nest)))

    expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
    expect(JSON.parse(stdout)).toContain('block')
  })
})

/**
 * Guards: a source longer than `MAX_PARSE_LENGTH` needs more stack than the
 * parse thread can get, and 4 MB of labels overflows even that, killing the
 * build. It must skip oxc and keep its class through text extraction.
 * Reverse check: setting `MAX_PARSE_LENGTH` to `Infinity` turns only this
 * case red.
 */
test('JavaScript longer than the parse limit survives extraction and keeps its classes', async () => {
  const content = labels(2_000_000)
  expect(content.length).toBeGreaterThan(MAX_PARSE_LENGTH)

  const { code, signal, stdout, stderr } = await extractOnWorkerInChild('a.js', content)

  expect({ code, signal }, stderr).toEqual({ code: 0, signal: null })
  expect(JSON.parse(stdout)).toContain('block')
})
