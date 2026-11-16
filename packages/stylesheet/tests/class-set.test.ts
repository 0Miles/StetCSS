import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import CSSScanner from '@stet-css/scanner'
import { cssEscape } from '@stet-css/lexer'
import {
  createExtractedCSS,
  isStylesheetSourceFile,
  registerStyleCSSSource,
  resolveStylesheetSourceFiles,
  type StyleCSSSources
} from '../src'

const roots: string[] = []

function createProject(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-stylesheet-class-set-'))
  roots.push(root)
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content)
  }
  return root
}

/** Registers `src/index.css` and extracts the CSS of the project's class set, as a static build does. */
async function extract(root: string, entry: string) {
  const scanner = new CSSScanner({}, root)
  await scanner.init()
  const styleCSSSources: StyleCSSSources = new Map()
  writeFileSync(join(root, 'src/index.css'), entry)
  await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), entry, { projectDir: root })
  return createExtractedCSS({ scanner, styleCSSSources, projectDir: root })
}

function rule(className: string) {
  return '.' + cssEscape(className) + '{'
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('static class set', () => {
  /**
   * Guards that static CSS comes from the project's files, not from whichever modules a
   * bundler happened to compile: a template that only an SSR build or a `client:only`
   * island reads must still get its rules. Files go through their format's adapter: the
   * Svelte `class:block` directive is the sample plain text extraction cannot read.
   * Reverse check: extracting every file as plain text instead of through its adapter turns
   * only this test red.
   */
  it('includes classes from Astro, Svelte and Vue files that no module imports', async () => {
    const root = createProject({
      'src/pages/index.astro': '---\nconst title = "Home"\n---\n<h1 class="font:heavy">{title}</h1>',
      'src/components/Card.svelte': '<div class:block={open} class="m:4x"></div>',
      'src/components/Panel.vue': '<template><div :class="[\'p:2x\']"></div></template>'
    })

    const css = await extract(root, '@import "@stet-css/core";')

    expect(css).toContain(rule('font:heavy'))
    expect(css).toContain(rule('block'))
    expect(css).toContain(rule('m:4x'))
    expect(css).toContain(rule('p:2x'))
  })

  /**
   * Guards the built-in exclusions and their only override: dependencies and build output
   * must not leak classes into the CSS, yet a component library in `node_modules` or a
   * prebuilt `dist` must be reachable by naming it with `@source`, even though the
   * directory is excluded by default. `@source` naming the package directory is the form
   * users write for a component library.
   * Reverse check: dropping the `@source` files from a scope's file list turns this test and
   * the other three `@source` tests red (server templates and the CSS root test in `directives.test.ts`,
   * the per-path test).
   */
  it('skips dependency and build output directories unless @source names them', async () => {
    const files = {
      'src/app.tsx': 'export const App = () => <main class="block"></main>',
      'node_modules/ui-kit/index.js': 'export const button = "m:4x"',
      'dist/index.html': '<div class="p:2x"></div>',
      'build/index.html': '<div class="font:heavy"></div>'
    }

    const defaultCSS = await extract(createProject(files), '@import "@stet-css/core";')

    expect(defaultCSS).toContain(rule('block'))
    expect(defaultCSS).not.toContain(rule('m:4x'))
    expect(defaultCSS).not.toContain(rule('p:2x'))
    expect(defaultCSS).not.toContain(rule('font:heavy'))

    const sourcedCSS = await extract(createProject(files), `
      @import "@stet-css/core";
      @source '../node_modules/ui-kit';
      @source '../dist/**/*.html';
      @source '../build/**/*.html';
    `)

    expect(sourcedCSS).toContain(rule('m:4x'))
    expect(sourcedCSS).toContain(rule('p:2x'))
    expect(sourcedCSS).toContain(rule('font:heavy'))
  })

  /**
   * Guards that `@source not` removes a project file from the class set, so a fixture or
   * legacy template the user opted out of does not add rules.
   * Reverse check: skipping the `@source not` filter on listed files turns every `@source not`
   * test red: this one, two in `directives.test.ts`, the native CSS test, the multi-entry
   * test, the per-path test, and the CLI and `inspect` tests.
   */
  it('drops classes from files excluded with @source not', async () => {
    const root = createProject({
      'src/app.tsx': 'export const App = () => <main class="block"></main>',
      'src/legacy/page.html': '<div class="m:4x"></div>',
      'src/stories/card.stories.tsx': 'export default { args: { className: "p:2x" } }'
    })

    const css = await extract(root, `
      @import "@stet-css/core";
      @source not './legacy';
      @source not './**/*.stories.tsx';
    `)

    expect(css).toContain(rule('block'))
    expect(css).not.toContain(rule('m:4x'))
    expect(css).not.toContain(rule('p:2x'))
  })

  /**
   * Guards that `@blocklist` removes a class the project's files use, and that `@safelist`
   * classes are generated with no file using them.
   * Reverse check: returning the scope's classes without the `@blocklist` filter turns this test,
   * the multi-entry test and the imported-directives test in `directives.test.ts` red.
   */
  it('blocks @blocklist classes and always generates @safelist', async () => {
    const root = createProject({
      'src/app.tsx': 'export const App = () => <main class="fg:red block"></main>'
    })

    const css = await extract(root, `
      @import "@stet-css/core";
      @blocklist 'fg:red';
      @safelist 'p:2x';
    `)

    expect(css).not.toContain(rule('fg:red'))
    expect(css).toContain(rule('block'))
    expect(css).toContain(rule('p:2x'))
  })

  /**
   * Guards that the class set is the only source of generated classes: text a caller ran
   * through the scanner (an inspection, a module a bundler compiled) must not add classes
   * that no project file or `@source` file uses, or two builds of the same files differ.
   * Reverse check: adding the scanner's valid classes to the class set turns only this test red.
   */
  it('ignores classes the scanner validated outside the class set', async () => {
    const root = createProject({
      'src/app.tsx': 'export const App = () => <main class="block"></main>'
    })
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    await scanner.scan(join(root, 'node_modules/widget/index.js'), 'export const widget = "m:4x"')
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), '@import "@stet-css/core";', { projectDir: root })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root })

    expect(scanner.validClasses.has('m:4x')).toBe(true)
    expect(css).toContain(rule('block'))
    expect(css).not.toContain(rule('m:4x'))
  })

  /**
   * Guards that `@blocklist` and `@source not` hold for the whole output when a project has
   * several CSS entries: every entry shares one generated CSS, so an entry that does not
   * repeat the directive must not bring the blocked class or the excluded file's classes
   * back.
   * Reverse check: merging only the last entry's directives turns only this test red.
   */
  it('applies one entry\'s @blocklist and @source not to every entry', async () => {
    const root = createProject({
      'src/app.tsx': 'export const App = () => <main class="fg:red block"></main>',
      'src/legacy/page.html': '<div class="m:4x legacy-card"></div>'
    })
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/a.css'), `
      @import "@stet-css/core";
      @blocklist 'fg:red';
      @source not './legacy';
    `, { projectDir: root })
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/b.css'), `
      @import "@stet-css/core";
    `, { projectDir: root })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root })

    expect(css).toContain(rule('block'))
    expect(css).not.toContain(rule('fg:red'))
    expect(css).not.toContain(rule('m:4x'))
  })

  /**
   * Guards that an entry keeps its native CSS like any other CSS file: a rule no markup uses,
   * a rule for a class only an excluded file uses, and a rule nested in an at-rule all stay.
   * Dropping them silently breaks classes added at runtime or by markup the scan cannot see.
   * Reverse check: filtering each entry's native rules by the class set turns this test red.
   */
  it('keeps every native rule in an entry whether or not markup uses it', async () => {
    const root = createProject({
      'src/app.html': '<div class="card"></div>',
      'src/legacy/page.html': '<div class="legacy-card"></div>'
    })

    const css = await extract(root, `
      @import "@stet-css/core";
      @source not './legacy';
      .card { color: red; }
      .legacy-card { color: blue; }
      .unused { color: green; }
      @media (min-width: 768px) { .unused-wide { color: navy; } }
    `)

    expect(css).toMatch(/\.card\s*\{\s*color:\s*red/)
    expect(css).toMatch(/\.legacy-card\s*\{\s*color:\s*#00f/)
    expect(css).toMatch(/\.unused\s*\{\s*color:\s*green/)
    expect(css).toMatch(/@media \(width >= 768px\)\s*\{\s*\.unused-wide/)
  })

  /**
   * Guards that a caller scanning no modules, such as the CLI over plain HTML with no CSS
   * entry, still gets rules for the project's files.
   * Reverse check: skipping the project's class set for the entry-less scope turns this test
   * and the two no-entry CLI tests red.
   */
  it('generates project classes without a stylesheet entry for a caller that scans no modules', async () => {
    const root = createProject({
      'index.html': '<h1 class="font:heavy"></h1>',
      'dist/index.html': '<h1 class="m:4x"></h1>'
    })
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const css = await createExtractedCSS({ scanner, styleCSSSources: new Map(), projectDir: root })

    expect(css).toContain(rule('font:heavy'))
    expect(css).not.toContain(rule('m:4x'))
  })

  /**
   * Guards Sass stylesheet entries: their `@safelist`, `@source` and `@theme` must reach the
   * static CSS like a `.css` entry's, or a Sass user silently gets the default theme and loses
   * forced classes. Sass itself is stubbed; it is the project's dependency, not ours.
   * Reverse check: reading directives from `.css` entries only turns only this test red.
   */
  it('applies a Sass entry\'s directives and theme', async () => {
    const root = createProject({
      'src/app.html': '<div class="fg:brand"></div>',
      'templates/page.html': '<div class="m:4x"></div>'
    })
    const loadSass = () => ({
      compileStringAsync: async (source: string) => ({ css: source.replace(/\$brand/g, '#123456') })
    })
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.scss'), `
      @import "@stet-css/core";
      @source '../templates';
      @safelist 'p:2x';
      @theme { --color-brand: $brand; }
    `, { projectDir: root, loadSass })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root, loadSass })

    expect(css).toContain(rule('fg:brand'))
    expect(css).toContain('--color-brand:#123456')
    expect(css).toContain(rule('p:2x'))
    expect(css).toContain(rule('m:4x'))
  })

  /**
   * Guards a build integration's output directory under the project root under a name the
   * built-in exclusions do not know (`www`): the emitted bundle must not feed classes back
   * into the CSS or count as a source file a watcher rebuilds on, even when `@source` names
   * it.
   * Reverse check: dropping `ignorePaths` from the listed-file filter turns only this test red.
   */
  it('never reads the ignored paths, even through @source', async () => {
    const root = createProject({
      'src/app.html': '<div class="block"></div>',
      'www/main.js': 'document.body.className = "m:4x"'
    })
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), `
      @import "@stet-css/core";
      @source '../www';
    `, { projectDir: root })
    const context = { scanner, styleCSSSources, projectDir: root, ignorePaths: [join(root, 'www')] }

    const css = await createExtractedCSS(context)

    expect(css).toContain(rule('block'))
    expect(css).not.toContain(rule('m:4x'))
    expect(await resolveStylesheetSourceFiles(context)).toStrictEqual([join(root, 'src/app.html')])
    expect(isStylesheetSourceFile(join(root, 'www/main.js'), context)).toBe(false)
  })

  /**
   * Guards that the scanner's custom `adapters` also read project files, so a project with
   * its own template syntax keeps the classes only its adapter can find.
   * Reverse check: dropping the scanner's adapters from the scope turns only this test red.
   */
  it('reads project files with the scanner\'s custom adapters', async () => {
    const root = createProject({
      'src/page.html': '<div data-classes="m:4x"></div>'
    })
    const scanner = new CSSScanner({
      adapters: [{
        name: 'data-classes',
        test: /\.html$/,
        async extract({ content }) {
          return [...content.matchAll(/data-classes="([^"]*)"/g)].flatMap((match) => match[1].split(' '))
        }
      }]
    }, root)
    await scanner.init()
    const entry = '@import "@stet-css/core";'
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), entry, { projectDir: root })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root })

    expect(css).toContain(rule('m:4x'))
  })

  /**
   * Guards that an entry importing `@stet-css/core` can `@compose` the package's static
   * utilities: the entry is compiled without its core import, so it must resolve against the
   * package's manifest, or static builds throw `Invalid @compose class: inline-flex`.
   * Runs once with the default package artifact and once with an `onWarning` callback,
   * which compiles the package instead.
   * Reverse check: compiling the entry without the package manifest turns both cases red.
   */
  it.each([
    ['the default package artifact', {}],
    ['a compiled package', { onWarning: () => {} }]
  ])('composes preset static utilities from an entry with %s', async (_, compileOptions) => {
    const root = createProject({ 'src/page.html': '<div class="probe"></div>' })
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const entry = '@import "@stet-css/core";\n@components { probe { @compose inline-flex; width: 40px; } }'
    const styleCSSSources: StyleCSSSources = new Map()
    writeFileSync(join(root, 'src/index.css'), entry)
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), entry, { projectDir: root })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root, ...compileOptions })

    expect(css).toMatch(/\.probe\{[^}]*display:inline-flex/)
  })
})

describe('static source files', () => {
  /**
   * Guards that a dev watcher's per-path check and a full build read the same files: if
   * they disagree, editing a file either never refreshes the CSS or refreshes it for a
   * file whose classes the build ignores. Covers `@source` naming a directory, `@source`
   * reaching outside the project root, `@source not`, and paths relative to the project root.
   * Reverse check: letting the per-path check ignore `@source not` turns only this test red.
   */
  it('answers per path exactly as the listed source files', async () => {
    const workspace = createProject({
      'app/src/app.tsx': '',
      'app/src/legacy/page.html': '',
      'app/src/page.astro': '',
      'app/node_modules/ui-kit/dist/index.js': '',
      'app/node_modules/other/index.js': '',
      'app/dist/index.html': '',
      'app/src/styles.css': '',
      'shared/Button.tsx': '',
      'shared/Button.stories.ts': ''
    })
    const root = join(workspace, 'app')
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const entry = `
      @import "@stet-css/core";
      @source '../node_modules/ui-kit';
      @source '../../shared/*.tsx';
      @source not './legacy';
    `
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), entry, { projectDir: root })
    const context = { scanner, styleCSSSources, projectDir: root }

    const files = await resolveStylesheetSourceFiles(context)

    expect(files).toStrictEqual([
      join(root, 'node_modules/ui-kit/dist/index.js'),
      join(root, 'src/app.tsx'),
      join(root, 'src/page.astro'),
      join(workspace, 'shared/Button.tsx')
    ])
    for (const file of [
      'app/src/app.tsx',
      'app/src/legacy/page.html',
      'app/src/page.astro',
      'app/node_modules/ui-kit/dist/index.js',
      'app/node_modules/other/index.js',
      'app/dist/index.html',
      'app/src/styles.css',
      'shared/Button.tsx',
      'shared/Button.stories.ts'
    ]) {
      const listed = files.includes(join(workspace, file))
      expect(isStylesheetSourceFile(join(workspace, file), context), file).toBe(listed)
      expect(isStylesheetSourceFile(relative(root, join(workspace, file)), context), file).toBe(listed)
    }
  })

  /**
   * Guards extra project directories (a Nuxt layer outside the project root, or installed
   * under `node_modules`): each is read by the project rules with itself as the root, so its
   * own dependencies and build output stay out while a directory the project's rules would
   * skip is still read, and the per-path check agrees with the listed files.
   * Reverse check: listing only `projectDir`'s files turns only this test red.
   */
  it('reads extra project directories by the project rules', async () => {
    const workspace = createProject({
      'app/src/page.html': '<div class="block"></div>',
      'base/components/Card.vue': '<template><div class="m:4x"></div></template>',
      'base/node_modules/dep/index.js': 'const c = "p:2x"',
      'base/.output/index.html': '<div class="p:3x"></div>',
      'app/node_modules/layer/Button.vue': '<template><div class="m:5x"></div></template>',
      'app/node_modules/layer/node_modules/dep/index.js': 'const c = "p:6x"'
    })
    const root = join(workspace, 'app')
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), '@import "@stet-css/core";', { projectDir: root })
    const context = {
      scanner,
      styleCSSSources,
      projectDir: root,
      extraProjectDirs: [join(workspace, 'base'), join(root, 'node_modules/layer')]
    }

    const css = await createExtractedCSS(context)
    const files = await resolveStylesheetSourceFiles(context)

    for (const className of ['block', 'm:4x', 'm:5x']) expect(css).toContain(rule(className))
    for (const className of ['p:2x', 'p:3x', 'p:6x']) expect(css).not.toContain(rule(className))
    expect(files).toStrictEqual([
      join(root, 'node_modules/layer/Button.vue'),
      join(root, 'src/page.html'),
      join(workspace, 'base/components/Card.vue')
    ])
    for (const file of [
      'base/components/Card.vue',
      'base/node_modules/dep/index.js',
      'base/.output/index.html',
      'app/node_modules/layer/Button.vue',
      'app/node_modules/layer/node_modules/dep/index.js'
    ]) {
      expect(isStylesheetSourceFile(join(workspace, file), context), file).toBe(files.includes(join(workspace, file)))
    }
  })
})
