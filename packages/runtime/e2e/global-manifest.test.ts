import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { dirname, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')
const packageJSON = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as Record<string, unknown>

/**
 * Simulates the npm CDN layouts on a local server. The package is served file by
 * file from `dist`, which holds no `default-manifest.json`, so nothing sits beside the script.
 * - jsDelivr serves the file named by the `jsdelivr` field at the bare package URL.
 * - unpkg redirects the bare package URL to the file named by the `unpkg` field.
 * A local server rather than `page.route`: Firefox does not route the request a fulfilled redirect leads to.
 */
const CDN_PACKAGE_PATHS = {
  jsdelivr: '/jsdelivr/npm/@stet-css/runtime@0.0.0',
  unpkg: '/unpkg/@stet-css/runtime@0.0.0'
} as const

type CDNName = keyof typeof CDN_PACKAGE_PATHS

function resolveEntryPath(cdn: CDNName) {
  const entry = packageJSON[cdn]
  if (typeof entry !== 'string') throw new Error(`package.json has no "${cdn}" field.`)
  return posix.normalize(entry)
}

function resolvePackageFile(cdn: CDNName, path: string) {
  const packagePath = CDN_PACKAGE_PATHS[cdn]
  if (path === packagePath) return resolveEntryPath(cdn)
  if (path.startsWith(`${packagePath}/`)) return path.slice(packagePath.length + 1)
}

let server: Server
let origin: string
let requests: string[] = []

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const path = new URL(request.url || '/', 'http://localhost').pathname
    requests.push(path)
    for (const cdn of Object.keys(CDN_PACKAGE_PATHS) as CDNName[]) {
      if (path === CDN_PACKAGE_PATHS[cdn] && cdn === 'unpkg') {
        response.writeHead(302, { location: `${path}/${resolveEntryPath(cdn)}` })
        response.end()
        return
      }
      const filePath = resolvePackageFile(cdn, path)
      if (filePath?.startsWith('dist/') && existsSync(resolve(packageRoot, filePath))) {
        response.writeHead(200, { 'content-type': 'text/javascript' })
        response.end(readFileSync(resolve(packageRoot, filePath)))
        return
      }
    }
    response.writeHead(404)
    response.end('Not found')
  })
  await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  await new Promise((resolveClose) => server.close(resolveClose))
})

test.beforeEach(() => {
  requests = []
})

function renderPage(scriptPath: string) {
  return `
    <!doctype html>
    <html hidden>
    <head>
      <script src="${origin}${scriptPath}"></script>
    </head>
    <body><div class="font:bold"></div></body>
    </html>
  `
}

/**
 * Guards: a developer loading the runtime with one `<script>` from an npm CDN gets
 * rules, and the script requests nothing else (no manifest beside it, no JSON module).
 * The short URLs also guard the `jsdelivr` and `unpkg` package.json fields: the server
 * serves whatever file a field names, so a wrong field fails here.
 * Trade-off: both full-path cases run the same server branch; they stay to mirror the
 * real-CDN matrix in #97.
 * Reverse check: the pre-#88 `global.min.js` (imports `default-manifest.json` beside the
 * script) never starts, so all four go red, and so do the two tests below, which need a started runtime;
 * `unpkg` pointing at `./dist/index.js` turns only the unpkg short URL red.
 */
for (const { name, cdn, short } of [
  { name: 'jsDelivr full path', cdn: 'jsdelivr', short: false },
  { name: 'jsDelivr short URL', cdn: 'jsdelivr', short: true },
  { name: 'unpkg full path', cdn: 'unpkg', short: false },
  { name: 'unpkg short URL', cdn: 'unpkg', short: true }
] as const) {
  test(`starts from the ${name} without requesting a manifest`, async ({ page }) => {
    const packagePath = CDN_PACKAGE_PATHS[cdn]
    const scriptPath = short ? packagePath : `${packagePath}/dist/global.min.js`

    await page.setContent(renderPage(scriptPath))
    await expect.poll(() => page.evaluate(() => globalThis.masterCSSRuntime?.text))
      .toContain('.font\\:bold{font-weight:var(--font-weight-bold)}')

    expect(requests.filter((path) => path !== scriptPath && path !== `${packagePath}/${resolveEntryPath(cdn)}`)).toEqual([])
  })
}

/**
 * Guards FOUC on the CDN path: the bundle now starts while `<head>` is still parsing,
 * before `<body>` exists, and must still remove `hidden` from `<html>`.
 * Reverse check: making `revealHostIfNeeded` a no-op turns this red and leaves the layout cases green.
 */
test('reveals the page when started from a head script', async ({ page }) => {
  await page.setContent(renderPage(`${CDN_PACKAGE_PATHS.jsdelivr}/dist/global.min.js`))
  await page.waitForFunction(() => !!globalThis.masterCSSRuntime?.observing)

  expect(await page.evaluate(() => document.documentElement.hasAttribute('hidden'))).toBe(false)
})

/**
 * Guards: the CDN bundle uses only its embedded default manifest; a page global named
 * `masterCSSManifest` cannot replace the design tokens.
 * Reverse check: none run in #88; this behaviour predates it and the test only moved to the npm CDN layout.
 */
test('ignores global manifest override', async ({ page }) => {
  const manifest = {
    version: 1,
    variables: [
      { name: 'primary', key: 'primary', type: 'string', value: '#000000' }
    ]
  } as const
  await page.evaluate(({ manifest }) => {
    (globalThis as typeof globalThis & { masterCSSManifest?: unknown }).masterCSSManifest = manifest
  }, { manifest })
  await page.addScriptTag({ url: `${origin}${CDN_PACKAGE_PATHS.jsdelivr}/dist/global.min.js` })
  await page.waitForFunction(() => !!globalThis.masterCSSRuntime?.observing)

  expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('primary'))).toBeUndefined()
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('font-weight-bold'))).toBeDefined()
})
