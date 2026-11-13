import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import type { languageIdOfExt } from '../helpers/create-doc'

const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const languageEntryURL = pathToFileURL(resolve(__dirname, '../../src/index.ts')).href
const createDocURL = pathToFileURL(resolve(__dirname, '../helpers/create-doc.ts')).href
const tsconfigPath = resolve(__dirname, '../../../../tsconfig.json')
const depth = 20_000

// The five shapes the upstream Master CSS fix tests at 20,000 levels, each
// carrying a class where the language server's default settings look for one.
const shapes: [name: string, ext: keyof typeof languageIdOfExt, content: string][] = [
  ['nested arrays', 'js', `x=${'['.repeat(depth)} clsx('block')${']'.repeat(depth)}`],
  ['chained arrow functions', 'js', `x=${'a=>'.repeat(depth)} clsx('block')`],
  ['chained conditionals', 'js', `x=${'a?b:'.repeat(depth)} clsx('block')`],
  ['nested JSX elements', 'tsx', `x=<a className="block">${'<a>'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['nested type arguments', 'ts', `let x:${'A<'.repeat(depth)}B${'>'.repeat(depth)}= clsx('block')`]
]

function getClassTokensInChild(ext: string, content: string) {
  const script = [
    'import { readFileSync } from \'node:fs\'',
    `import { getClassPositions, languageSettings } from ${JSON.stringify(languageEntryURL)}`,
    `import createDoc from ${JSON.stringify(createDocURL)}`,
    'const doc = createDoc(process.argv[1], readFileSync(0, \'utf8\'))',
    'process.stdout.write(JSON.stringify(getClassPositions(doc, languageSettings).map(({ token }) => token)))'
  ].join('\n')
  return new Promise<{ code: number | null, signal: NodeJS.Signals | null, stdout: string, stderr: string }>((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['--import', tsxLoaderURL, '--input-type=module', '--eval', script, ext], {
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
 * allows kills the language server with SIGSEGV, which no try/catch can catch,
 * so the editor loses every StetCSS feature until it restarts. Each shape runs
 * in its own child process so a crash fails one case instead of taking down the
 * test runner; class positions must still come back through the regex scan.
 */
describe.concurrent('deeply nested JavaScript and TypeScript documents', () => {
  test.each(shapes)('%s survive class position scanning and keep their classes', async (_, ext, content) => {
    const { code, signal, stdout, stderr } = await getClassTokensInChild(ext, content)

    expect({ code, signal, stderr }).toEqual({ code: 0, signal: null, stderr: '' })
    expect(JSON.parse(stdout)).toContain('block')
  })
})
