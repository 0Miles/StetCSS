/** require: `npm run dev` in root */

import fs from 'fs'
import os from 'node:os'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import path from 'upath'
import { cssEscape } from '@stet-css/lexer'
import waitForDataMatch from '../../helpers/wait-for-data-match'
import dedent from 'ts-dedent'
import { it, beforeAll, afterAll, expect } from 'vitest'
import { execa, type ResultPromise } from 'execa'

const cliFilepath = path.resolve(__dirname, '../../../src/bin/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
const originHTMLText = dedent`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <h1 class="font:heavy font:48px btn hmr-test">Hello World</h1>
    <button class="bg:primary">Submit</button>
  </body>
  </html>
`

const originConfigText = `@import "@stet-css/core";

@theme {
  --color-primary: var(--color-blue);
}

@components {
  btn {
    background-color: oklch(63.7% 0.237 25.331);
  }
}
`

let workspacePath: string
let HTMLFilepath: string
let configFilepath: string
let virtualCSSFilepath: string
let subprocess: ResultPromise
let subprocessOutput = ''

async function waitForCSSContent(doesMatch: (css: string) => boolean) {
  const deadline = Date.now() + 60000
  let css = ''
  while (Date.now() < deadline) {
    if (fs.existsSync(virtualCSSFilepath)) {
      css = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
      if (doesMatch(css)) return css
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out waiting for generated CSS content.\n\nLast CSS:\n${css}\n\nProcess output:\n${subprocessOutput}`)
}

async function waitForWatchRestart(onReady: () => void) {
  await waitForDataMatch(
    subprocess,
    (data) => data.includes('Restart watching source changes'),
    onReady
  )
}

beforeAll(() => {
  subprocessOutput = ''
  workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'stet-css-cli-watch-'))
  HTMLFilepath = path.join(workspacePath, 'test.html')
  configFilepath = path.join(workspacePath, 'index.css')
  virtualCSSFilepath = path.join(workspacePath, 'output.css')
  fs.writeFileSync(HTMLFilepath, originHTMLText, { flag: 'w+' })
  fs.writeFileSync(configFilepath, originConfigText, { flag: 'w+' })
  subprocess = execa(process.execPath, ['--import', tsxLoaderURL, cliFilepath, '-w', '-o', virtualCSSFilepath], {
    cwd: workspacePath,
    forceKillAfterDelay: 1000
  })
  void subprocess.catch(() => undefined)
  subprocess.stdout?.on('data', (data) => {
    subprocessOutput += data.toString()
  })
  subprocess.stderr?.on('data', (data) => {
    subprocessOutput += data.toString()
  })
})

it('start watch process', async () => {
  await Promise.all([
    waitForDataMatch(subprocess, (data) => data.includes('Start watching source changes')),
    waitForDataMatch(subprocess, (data) => data.includes('exported'))
  ])
  const fileCSSText = await waitForCSSContent((css) => [
    'font:heavy',
    'font:48px',
    'bg:primary',
    'btn'
  ].every((eachClass) => css.includes(cssEscape(eachClass))))
  expect(fileCSSText).toContain(cssEscape('font:heavy'))
  expect(fileCSSText).toContain(cssEscape('font:48px'))
  expect(fileCSSText).toContain(cssEscape('bg:primary'))
  expect(fileCSSText).toContain(cssEscape('btn'))
})

it('change config file utilities and reset process', async () => {
  const nextConfigFilepath = configFilepath + '.next'
  await Promise.all([
    waitForWatchRestart(() => {
      fs.writeFileSync(nextConfigFilepath, originConfigText.replace('oklch(63.7% 0.237 25.331)', 'oklch(55.1% 0.027 264.364)'))
      fs.renameSync(nextConfigFilepath, configFilepath)
    }),
    waitForCSSContent((css) => css.includes('.btn{background-color:oklch(55.1% .027 264.364)'))
  ])
  const fileCSSText = await waitForCSSContent((css) => css.includes('.btn{background-color:oklch(55.1% .027 264.364)'))
  expect(fileCSSText).toContain('.btn{background-color:oklch(55.1% .027 264.364)')
})

it('change html file class attr and update', async () => {
  fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'underline'))
  const fileCSSText = await waitForCSSContent((css) => css.includes(cssEscape('underline')))
  expect(fileCSSText).toContain(cssEscape('underline'))
})

async function waitForOutput(doesMatch: (output: string) => boolean) {
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (doesMatch(subprocessOutput)) return subprocessOutput
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out waiting for process output.\n\nProcess output:\n${subprocessOutput}`)
}

/**
 * Guards watch mode against an entry the user breaks while it runs, such as one rewritten with
 * the removed `@master` at-rule: the restart closed every watcher and then crashed with a
 * stack trace, so fixing the file never recovered. It must print the one-line message, keep
 * running, and rebuild once the file is fixed. The message is the test's cue to save the fix, so
 * the CLI prints it only after the entry is watched again; printed earlier, a loaded machine
 * saved the fix before the watcher was armed and the test hung.
 * Reverse check: rethrowing `StylesheetEntryError` in `handlePlanChange` turns only this test
 * red; so does logging the error before `startWatchers` with a 500 ms stall at its top.
 */
it('reports an entry that turns invalid and recovers once it is fixed', async () => {
  const outputBefore = subprocessOutput.length
  fs.writeFileSync(configFilepath, '@master entry;\n')
  const output = (await waitForOutput((text) => text.slice(outputBefore).includes('@master entry; was removed'))).slice(outputBefore)
  expect(output).not.toMatch(/^\s+at /m)
  expect(subprocess.exitCode).toBeNull()

  const recoveredFrom = subprocessOutput.length
  fs.writeFileSync(configFilepath, originConfigText)
  await waitForOutput((text) => text.slice(recoveredFrom).includes('Restart watching source changes'))
  const fileCSSText = await waitForCSSContent((css) => css.includes('.btn{background-color:oklch(63.7% .237 25.331)'))
  expect(fileCSSText).toContain('.btn{background-color:oklch(63.7% .237 25.331)')
  expect(subprocess.exitCode).toBeNull()
})

afterAll(async () => {
  subprocess.kill()
  await subprocess.catch(() => undefined)
  fs.rmSync(workspacePath, { recursive: true, force: true })
})
