import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ensureStaticOutputFile, resolveStaticOutputPath } from '../src/static'
import masterCSSNextGeneratedCSSLoader from '../src/generated-css-loader'
import masterCSSStyleCSSLoader from '../src/style-css-loader'

function createFixture(globals = '@import "@stet-css/core";') {
  const root = mkdtempSync(join(tmpdir(), 'master-css-next-static-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  writeFileSync(join(root, 'app/globals.css'), globals)
  return root
}

function runGeneratedCSSLoader(root: string) {
  const dependencies: string[] = []
  return new Promise<string>((resolve, reject) => {
    const context: ThisParameterType<typeof masterCSSNextGeneratedCSSLoader> = {
      addDependency: (dependency) => dependencies.push(dependency),
      cacheable: () => undefined,
      getOptions: () => ({ projectDir: root }),
      async: () => (error, content) => {
        if (error) {
          reject(Object.assign(error, { dependencies }))
        } else {
          resolve(content || '')
        }
      }
    }
    masterCSSNextGeneratedCSSLoader.call(context)
  }).then((css) => ({ css, dependencies }))
}

function runStyleCSSLoader(root: string, resourcePath: string, source: string) {
  return new Promise<string>((resolve, reject) => {
    const context: ThisParameterType<typeof masterCSSStyleCSSLoader> = {
      resourcePath,
      getOptions: () => ({ outputPath: resolveStaticOutputPath(root), projectDir: root }),
      async: () => (error, content) => {
        if (error) {
          reject(error)
        } else {
          resolve(content || '')
        }
      }
    }
    masterCSSStyleCSSLoader.call(context, source)
  })
}

describe('Next static CSS', () => {
  /**
   * Guards #57: a class used only in a Server Component reaches the CSS even though no loader
   * has compiled that module, because the CSS comes from the project's files.
   * Reverse check: passing no project files to the class set (`sources: []`) turns it red.
   */
  it('generates rules for classes in project files that no bundler module scan has seen', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/page.tsx'), `
      import { ServerCard } from './server-card'
      export default function Page() {
        return <main className="block"><ServerCard /></main>
      }
    `)
    writeFileSync(join(root, 'app/server-card.tsx'), `
      export function ServerCard() {
        return <section className="m:0">Server only</section>
      }
    `)

    const { css } = await runGeneratedCSSLoader(root)

    expect(css).toContain('@layer base')
    expect(css).toContain('display:block')
    expect(css).toContain('margin:0')
  })

  /**
   * Guards dev updates: a source file or an imported stylesheet that is not a dependency of
   * the generated module never recompiles it, so dev keeps serving the old CSS.
   * Reverse check: dropping the class set's source files from the dependencies turns it red
   * (the dev e2e times out the same way).
   */
  it('depends on the class set files and the entry import graph', async () => {
    const root = createFixture('@import "@stet-css/core";\n@import "../theme.css";')
    writeFileSync(join(root, 'theme.css'), '@theme { --color-primary: #00f; }')
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="block" />')

    const { dependencies } = await runGeneratedCSSLoader(root)

    expect(dependencies).toContain(join(root, 'app/page.tsx'))
    expect(dependencies).toContain(join(root, 'app/globals.css'))
    expect(dependencies).toContain(join(root, 'theme.css'))
  })

  /**
   * Guards that strings in installed packages do not leak rules into the CSS; Next never
   * scanned `node_modules` and users list such packages with `@source`.
   * Reverse check: listing the project files with `sources: ['**\/*.ts', '**\/*.tsx']`, which
   * skips the built-in exclusions, turns it red.
   */
  it('does not read classes from node_modules', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'node_modules/pkg'), { recursive: true })
    writeFileSync(join(root, 'node_modules/pkg/index.ts'), `export const leaked = 'width:123456px'`)
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="block" />')

    const { css } = await runGeneratedCSSLoader(root)

    expect(css).toContain('display:block')
    expect(css).not.toContain('123456px')
  })

  /**
   * Guards the entry rewrite: the entry imports the generated module, which carries the
   * entry's native CSS pruned to used classes; leaving the native rules in the entry would
   * ship them twice and unpruned.
   * Reverse check: returning the entry source unchanged from the style loader turns it red.
   */
  it('moves entry native CSS into the generated module and prunes unused rules', async () => {
    const globals = [
      '@import "@stet-css/core";',
      '.main { color: var(--color-primary); }',
      '.unused { color: blue; }',
      '@theme { --color-primary: #ff0000; }'
    ].join('\n')
    const root = createFixture(globals)
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="main block" />')

    const host = await runStyleCSSLoader(root, join(root, 'app/globals.css'), globals)
    const { css } = await runGeneratedCSSLoader(root)

    expect(host).toBe('@import "../.master/next.css";')
    expect(css).toContain('color: var(--color-primary)')
    expect(css).toContain('--color-primary:red')
    expect(css).not.toContain('.unused')
  })

  /**
   * Guards entries declared with `@master entry;` instead of importing the package: they are
   * rewritten and their native CSS reaches the generated module.
   * Reverse check: matching entries only by an `@stet-css/core` import (`hasMasterCSSImport`)
   * in the style loader turns it red.
   */
  it('rewrites @master entry stylesheets to the generated module', async () => {
    const globals = '@master entry;\n.main { color: red; }'
    const root = createFixture(globals)
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="main" />')

    const host = await runStyleCSSLoader(root, join(root, 'app/globals.css'), globals)
    const { css } = await runGeneratedCSSLoader(root)

    expect(host).toBe('@import "../.master/next.css";')
    expect(css).toContain('.main')
    expect(css).not.toContain('@master entry')
  })

  /**
   * Guards stylesheets imported by an entry: their keyframes, theme tokens and native rules
   * must survive in the generated CSS once the entry's imports are folded into it.
   * Reverse check: registering only the entry file, not its import graph, turns it red.
   */
  it('keeps keyframes and native CSS from stylesheets an entry imports', async () => {
    const root = createFixture('@import "@stet-css/core";\n@import "./home.css";')
    writeFileSync(join(root, 'app/home.css'), [
      '@theme { --color-active: #ff0000; }',
      '@components { active-card { animation: active-spin 1s infinite; } }',
      '@keyframes active-spin { to { opacity: .5; } }',
      '.native-card { color: var(--color-active); }'
    ].join('\n'))
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="active-card native-card" />')

    const { css } = await runGeneratedCSSLoader(root)

    expect(css).toContain('@keyframes active-spin')
    expect(css).toContain('.native-card')
    expect(css).toContain('--color-active:red')
    expect(css).not.toContain('@components')
  })

  /**
   * Guards Sass entries: a `.scss` entry is rewritten to the generated module, so its `@theme`
   * must reach that module or the app silently gets the default theme. Sass is stubbed with a
   * pass-through: it is the project's own dependency.
   * Reverse check: discovering `.css` entries only turns only this test red.
   */
  it('carries the theme of a Sass entry into the generated CSS', async () => {
    const root = createFixture('')
    const globals = '@import "@stet-css/core";\n@theme { --color-brand: #123456; }'
    mkdirSync(join(root, 'node_modules/sass'), { recursive: true })
    writeFileSync(join(root, 'package.json'), '{ "private": true }')
    writeFileSync(join(root, 'node_modules/sass/package.json'), '{ "name": "sass", "main": "index.js" }')
    writeFileSync(join(root, 'node_modules/sass/index.js'), 'exports.compileStringAsync = async (source) => ({ css: source })\n')
    writeFileSync(join(root, 'app/globals.scss'), globals)
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="fg:brand" />')

    const host = await runStyleCSSLoader(root, join(root, 'app/globals.scss'), globals)
    const { css } = await runGeneratedCSSLoader(root)

    expect(host).toBe('@import "../.master/next.css";')
    expect(css).toContain('--color-brand:#123456')
  })

  /**
   * Guards that plain stylesheets with Master directives but no entry are not hijacked into
   * the generated module.
   * Reverse check: rewriting every stylesheet with a Master directive turns it red.
   */
  it('leaves stylesheets that are not entries unchanged', async () => {
    const root = createFixture()
    const source = '@theme { --color-primary: #00f; }'

    await expect(runStyleCSSLoader(root, join(root, 'app/theme.css'), source)).resolves.toBe(source)
  })

  /**
   * Guards dev recovery: an invalid entry must stay watched so fixing it recompiles the CSS.
   * Reverse check: calling back without registering the entries on failure turns it red.
   */
  it('keeps the entries as dependencies when the CSS cannot be generated', async () => {
    const root = createFixture('@import "@stet-css/core";\n@components { card { @compose bg:neutral-120; } }')

    const error = await runGeneratedCSSLoader(root).then(() => undefined, (caught: Error & { dependencies: string[] }) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error?.dependencies).toContain(join(root, 'app/globals.css'))
  })

  /**
   * Guards the first build: bundlers resolve `.master/next.css` from disk before the generated
   * CSS loader runs, and the directory must keep itself out of git.
   * Reverse check: skipping the placeholder write turns it red.
   */
  it('creates the generated module file and its git ignore before the first compile', () => {
    const root = createFixture()

    const outputPath = ensureStaticOutputFile(root)

    expect(outputPath).toBe(join(root, '.master/next.css'))
    expect(existsSync(outputPath)).toBe(true)
    expect(readFileSync(join(root, '.master/.gitignore'), 'utf-8')).toBe('*\n')
  })
})
