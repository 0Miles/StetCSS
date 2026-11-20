import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
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

/**
 * A Vue app whose `App.vue` has a plain block that composes a component and a scoped block that
 * `@reference`s the entry for a theme variable and composes `animate:fade`. It is a project of
 * its own: this package's `"sideEffects": false` would drop the style imports.
 */
const VUE_FIXTURE_FILES = {
  'package.json': '{ "private": true }',
  'src/index.js': [
    'import "./app.css"',
    'import { createApp } from "vue"',
    'import App from "./App.vue"',
    'createApp(App).mount("#app")',
    ''
  ].join('\n'),
  'src/app.css': [
    '@import "@stet-css/core";',
    '@theme { --color-probe: #123456; }',
    '@components { brand { background-color: #abcdef; } }',
    ''
  ].join('\n'),
  'src/App.vue': [
    '<template>',
    '  <p class="plain">plain</p>',
    '  <p class="probe">probe</p>',
    '</template>',
    '',
    '<style>',
    '.plain { @compose inline-flex brand; }',
    '</style>',
    '',
    '<style scoped>',
    '@reference "./app.css";',
    '.probe { color: var(--color-probe); @compose animate:fade; }',
    '</style>',
    ''
  ].join('\n'),
  // The shape of VuePress's markdown loader: it emits an SFC for vue-loader, left of it.
  'md-loader.cjs': 'module.exports = (source) => `<template><article>${source}</article></template>`\n'
}

function loadVueLoader() {
  return createRequire(join(packageDir, 'package.json'))('vue-loader') as typeof import('vue-loader')
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
      'shared/extra.css': '@import "@stet-css/core";\n@safelist \'p:0.5rem\';\n'
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
      expect(css).toMatch(/\.p\\:0\\\.5rem\s*\{/)
    } finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards #236 through vue-loader and Vue's real scoped style compiler, as users set it up
   * with `style-loader`: a `.vue` `<style>` block reaches the loader as
   * `App.vue?vue&type=style&…`, VueLoaderPlugin copies the rules present when it applies, and
   * a `pre` loader would see the whole `.vue` file. A plain block's `@compose` must apply; a
   * scoped block's referenced theme variable must sit on `:root` (as `[data-v-…]:root` it
   * matches nothing) and its composed animation must name keyframes `fade-<scope id>` that
   * exist, as with Vite (#189). Both orders of the two plugins.
   * Reverse check: installing the rules at `apply` instead of on `initialize` turns only the
   * StetCSSPlugin-first case red; leaving out the `.vue` block rule, or appending it after
   * vue-loader's rule, turns both red; so does handing the loader's transform `resourcePath`
   * alone.
   */
  it.each(['VueLoaderPlugin first', 'StetCSSPlugin first'])('lowers @compose and @reference in .vue style blocks (%s)', async (order) => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const { VueLoaderPlugin } = loadVueLoader()
    const root = createFixture('vue', VUE_FIXTURE_FILES)
    const dist = join(root, 'dist')
    const plugins = [new VueLoaderPlugin(), new StetCSSPlugin({}, root)]
    let browser: Browser | undefined
    let server: Server | undefined

    try {
      await runWebpack(webpackModule, {
        mode: 'production',
        context: root,
        entry: './src/index.js',
        output: { path: dist, filename: '[name].js' },
        module: {
          rules: [
            { test: /\.vue$/, loader: 'vue-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] }
          ]
        },
        plugins: order === 'VueLoaderPlugin first' ? plugins : plugins.reverse()
      })
      writeFileSync(join(dist, 'index.html'), '<!doctype html><div id="app"></div><script src="./main.js"></script>\n')

      const served = await serveDirectory(dist)
      server = served.server
      browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(served.url)
      await page.waitForSelector('.probe')
      const result = await page.evaluate(() => {
        const plain = getComputedStyle(document.querySelector('.plain')!)
        const probeElement = document.querySelector('.probe')!
        const probe = getComputedStyle(probeElement)
        const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules])
        const flatten = (list: CSSRule[]): CSSRule[] => list.flatMap((rule) => [
          rule,
          ...'cssRules' in rule && !(rule instanceof CSSKeyframesRule) ? flatten([...(rule as CSSGroupingRule).cssRules]) : []
        ])
        const allRules = flatten(rules)
        return {
          plain: { display: plain.display, backgroundColor: plain.backgroundColor },
          probe: { color: probe.color, animationName: probe.animationName },
          scopeId: [...probeElement.attributes].find((attribute) => attribute.name.startsWith('data-v-'))?.name.slice('data-v-'.length),
          keyframes: allRules.filter((rule) => rule instanceof CSSKeyframesRule).map((rule) => (rule as CSSKeyframesRule).name),
          scopedRoot: allRules.some((rule) => rule instanceof CSSStyleRule && /\[data-v-[^\]]+\]:root/.test(rule.selectorText)),
          directives: [...document.querySelectorAll('style')].some((style) => /@(?:compose|reference)\b/.test(style.textContent || ''))
        }
      })

      expect(result.scopeId).toBeTruthy()
      expect(result).toEqual({
        plain: { display: 'inline-flex', backgroundColor: 'rgb(171, 205, 239)' },
        probe: { color: 'rgb(18, 52, 86)', animationName: `fade-${result.scopeId}` },
        scopeId: result.scopeId,
        keyframes: expect.arrayContaining([`fade-${result.scopeId}`]),
        scopedRoot: false,
        directives: false
      })
    } finally {
      await browser?.close()
      await new Promise<void>((resolve) => server?.close(() => resolve()) ?? resolve())
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards the other vue-loader setups #236 must survive, by the CSS the bundle ships (the
   * browser test above shows that CSS works):
   * - `experimentalInlineMatchResource` (which vue-loader requires with `experiments.css`)
   *   names a block `App.vue.css?vue&type=style&…`, so the `pre` rule matches it before
   *   vue-loader extracts it and the `.vue` block rule must match that form too;
   * - a second rule through vue-loader, such as VuePress's `.md` one, before or after the
   *   css rule: the block rule must go before the rule that hands `.vue` files to vue-loader,
   *   after every copy VueLoaderPlugin makes, not before the first rule naming vue-loader;
   * - two `.vue` rules split by `include`: VueLoaderPlugin takes the first, so the block rule
   *   goes before it, not the last;
   * - a `.vue` rule whose `test` is a function or an array.
   * Reverse check: letting the `pre` rule lower a `.vue` file turns the three inline cases red
   * ("Invalid empty selector"); dropping the match-resource form from the block rule's test
   * leaves `@compose` in them; splicing before the first rule naming vue-loader turns the two
   * cases with the `.md` rule before the css rule red; `findLastIndex` turns the `include` case
   * red; a function condition that never matches, or an array condition that needs every
   * item, turns the function or array case red.
   */
  it.each([
    { name: 'inline match resource, VueLoaderPlugin first', order: 'vue', inline: true, layout: ['vue', 'css'] },
    { name: 'inline match resource, StetCSSPlugin first', order: 'stet', inline: true, layout: ['vue', 'css'] },
    { name: 'inline match resource with experiments.css', order: 'vue', inline: true, experimentsCSS: true, layout: ['vue', 'css'] },
    { name: 'a vue-loader .md rule after the css rule', order: 'vue', layout: ['vue', 'css', 'md'] },
    { name: 'a vue-loader .md rule before the css rule', order: 'vue', layout: ['vue', 'md', 'css'] },
    { name: 'a vue-loader .md rule first', order: 'stet', layout: ['md', 'vue', 'css'] },
    { name: 'two .vue rules split by include', order: 'vue', layout: ['vue in src', 'css', 'vue elsewhere'] },
    { name: 'a .vue rule with a function test', order: 'vue', layout: ['vue by function', 'css'] },
    { name: 'a .vue rule with an array test', order: 'stet', layout: ['vue by array', 'css'] }
  ] as const)('lowers .vue style blocks with $name', async ({ order, layout, ...setup }) => {
    const inline = 'inline' in setup && setup.inline
    const experimentsCSS = 'experimentsCSS' in setup && setup.experimentsCSS
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const { VueLoaderPlugin } = loadVueLoader()
    const root = createFixture('vue-setup', VUE_FIXTURE_FILES)
    const dist = join(root, 'dist')
    const rules = {
      vue: { test: /\.vue$/, loader: 'vue-loader', options: inline ? { experimentalInlineMatchResource: true } : {} },
      css: experimentsCSS
        ? { test: /\.css$/, type: 'css' }
        : { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      md: { test: /\.md$/, use: ['vue-loader', join(root, 'md-loader.cjs')] },
      'vue in src': { test: /\.vue$/, include: join(root, 'src'), loader: 'vue-loader' },
      'vue elsewhere': { test: /\.vue$/, include: join(root, 'elsewhere'), loader: 'vue-loader' },
      'vue by function': { test: (file: string) => file.endsWith('.vue'), loader: 'vue-loader' },
      'vue by array': { test: [/\.vue\.html$/, /\.vue$/], loader: 'vue-loader' }
    }
    const plugins = [new VueLoaderPlugin(), new StetCSSPlugin({}, root)]

    try {
      await runWebpack(webpackModule, {
        mode: 'development',
        devtool: false,
        context: root,
        entry: './src/index.js',
        experiments: experimentsCSS ? { css: true } : undefined,
        output: { path: dist, filename: '[name].js', cssFilename: '[name].css' },
        module: { rules: layout.map((name) => rules[name]) },
        plugins: order === 'vue' ? plugins : plugins.reverse()
      })

      const output = readOutput(dist, '.js') + readOutput(dist, '.css')
      const scopeId = output.match(/\.probe\[data-v-([0-9a-f]+)\]/)?.[1]
      expect(scopeId).toBeTruthy()
      expect(output).toContain('.plain{background-color:#abcdef;display:inline-flex}')
      expect(output).toContain(`.probe[data-v-${scopeId}]{color:var(--color-probe);animation:var(--animate-fade)}`)
      expect(output).toContain(`:root{--color-probe:#123456;--animate-fade:fade-${scopeId} 1s infinite}`)
      expect(output).toContain(`@keyframes fade-${scopeId}{`)
      expect(output).not.toMatch(/@(?:compose|reference)\b/)
      expect(output).not.toMatch(/\[data-v-[^\]]+\]:root/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards a plugin applied after `webpack()` created the compiler, as webpack's Node API
   * allows: it misses `initialize`, so its rules go in before the first build instead, or the
   * entry ships StetCSS's package CSS and no utilities, silently.
   * Reverse check: installing the rules on `initialize` alone turns only this test red.
   */
  it('installs its rules when applied after webpack() created the compiler', async () => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const root = createFixture('late', {
      'src/index.js': 'import "./app.css"\n',
      'src/app.css': '@import "@stet-css/core";\n',
      'src/template.html': '<main class="block fg:red"></main>\n'
    })
    const compiler = webpackModule({
      mode: 'production',
      context: root,
      entry: './src/index.js',
      ...extractedCSSConfig,
      output: { path: join(root, 'dist'), filename: '[name].js', cssFilename: '[name].css' }
    })
    new StetCSSPlugin({}, root).apply(compiler)

    try {
      await new Promise<void>((resolve, reject) => {
        compiler.run((error, stats) => {
          compiler.close(() => {
            if (error) reject(error)
            else if (stats?.hasErrors()) reject(new Error(stats.toString({ all: false, errors: true })))
            else resolve()
          })
        })
      })

      const css = readOutput(join(root, 'dist'), '.css')
      expect(css).toMatch(/\.block\s*\{\s*display:\s*block/)
      expect(css).toMatch(/\.fg\\:red\s*\{\s*color:/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)

  /**
   * Guards a plugin applied after `webpack()` and then watched: a watch build fires no
   * `beforeRun`, so the rules go in on `watchRun`, and only once though every rebuild fires it;
   * a second install would run the loader again on every stylesheet, more on each rebuild.
   * Reverse check: dropping the `watchRun` tap leaves `@compose` in the CSS; dropping the
   * installed check grows the rule count with each rebuild. The first turns only this test
   * red, the second also the install-once case in `plugin.test.ts`.
   */
  it('installs its rules once when applied after webpack() and watched', async () => {
    const StetCSSPlugin = await importPlugin()
    const { default: webpackModule } = await import('webpack')
    const root = createFixture('late-watch', {
      'src/index.js': 'import "./app.css"\nimport "./button.css"\n',
      'src/app.css': '@import "@stet-css/core";\n',
      'src/button.css': '.button { @compose block; }\n'
    })
    const output = join(root, 'www')
    const compiler = webpackModule({
      mode: 'development',
      devtool: false,
      context: root,
      entry: './src/index.js',
      ...extractedCSSConfig,
      output: { path: output, filename: '[name].js', cssFilename: '[name].css' }
    })
    new StetCSSPlugin({}, root).apply(compiler)
    const isStyleLoaderRule = (rule: unknown) => Boolean(
      (rule as { use?: { loader?: string }[] } | undefined)?.use?.[0]?.loader?.includes('style-css-loader')
    )
    const styleLoaderRuleCounts: number[] = []
    let failure: Error | undefined
    const watching = compiler.watch({ aggregateTimeout: 300 }, (error, stats) => {
      if (error || stats?.hasErrors()) {
        failure = error || new Error(stats!.toString({ all: false, errors: true }))
      }
      styleLoaderRuleCounts.push(compiler.options.module.rules.filter(isStyleLoaderRule).length)
    })

    try {
      await waitFor(() => styleLoaderRuleCounts.length >= 1, 60000)
      expect(failure).toBeUndefined()
      expect(readOutput(output, '.css')).toMatch(/\.button\s*\{\s*display:\s*block/)

      for (const [edit, utility] of ['flex', 'grid'].entries()) {
        writeFileSync(join(root, 'src/button.css'), `.button { @compose ${utility}; }\n`)
        await waitFor(() => styleLoaderRuleCounts.length >= edit + 2, 60000)
      }

      expect(failure).toBeUndefined()
      const css = readOutput(output, '.css')
      expect(css).toMatch(/\.button\s*\{\s*display:\s*grid/)
      expect(css).not.toContain('@compose')
      expect(styleLoaderRuleCounts).toEqual(styleLoaderRuleCounts.map(() => 1))
    } finally {
      await new Promise<void>((resolve) => watching ? watching.close(() => resolve()) : resolve())
      rmSync(root, { recursive: true, force: true })
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

      writeFileSync(join(root, 'src/template.html'), '<main class="block m:1rem"></main>\n')

      expect(await settle()).toBe(initialBuilds + 1)
      expect(failure).toBeUndefined()
      expect(readOutput(output, '.css')).toMatch(/\.m\\:1rem\s*\{/)

      writeFileSync(join(root, 'src/index.js'), 'import "./app.css"\ndocument.body.className = "p:0.5rem"\n')

      expect(await settle()).toBe(initialBuilds + 2)
      expect(failure).toBeUndefined()
      expect(readOutput(output, '.css')).toMatch(/\.p\\:0\\\.5rem\s*\{/)
    } finally {
      await new Promise<void>((resolve) => watching ? watching.close(() => resolve()) : resolve())
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)
})
