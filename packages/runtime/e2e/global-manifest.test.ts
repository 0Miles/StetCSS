import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { dirname, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')
const packageJSON = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as Record<string, unknown>

/**
 * Simulates the npm CDN layouts on a local server: the package is served file by
 * file, so only `dist/global.min.js` exists at the script URL, with no manifest beside it.
 * - jsDelivr serves the file named by the `jsdelivr` field at the bare package URL.
 * - unpkg redirects the bare package URL to the file named by the `unpkg` field.
 * (A local server rather than `page.route`: Firefox does not route the request a fulfilled redirect leads to.)
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

let server: Server
let origin: string
let requests: string[] = []

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const path = new URL(request.url || '/', 'http://localhost').pathname
    requests.push(path)
    for (const cdn of Object.keys(CDN_PACKAGE_PATHS) as CDNName[]) {
      const packagePath = CDN_PACKAGE_PATHS[cdn]
      if (path === packagePath && cdn === 'unpkg') {
        response.writeHead(302, { location: `${packagePath}/${resolveEntryPath(cdn)}` })
        response.end()
        return
      }
      const filePath = path === packagePath
        ? resolveEntryPath(cdn)
        : path.startsWith(`${packagePath}/`) ? path.slice(packagePath.length + 1) : undefined
      if (filePath === 'dist/global.min.js') {
        response.writeHead(200, { 'content-type': 'text/javascript' })
        response.end(readFileSync(resolve(packageRoot, 'dist/global.min.js')))
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

function collectConsoleProblems(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      messages.push(message.text())
    }
  })
  page.on('pageerror', (error) => messages.push(error.message))
  return messages
}

const layouts: { name: string, cdn: CDNName, short: boolean }[] = [
  { name: 'jsDelivr full path', cdn: 'jsdelivr', short: false },
  { name: 'jsDelivr short URL', cdn: 'jsdelivr', short: true },
  { name: 'unpkg full path', cdn: 'unpkg', short: false },
  { name: 'unpkg short URL', cdn: 'unpkg', short: true }
]

for (const { name, cdn, short } of layouts) {
  test(`starts from the ${name} without fetching a manifest`, async ({ page }) => {
    const packagePath = CDN_PACKAGE_PATHS[cdn]
    const scriptPath = short ? packagePath : `${packagePath}/dist/global.min.js`
    const consoleProblems = collectConsoleProblems(page)

    await page.setContent(`
      <!doctype html>
      <html hidden>
      <head>
        <script src="${origin}${scriptPath}"></script>
      </head>
      <body><div class="fg:red font:bold"></div></body>
      </html>
    `)
    await page.waitForFunction(() => !!globalThis.masterCSSRuntime?.observing)
    await expect.poll(() => page.evaluate(() => globalThis.masterCSSRuntime.text)).toContain('.fg\\:red{color:var(--color-red)}')

    expect(await page.evaluate(() => globalThis.masterCSSRuntime.text)).toContain('.font\\:bold{font-weight:var(--font-weight-bold)}')
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
    expect(await page.evaluate(() => document.documentElement.hasAttribute('hidden'))).toBe(false)
    expect(requests.filter((path) => path !== scriptPath && path !== `${packagePath}/dist/global.min.js`)).toEqual([])
    expect(consoleProblems).toEqual([])
  })
}

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
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
})
