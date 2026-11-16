import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const entriesSource = resolve(testDirectory, '../src/entries.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const tsconfigPath = resolve(testDirectory, '../../../tsconfig.json')

/**
 * Guards: entry discovery reads every CSS file in the project, including vendored ones. A file
 * nested 5,000 levels deep crashed the process inside lightningcss with SIGSEGV; discovery must
 * survive it and still find the file's `@import "@stet-css/core"` through its text fallback.
 * Runs in a child process, so a crash fails the test instead of killing the runner.
 * Reverse check: the `try`/`catch` around `inspectCSS` in `entries.ts` removed fails this test
 * (the file is then skipped as unreadable and the entry is lost); the nesting checks removed from the
 * compiler crash the child.
 */
test('entry discovery survives a deeply nested CSS file and still finds its entry marker', () => {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-deep-nesting-'))
  try {
    const entry = join(root, 'index.css')
    writeFileSync(entry, '@import "@stet-css/core";\n' + '.a{'.repeat(5_000) + 'color:red' + '}'.repeat(5_000))
    const script = `
      const { findCSSManifestEntryFiles } = await import(${JSON.stringify(pathToFileURL(entriesSource).href)})
      let result
      try {
        result = { entries: await findCSSManifestEntryFiles(${JSON.stringify(root)}) }
      } catch (error) {
        result = { error: String(error) }
      }
      process.stdout.write(JSON.stringify(result))
    `
    const child = spawnSync(process.execPath, ['--import', tsxLoaderURL, '--input-type=module', '--eval', script], {
      encoding: 'utf8',
      env: { ...process.env, TSX_TSCONFIG_PATH: tsconfigPath },
      killSignal: 'SIGKILL',
      timeout: 30_000
    })

    expect({ signal: child.signal, status: child.status, stderr: child.stderr }).toEqual({ signal: null, status: 0, stderr: '' })
    expect(JSON.parse(child.stdout)).toEqual({ entries: [entry] })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
