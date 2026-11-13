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

/** Registers `src/index.css` with a scanner that has scanned no module, as a static build sees it. */
async function extract(root: string, entry: string) {
  const scanner = new CSSScanner({ verbose: 0 }, root)
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
   * the other three `@source` tests red (server templates and pruning in `directives.test.ts`,
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
   * Guards that `@blocklist` wins over every way a class is detected, including the module
   * scan a build integration still runs, and that `@safelist` classes are generated with no
   * file using them.
   * Reverse check: returning the scope's classes without the `@blocklist` filter turns this test,
   * the multi-entry test and the imported-directives test in `directives.test.ts` red.
   */
  it('blocks @blocklist classes from every detection path and always generates @safelist', async () => {
    const root = createProject({
      'src/app.tsx': 'export const App = () => <main class="fg:red block"></main>'
    })
    const scanner = new CSSScanner({ verbose: 0 }, root)
    await scanner.init()
    await scanner.scanModule(join(root, 'src/widget.tsx'), 'export const widget = "fg:red m:4x"')
    const entry = `
      @import "@stet-css/core";
      @blocklist 'fg:red';
      @safelist 'p:2x';
    `
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/index.css'), entry, { projectDir: root })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root })

    expect(css).not.toContain(rule('fg:red'))
    expect(css).toContain(rule('block'))
    expect(css).toContain(rule('m:4x'))
    expect(css).toContain(rule('p:2x'))
  })

  /**
   * Guards that `@blocklist` and `@source not` hold for the whole output when a project has
   * several CSS entries: every entry shares one generated CSS, so an entry that does not
   * repeat the directive must not bring the blocked class or the excluded file's classes
   * back, in generated rules or in its own native CSS.
   * Reverse check: merging only the last entry's directives turns only this test red.
   */
  it('applies one entry\'s @blocklist and @source not to every entry', async () => {
    const root = createProject({
      'src/app.tsx': 'export const App = () => <main class="fg:red block"></main>',
      'src/legacy/page.html': '<div class="m:4x legacy-card"></div>'
    })
    const scanner = new CSSScanner({ verbose: 0 }, root)
    await scanner.init()
    const styleCSSSources: StyleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/a.css'), `
      @import "@stet-css/core";
      @blocklist 'fg:red';
      @source not './legacy';
    `, { projectDir: root })
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'src/b.css'), `
      @import "@stet-css/core";
      .legacy-card { color: blue; }
    `, { projectDir: root })

    const css = await createExtractedCSS({ scanner, styleCSSSources, projectDir: root })

    expect(css).toContain(rule('block'))
    expect(css).not.toContain(rule('fg:red'))
    expect(css).not.toContain(rule('m:4x'))
    expect(css).not.toContain('.legacy-card')
  })

  /**
   * Guards native CSS pruning when the entry only narrows the file set: a rule for a class
   * used in the project must survive, and a rule nothing uses must still be pruned.
   * Reverse check: pruning each entry's native CSS with the module classes only turns this test
   * and the two pruning tests in `directives.test.ts` red.
   */
  it('keeps native CSS rules used by project files when the entry only has @source not', async () => {
    const root = createProject({
      'src/app.html': '<div class="card"></div>',
      'src/legacy/page.html': '<div class="legacy-card"></div>'
    })

    const css = await extract(root, `
      @import "@stet-css/core";
      @source not './legacy';
      .card { color: red; }
      .legacy-card { color: blue; }
    `)

    expect(css).toMatch(/\.card\s*\{\s*color:\s*red/)
    expect(css).not.toContain('.legacy-card')
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
    const scanner = new CSSScanner({ verbose: 0 }, root)
    await scanner.init()

    const css = await createExtractedCSS({ scanner, styleCSSSources: new Map(), projectDir: root, classes: [] })

    expect(css).toContain(rule('font:heavy'))
    expect(css).not.toContain(rule('m:4x'))
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
      verbose: 0,
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
    const scanner = new CSSScanner({ verbose: 0 }, root)
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
})
