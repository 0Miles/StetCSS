import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from '@playwright/test'
import { describe, expect, it } from 'vitest'
import type webpack from 'webpack'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const exampleDir = join(packageDir, '../../examples/webpack')
const tmpDir = join(packageDir, 'tests/.tmp')
let built = false

function buildPackage() {
  if (built) return
  execFileSync('bun', ['run', 'build'], {
    cwd: packageDir,
    env: {
      ...process.env,
      CI: 'true'
    },
    shell: process.platform === 'win32',
    stdio: 'pipe',
    timeout: 120000
  })
  built = true
}

async function importPlugin() {
  buildPackage()
  return (await import(`${pathToFileURL(join(packageDir, 'dist/index.js')).href}?${Date.now()}`)).default
}

/**
 * Fixtures live inside the package so `@stet-css/core` resolves from them. Their files are
 * dated a minute back: a watcher started right after writing them would otherwise see them
 * as changed and rebuild once more.
 */
function createFixture(prefix: string, files: Record<string, string>) {
  mkdirSync(tmpDir, { recursive: true })
  const root = mkdtempSync(join(tmpDir, `${prefix}-`))
  const past = new Date(Date.now() - 60000)
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content)
    utimesSync(join(root, file), past, past)
  }
  return root
}

/** Native CSS stands in for an extraction plugin: it emits the CSS as its own asset. */
const extractedCSSConfig = {
  experiments: { css: true },
  module: { rules: [{ test: /\.css$/, sideEffects: true }] }
} satisfies webpack.Configuration

function runWebpack(webpackModule: typeof webpack, config: webpack.Configuration) {
  return new Promise<void>((resolve, reject) => {
    webpackModule(config, (error, stats) => {
      if (error) {
        reject(error)
        return
      }
      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ all: false, errors: true })))
        return
      }
      resolve()
    })
  })
}

function readOutput(root: string, extension: string): string {
  if (!existsSync(root)) return ''
  return readdirSync(root, { withFileTypes: true }).map((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return readOutput(path, extension)
    return extname(entry.name) === extension ? readFileSync(path, 'utf-8') : ''
  }).join('\n')
}

function getContentType(pathname: string) {
  switch (extname(pathname)) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

function serveDirectory(root: string) {
  const server = createServer(async (request, response) => {
    const requestURL = new URL(request.url || '/', 'http://127.0.0.1')
    const pathname = requestURL.pathname === '/' ? '/index.html' : requestURL.pathname
    const filePath = normalize(join(root, pathname))
    if (relative(root, filePath).startsWith('..')) {
      response.statusCode = 403
      response.end()
      return
    }
    try {
      response.setHeader('Content-Type', getContentType(filePath))
      response.end(await readFile(filePath))
    } catch {
      response.statusCode = 404
      response.end()
    }
  })

  return new Promise<{ server: Server, url: string }>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to start test server.'))
        return
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}`
      })
    })
  })
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(condition: () => boolean, timeout: number) {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start > timeout) throw new Error('Timed out waiting for webpack.')
    await wait(50)
  }
}

describe('Webpack static CSS', () => {
  /**
   * Guards the default setup users copy, `style-loader` with no plugin option: the utilities
   * travel inside the JS bundle, so CSS generated after webpack built the virtual module, or
   * patched into `.css` assets only, ships a page with no utilities and a leftover slot rule.
   * Reverse check: writing an empty virtual CSS module before the compilation turns all three
   * tests here red, as each asserts the CSS it ships.
   */
  it('ships utilities in the examples/webpack production page with style-loader', async () => {
    buildPackage()
    mkdirSync(tmpDir, { recursive: true })
    const dist = mkdtempSync(join(tmpDir, 'example-dist-'))
    let browser: Browser | undefined
    let server: Server | undefined

    try {
      // The example's own build script, in its own directory, as a user runs it.
      execFileSync('bun', ['run', 'build', '--output-path', dist], {
        cwd: exampleDir,
        shell: process.platform === 'win32',
        stdio: 'pipe',
        timeout: 120000
      })

      const js = readOutput(dist, '.js')
      expect(js).not.toContain('stet-css-slot')
      expect(js).toContain('.abs{position:absolute}')

      const served = await serveDirectory(dist)
      server = served.server
      browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(served.url)
      await page.waitForSelector('h1')
      expect(await page.evaluate(() => ({
        position: getComputedStyle(document.querySelector('.abs')!).position,
        slot: Boolean(document.getElementById('stet-css-slot')) || [...document.styleSheets]
          .some((sheet) => [...sheet.cssRules].some((rule) => rule.cssText.includes('stet-css-slot')))
      }))).toEqual({ position: 'absolute', slot: false })
    } finally {
      await browser?.close()
      await new Promise<void>((resolve) => server?.close(() => resolve()) ?? resolve())
      rmSync(dist, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards CSS extraction: the CSS asset must carry the project's utilities, including a
   * class only a file no module imports uses, and no slot rule.
   * Reverse check: limiting the class set's `sources` to the fixture's JS files turns
   * all three tests here red, as each needs a class from a file no JS module holds.
   */
  it('ships utilities in the extracted CSS asset', async () => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const root = createFixture('extract', {
      'src/index.js': 'import "./app.css"\ndocument.body.className = "block"\n',
      'src/app.css': '@import "@stet-css/core";\n',
      'src/template.html': '<main class="fg:red"></main>\n'
    })

    try {
      await runWebpack(webpackModule, {
        mode: 'production',
        context: root,
        entry: './src/index.js',
        ...extractedCSSConfig,
        output: { path: join(root, 'dist'), filename: '[name].js', cssFilename: '[name].css' },
        plugins: [new StetCSSPlugin({}, root)]
      })

      const css = readOutput(join(root, 'dist'), '.css')
      expect(css).not.toContain('stet-css-slot')
      expect(css).toMatch(/\.block\s*\{\s*display:\s*block/)
      expect(css).toMatch(/\.fg\\:red\s*\{\s*color:/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards that custom `adapters` reach the class set of a real webpack build: a project whose
   * templates only its adapter can read would otherwise ship without those rules.
   * Reverse check: creating the scanner with `{}` in `src/plugin.ts` turns only this test red.
   */
  it('ships the classes custom adapters find', async () => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const root = createFixture('adapters', {
      'src/index.js': 'import "./app.css"\n',
      'src/app.css': '@import "@stet-css/core";\n',
      'adapter-probe.md': 'Read only by the custom adapter.\n'
    })

    try {
      await runWebpack(webpackModule, {
        mode: 'production',
        context: root,
        entry: './src/index.js',
        ...extractedCSSConfig,
        output: { path: join(root, 'dist'), filename: '[name].js', cssFilename: '[name].css' },
        plugins: [new StetCSSPlugin({
          adapters: [{
            // Finds a class no built-in adapter can: the class is in the adapter, not in the file.
            name: 'probe',
            test: /adapter-probe\.md$/,
            extract: async () => ['m:13px']
          }]
        }, root)]
      })

      expect(readOutput(join(root, 'dist'), '.css')).toMatch(/\.m\\:13px\s*\{\s*margin:\s*13px/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards entries other than a `.css` file in the project root: a Sass entry and an entry
   * the app imports from outside the root must keep their `@theme` and `@safelist`, or users
   * silently get the default theme and lose forced classes. Sass is stubbed in the fixture:
   * it is the project's own dependency.
   * Reverse check: registering only discovered `.css` entries (no `extensions`, no entries
   * the style loader reports) turns only this test red; so does skipping the rebuild of a
   * generated CSS module built before the outside entry was reported.
   */
  it('keeps the directives of Sass entries and of entries outside the project root', async () => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const workspace = createFixture('entries', {
      'app/package.json': '{ "private": true }',
      'app/node_modules/sass/package.json': '{ "name": "sass", "main": "index.js" }',
      // Stands in for Sass on this one file: drops the variable declaration, inlines its value.
      'app/node_modules/sass/index.js': 'exports.compileStringAsync = async (source) => ({ css: source.split("$brand: #123456;").join("").split("$brand").join("#123456") })\n',
      'app/src/index.js': 'import "./app.scss"\nimport "../../shared/extra.css"\n',
      'app/src/app.scss': '$brand: #123456;\n@import "@stet-css/core";\n@theme { --color-brand: $brand; }\n',
      'app/src/template.html': '<main class="fg:brand"></main>\n',
      'shared/extra.css': '@import "@stet-css/core";\n@safelist \'p:2x\';\n'
    })
    const root = join(workspace, 'app')

    try {
      await runWebpack(webpackModule, {
        mode: 'production',
        context: root,
        entry: './src/index.js',
        experiments: { css: true },
        module: { rules: [{ test: /\.(css|scss)$/, type: 'css', sideEffects: true }] },
        output: { path: join(root, 'dist'), filename: '[name].js', cssFilename: '[name].css' },
        plugins: [new StetCSSPlugin({}, root)]
      })

      const css = readOutput(join(root, 'dist'), '.css')
      expect(css).toMatch(/--color-brand:\s*#123456/)
      expect(css).toMatch(/\.fg\\:brand\s*\{/)
      expect(css).toMatch(/\.p\\:2x\s*\{/)
    } finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards watch mode: an edit must rebuild exactly once and carry the new class of a file no
   * module imports, and the emitted bundle, written under the project root under a directory
   * name the built-in exclusions do not know, must not start another rebuild. The second
   * edit touches the entry module so the emitted `main.js` changes.
   * Reverse check: dropping the output directory from the class set's `ignorePaths` turns
   * only this test red.
   */
  it('rebuilds once per source edit and never on its own output', async () => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const root = createFixture('watch', {
      'src/index.js': 'import "./app.css"\n',
      'src/app.css': '@import "@stet-css/core";\n',
      'src/template.html': '<main class="block"></main>\n'
    })
    const output = join(root, 'www')
    const compiler = webpackModule({
      mode: 'development',
      devtool: false,
      context: root,
      entry: './src/index.js',
      ...extractedCSSConfig,
      output: { path: output, filename: '[name].js', cssFilename: '[name].css' },
      plugins: [new StetCSSPlugin({}, root)]
    })
    let builds = 0
    let failure: Error | undefined
    const watching = compiler.watch({ aggregateTimeout: 300 }, (error, stats) => {
      if (error || stats?.hasErrors()) {
        failure = error || new Error(stats!.toString({ all: false, errors: true }))
      }
      builds++
    })
    // Waits until no build has started for a while and returns the build count. A build of
    // the package just before this test can add one start-up rebuild; a loop never settles.
    const settle = async () => {
      let count = -1
      while (count !== builds) {
        count = builds
        await wait(2500)
      }
      return count
    }

    try {
      await waitFor(() => builds >= 1, 60000)
      const initialBuilds = await settle()
      expect(failure).toBeUndefined()
      expect(readOutput(output, '.css')).toMatch(/\.block\s*\{/)

      writeFileSync(join(root, 'src/template.html'), '<main class="block m:4x"></main>\n')

      expect(await settle()).toBe(initialBuilds + 1)
      expect(failure).toBeUndefined()
      expect(readOutput(output, '.css')).toMatch(/\.m\\:4x\s*\{/)

      writeFileSync(join(root, 'src/index.js'), 'import "./app.css"\ndocument.body.className = "p:2x"\n')

      expect(await settle()).toBe(initialBuilds + 2)
      expect(failure).toBeUndefined()
      expect(readOutput(output, '.css')).toMatch(/\.p\\:2x\s*\{/)
    } finally {
      await new Promise<void>((resolve) => watching ? watching.close(() => resolve()) : resolve())
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)
})
