import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const sourceEntryURL = pathToFileURL(resolve(__dirname, '../src/index.ts')).href
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const depth = 20_000

// The five shapes the upstream Master CSS fix tests at 20,000 levels; the JSX
// shape carries a class so the fallback has something to find.
const shapes: [name: string, file: string, content: string][] = [
  ['nested arrays', 'a.js', `x=${'['.repeat(depth)}'block'${']'.repeat(depth)}`],
  ['chained arrow functions', 'a.js', `x=${'a=>'.repeat(depth)}'block'`],
  ['chained conditionals', 'a.js', `x=${'a?b:'.repeat(depth)}'block'`],
  ['nested JSX elements', 'a.tsx', `x=<a className="block">${'<a>'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['nested type arguments', 'a.ts', `let x:${'A<'.repeat(depth)}B${'>'.repeat(depth)}='block'`]
]

function extractInChild(file: string, content: string) {
  const script = [
    'import { readFileSync } from \'node:fs\'',
    `import { extractOxcClasses } from ${JSON.stringify(sourceEntryURL)}`,
    'process.stdout.write(JSON.stringify(extractOxcClasses(process.argv[1], readFileSync(0, \'utf8\'))))'
  ].join('\n')
  return new Promise<{ code: number | null, signal: NodeJS.Signals | null, stdout: string, stderr: string }>((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['--import', tsxLoaderURL, '--input-type=module', '--eval', script, file], {
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
 * SIGSEGV, which no try/catch can catch, so the file must never reach oxc.
 * Each shape runs in its own child process so a crash fails one case instead
 * of taking down the test runner; the class must still come back through the
 * text-extraction fallback.
 */
describe.concurrent('deeply nested JavaScript and TypeScript', () => {
  test.each(shapes)('%s survive extraction and keep their classes', async (_, file, content) => {
    const { code, signal, stdout, stderr } = await extractInChild(file, content)

    expect({ code, signal, stderr }).toEqual({ code: 0, signal: null, stderr: '' })
    expect(JSON.parse(stdout)).toContain('block')
  })
})
