import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
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
      rootContext: root,
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
  /** Guards #57: a class used only in a module no loader has compiled yet still reaches the CSS. */
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

  /** Guards dev updates: every file the CSS came from must recompile the generated module. */
  it('depends on the class set files and the entry import graph', async () => {
    const root = createFixture('@import "@stet-css/core";\n@import "../theme.css";')
    writeFileSync(join(root, 'theme.css'), '@theme { --color-primary: #00f; }')
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="block" />')

    const { dependencies } = await runGeneratedCSSLoader(root)

    expect(dependencies).toContain(join(root, 'app/page.tsx'))
    expect(dependencies).toContain(join(root, 'app/globals.css'))
    expect(dependencies).toContain(join(root, 'theme.css'))
  })

  it('does not read classes from node_modules', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'node_modules/pkg'), { recursive: true })
    writeFileSync(join(root, 'node_modules/pkg/index.ts'), `export const leaked = 'width:123456px'`)
    writeFileSync(join(root, 'app/page.tsx'), 'export default () => <main className="block" />')

    const { css } = await runGeneratedCSSLoader(root)

    expect(css).toContain('display:block')
    expect(css).not.toContain('123456px')
  })

  /** Guards the entry rewrite: native CSS moves into the generated module, pruned to used classes. */
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

  it('leaves stylesheets that are not entries unchanged', async () => {
    const root = createFixture()
    const source = '@theme { --color-primary: #00f; }'

    await expect(runStyleCSSLoader(root, join(root, 'app/theme.css'), source)).resolves.toBe(source)
  })

  /** Guards dev recovery: an invalid entry must stay watched so fixing it recompiles the CSS. */
  it('keeps the entries as dependencies when the CSS cannot be generated', async () => {
    const root = createFixture('@import "@stet-css/core";\n@components { card { @compose bg:neutral-120; } }')

    const error = await runGeneratedCSSLoader(root).then(() => undefined, (caught: Error & { dependencies: string[] }) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error?.dependencies).toContain(join(root, 'app/globals.css'))
  })

  it('creates the generated module file so bundlers can resolve it before it is filled in', () => {
    const root = createFixture()

    expect(ensureStaticOutputFile(root)).toBe(resolveStaticOutputPath(root))
    expect(ensureStaticOutputFile(root)).toBe(join(root, '.master/next.css'))
  })
})
