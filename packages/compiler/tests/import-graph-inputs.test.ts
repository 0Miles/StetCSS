import { execFile, execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { compileCSSManifest, compileCSSManifestFile, resolveCSSImportGraph } from '../src'

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
function callIsolated(moduleFile: string, exportName: string, args: unknown[]): Promise<IsolatedCall> {
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
 * Reverse check: `!stats.isFile()` in `css-import-graph-reader.ts` turned into `stats.isDirectory()`
 * fails both rows and the stylesheet FIFO tests; turned into `stats.isFIFO()`, only the `/dev/zero` row.
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
 * Reverse check: `statSync` swapped for `lstatSync` in `css-import-graph-reader.ts` fails only this test.
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
 * Reverse check: the size check in `css-import-graph-reader.ts` loosened to `> MAX_CSS_FILE_BYTES + 1`
 * fails only this test.
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
 * Reverse check: the inclusion limit in `css-import-graph-reader.ts` raised a thousandfold fails this
 * test and both stylesheet diamond tests; a fresh reader for each recursion in `index.ts` fails this
 * test and the 64 MiB test.
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
 * Reverse check: counting a file's bytes only on its first read in `css-import-graph-reader.ts`
 * fails this test and the stylesheet package-graph test.
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
 * Reverse check: the reader's `sources` map moved to module scope fails this test and the
 * `@reference` test that rewrites `b.css` between two compiles.
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

/** Writes 12 levels that each define a component and reference the next level twice. */
function writeReferenceDiamond(root: string) {
  for (let level = 0; level < 12; level++) {
    writeFileSync(join(root, `level-${level}.css`), [
      `@reference './level-${level + 1}.css';`,
      `@reference './level-${level + 1}.css';`,
      `@components { level-${level} { color: red; } }`
    ].join('\n'))
  }
  writeFileSync(join(root, 'level-12.css'), '@components { level-12 { color: red; } }')
  return join(root, 'level-0.css')
}

const referenceDiamondCalls = [
  { api: 'compileCSSManifestFile', args: (entry: string) => [entry] },
  { api: 'compileProjectManifest', args: (entry: string) => [[entry]] },
  { api: 'compileCSSManifest', args: (entry: string) => [readFileSync(entry, 'utf8'), { from: entry }] }
]

/**
 * Guards: every `@reference` is a full compile of its file, so 12 levels that each reference the
 * next level twice compiled 8,191 stylesheets: over 4 seconds without a base manifest and close to
 * a minute in a real build, with no error. The compile must stop with an error naming a file once
 * the reference tree passes 256 expansions, within 5 seconds, through every compile entry point.
 * Each level defines a component, so a shortcut that skips empty stylesheets cannot pass it.
 * Runs in a child process, so the old behaviour fails the test instead of slowing the runner.
 * Reverse check: `MAX_CSS_REFERENCE_EXPANSIONS` set to `Infinity` fails the three rows and the
 * 257th-reference test.
 */
test.concurrent.each(referenceDiamondCalls)('$api stops a diamond @reference graph after 256 expansions instead of compiling 8,191 stylesheets', ({ api, args }) => withRoot(async (root) => {
  const entry = writeReferenceDiamond(root)

  const result = await callIsolated(compilerSource, api, args(entry))

  expect(result).toMatchObject({
    outcome: 'threw',
    message: expect.stringMatching(/^CSS references compile more than 256 stylesheets, counting repeated references of the same file: .+level-0\.css( -> .+level-\d+\.css)+$/)
  })
  expect('cpuMs' in result && result.cpuMs).toBeLessThan(5_000)
}))

/**
 * Guards: the limit is 256 expansions across the reference tree. A project that references the
 * same stylesheet 256 times must keep compiling, and the 257th reference must fail with the path of
 * the reference chain that passed it.
 * Reverse check: `expansions > MAX_CSS_REFERENCE_EXPANSIONS` turned into `>=` fails only this test.
 */
test('a compile expands up to 256 @reference directives and fails on the 257th', () => withRoot((root) => {
  const entry = join(root, 'entry.css')
  const tokens = join(root, 'tokens.css')
  writeFileSync(tokens, '@components { brand { color: red; } }')
  const composeBrand = '.button { @compose brand; }'

  writeFileSync(entry, "@reference './tokens.css';\n".repeat(256) + composeBrand)
  expect(compileCSSManifestFile(entry).css).toContain('.button{color:red}')

  writeFileSync(entry, "@reference './tokens.css';\n".repeat(257) + composeBrand)
  expect(() => compileCSSManifestFile(entry)).toThrow(`CSS references compile more than 256 stylesheets, counting repeated references of the same file: ${entry} -> ${tokens}`)
}))

/**
 * Guards: the stylesheets a compile's references import count toward the same 10,000-stylesheet
 * limit as the entry's own imports. Otherwise each of up to 256 references would get a limit of its
 * own, and 200 references of a stylesheet with 50 imports would inline 10,200 stylesheets unchecked.
 * Reverse check: a fresh `createCSSImportGraphReader()` per referenced graph in
 * `resolveCSSReferenceTree` fails only this test.
 */
test('stylesheets imported by referenced files count toward the compile\'s 10,000-stylesheet limit', () => withRoot((root) => {
  const entry = join(root, 'entry.css')
  const part = join(root, 'part.css')
  writeFileSync(part, '@components { brand { color: red; } }')
  writeFileSync(join(root, 'hub.css'), "@import './part.css';\n".repeat(50))
  writeFileSync(entry, "@reference './hub.css';\n".repeat(200))

  expect(() => compileCSSManifestFile(entry)).toThrow(`CSS imports inline more than 10000 stylesheets, counting repeated imports of the same file: ${part}`)
}))

const deepNesting = '.a{'.repeat(5_000) + 'color:red' + '}'.repeat(5_000)

const deepStylesheets = [
  { shape: '5,000 nested rules', css: deepNesting, line: 1 },
  { shape: '1,000 alternating rules and @media blocks', css: '.a{@media (min-width:1px){'.repeat(500) + 'color:red' + '}'.repeat(1_000), line: 1 },
  { shape: '400 nested rules', css: '.a{'.repeat(400) + 'color:red' + '}'.repeat(400), line: 1 },
  { shape: '5,000 nested :is()', css: ':is('.repeat(5_000) + '.a' + ')'.repeat(5_000) + '{color:red}', line: 1 },
  // Each row below passed the first counter and still crashed.
  { shape: 'a mismatched closer in every rule', css: '.a{];'.repeat(5_000) + 'color:red' + '}'.repeat(5_000), line: 1 },
  { shape: 'a } inside an unquoted url() in every rule', css: '.a{x:url(});'.repeat(5_000) + 'color:red' + '}'.repeat(5_000), line: 1 },
  { shape: 'a comment opener inside an earlier unquoted url()', css: '.x{background:url(/*)}' + deepNesting, line: 1 },
  { shape: 'an earlier string continued across a CRLF', css: '.x{content:"a\\\r\nb"}' + deepNesting, line: 2 }
]

/**
 * Guards: lightningcss recurses once per nested rule, selector function or media-query parenthesis.
 * 5,000 nested rules killed the build with SIGSEGV, 1,000 rule and @media levels with SIGTRAP, both
 * without a message; 400 rules threw an unnamed `Maximum call stack size exceeded`. Each must fail
 * with an error naming the stylesheet and line. The last four rows tokenize differently from a
 * naive bracket count (mismatched closers, unquoted URLs, CRLF line continuations), which let them
 * through the first version of the prescan.
 * Runs in a child process, so a crash fails the test instead of killing the runner.
 * Reverse check: the `assertCSSNestingDepth` call in `compileCSS` removed fails every row and the
 * 64-level test; popping on any closer fails only the mismatched-closer row; skipping unquoted URLs
 * removed fails the two URL rows and the ordinary-CSS test; the escaped-CRLF step removed fails only
 * the CRLF row.
 */
test.concurrent.each(deepStylesheets)('a stylesheet with $shape fails with its file name instead of crashing', async ({ css, line }) => {
  expect(await callIsolated(compilerSource, 'compileCSSManifest', [css, { from: '/project/deep.css' }])).toEqual({
    outcome: 'threw',
    message: `CSS nests deeper than 64 levels at line ${line}: /project/deep.css`,
    cpuMs: expect.any(Number)
  })
})

/**
 * Guards: deep nesting usually arrives in third-party CSS pulled in by `@import`; the error must
 * name that file and its line, not the entry that imports it.
 * Runs in a child process, so the old crash fails the test instead of killing the runner.
 * Reverse check: the `assertCSSNestingDepth` call in `findCSSImportStatements` removed fails only
 * this test (the entry's compile then names the entry instead).
 */
test.concurrent('a deeply nested stylesheet reached by @import fails with the imported file and line', () => withRoot(async (root) => {
  const entry = join(root, 'entry.css')
  const vendor = join(root, 'vendor.css')
  writeFileSync(vendor, '.ok { color: red; }\n' + deepNesting)
  writeFileSync(entry, "@import './vendor.css';\n.example { color: red; }")

  expect(await callIsolated(compilerSource, 'compileCSSManifestFile', [entry])).toEqual({
    outcome: 'threw',
    message: `CSS nests deeper than 64 levels at line 2: ${vendor}`,
    cpuMs: expect.any(Number)
  })
}))

/**
 * Guards: the limit is 64 levels of `{`, `(` and `[` together; 64 levels must keep compiling and
 * the 65th must fail.
 * Reverse check: `depth === CSS_NESTING_LIMIT` turned into `depth === CSS_NESTING_LIMIT - 1` fails
 * only this test.
 */
test('a stylesheet nesting 64 levels compiles and 65 levels fail', () => {
  const nest = (rules: number, parens: number) => '.a{'.repeat(rules) + `width:calc(${'('.repeat(parens - 1)}1px${')'.repeat(parens - 1)})` + '}'.repeat(rules)

  expect(compileCSSManifest(nest(32, 32), { from: '/project/deep.css' }).css).toContain('width: 1px')
  expect(() => compileCSSManifest(nest(33, 32), { from: '/project/deep.css' })).toThrow('CSS nests deeper than 64 levels at line 1: /project/deep.css')
})

/**
 * Guards: brackets in comments, strings, escapes and unquoted URLs are not nesting; counting them
 * would reject ordinary CSS such as an SVG data URI or a commented-out block.
 * Reverse check: skipping strings removed from `css-nesting.ts` fails only this test.
 */
test('brackets inside comments, strings, escapes and unquoted URLs do not count toward the nesting limit', () => {
  const css = [
    `/* ${'{'.repeat(200)} */`,
    `.icon { background: url("data:image/svg+xml,${'('.repeat(200)}"); content: '${'['.repeat(200)}'; }`,
    `.mask { mask: url(data:image/svg+xml,${'{['.repeat(100)}); }`,
    `.a\\{ { color: red; }`.repeat(200)
  ].join('\n')

  expect(compileCSSManifest(css, { from: 'ordinary.css' }).css).toContain('.icon {')
})
