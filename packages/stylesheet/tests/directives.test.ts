import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSScanner from '@stet-css/scanner'
import { collectStylesheetDirectives } from '../src/directives'
import {
  createExtractedCSS,
  registerStyleCSSSource
} from '../src'

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-stylesheet-directives-'))
  mkdirSync(join(root, 'app/a'), { recursive: true })
  mkdirSync(join(root, 'app/b'), { recursive: true })
  return root
}

describe('stylesheet CSS directives', () => {
  it('reads directive modifiers outside quoted strings', () => {
    const root = createFixture()
    const directives = collectStylesheetDirectives(`
      @source './exclude/**/*.tsx';
      @source not './src/**/*.test.tsx';
      @safelist 'not-exclude';
      @blocklist 'legacy-*';
    `, join(root, 'app/entry.css'), root)

    expect(directives.include).toEqual(['app/exclude/**/*.tsx'])
    expect(directives.exclude).toEqual(['app/src/**/*.test.tsx'])
    expect(directives.safelist).toEqual(['not-exclude'])
    expect(directives.blocklist[0]).toBeInstanceOf(RegExp)
    expect((directives.blocklist[0] as RegExp).test('legacy-card')).toBe(true)
  })

  /**
   * Prevents: removed `@master` at-rules in an entry graph being skipped by directive collection
   * and left in the CSS, where they do nothing. Directive collection runs for every registered
   * entry, so it must fail with the replacement.
   * Reverse check: removing the `assertNoMasterAtRules` call from
   * `collectStandaloneCSSDirectiveExtractionPolicy` turns only this test red in this file.
   */
  it('rejects @master at-rules while collecting extraction directives', () => {
    const root = createFixture()

    expect(() => collectStylesheetDirectives(`
      @source './src/**/*.tsx';
      @master source './legacy/**/*.tsx';
    `, join(root, 'app/entry.css'), root)).toThrow(`so delete "@master source './legacy/**/*.tsx';"`)
  })

  it('loads scanner directives from a managed CSS entry graph', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/page.tsx'), '<div class="block"></div>')
    writeFileSync(join(root, 'app/skip.test.tsx'), '<div class="text-center"></div>')
    writeFileSync(join(root, 'app/forced.test.tsx'), '<div class="fg:red"></div>')

    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/entry.css'), `
      @import "@stet-css/core";
      @source './**/*.tsx';
      @source not './**/*.test.tsx';
      @safelist 'font:semibold legacy-token';
      @blocklist 'legacy-*';
    `)
    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(css).toContain('.block{display:block}')
    expect(css).toContain('.font\\:semibold{font-weight:var(--font-weight-semibold)}')
    expect(css).not.toContain('.fg\\:red')
    expect(css).not.toContain('.text\\:center')
    expect(css).not.toContain('legacy-token')
  })

  it('loads source directives from server template extensions', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'app/templates'), { recursive: true })
    writeFileSync(join(root, 'app/templates/product.liquid'), '<h1 class="block"></h1>')
    writeFileSync(join(root, 'app/templates/index.cshtml'), '<h1 class="m:0"></h1>')
    writeFileSync(join(root, 'app/templates/show.erb'), '<h1 class="font:semibold"></h1>')

    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/entry.css'), `
      @import "@stet-css/core";
      @source './templates/**/*.{liquid,cshtml,erb}';
    `)
    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(css).toContain('.block{display:block}')
    expect(css).toContain('.m\\:0{margin:0}')
    expect(css).toContain('.font\\:semibold{font-weight:var(--font-weight-semibold)}')
  })

  /**
   * Guards a build against an `@source` pattern whose braces expand into millions of globs:
   * twenty `{a,b}` groups made the build spend over nine seconds and gigabytes of memory
   * listing files, where it should stop at once with an error naming the pattern and its file.
   * Reverse check: raising the compiler's expansion limit turns this test and the compiler's
   * `@source` limit tests red.
   */
  it('rejects an @source pattern whose braces expand past the limit before listing files', async () => {
    const root = createFixture()
    const pattern = `./${'{a,b}'.repeat(20)}.tsx`
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    await expect(registerStyleCSSSource(scanner, new Map(), join(root, 'app/entry.css'), `
      @import "@stet-css/core";
      @source '${pattern}';
    `)).rejects.toThrow(`'${pattern}' expands its braces into more than 1024 patterns (in ${join(root, 'app/entry.css')})`)
  })

  it('unions source directives and subtracts source not directives', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/a/page.tsx'), '<div class="block"></div>')
    writeFileSync(join(root, 'app/b/page.tsx'), '<div class="m:0"></div>')
    writeFileSync(join(root, 'app/a/skip.tsx'), '<div class="fg:red"></div>')
    writeFileSync(join(root, 'app/b/skip.tsx'), '<div class="text:center"></div>')

    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/entry.css'), `
      @import "@stet-css/core";
      @source './a/*.tsx';
      @source './b/*.tsx';
      @source not './a/skip.tsx';
      @source not './b/skip.tsx';
    `)
    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(css).toContain('.block{display:block}')
    expect(css).toContain('.m\\:0{margin:0}')
    expect(css).not.toContain('.fg\\:red')
    expect(css).not.toContain('.text\\:center')
  })

  /**
   * Guards that files added with `@source` feed the class set and are reported as
   * dependencies to watch: a class used only by a prebuilt file the entry names must generate,
   * and editing that file must rerun the build. Native rules stay whether or not they are used.
   * Reverse check: dropping the `@source` files from a scope's file list turns this test and
   * the other three `@source` tests red.
   */
  it('reads a CSS root against the project files plus its source directives', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'dist'), { recursive: true })
    writeFileSync(join(root, 'dist/page.tsx'), '<div class="fg:red"></div>')
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    const result = await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/a/a.css'), `
      @import "@stet-css/core";
      @source '../../dist/*.tsx';

      .card {
        color: red;
      }

      .unused {
        color: blue;
      }
    `)

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(result.dependencies).toContain(join(root, 'dist/page.tsx'))
    expect(css).toContain('.fg\\:red')
    expect(css).toContain('.card')
    expect(css).toContain('.unused')
  })

  /**
   * Prevents: a backslash-escaped quote in a selector, as in `.a\'b`, opening a string for the
   * directive scanner, which then skipped every later `@safelist` and left it in the output CSS.
   * A quote escaped inside a string still ends nowhere but at its matching quote.
   */
  it('reads directives after escaped quotes outside strings', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/entry.css'), `
      @import "@stet-css/core";
      .a\\'b { color: red }
      .c { content: 'it\\'s' }
      @safelist 'fg:blue';
    `)

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(css).toContain('.fg\\:blue{color:var(--color-blue)}')
    expect(css).not.toContain('@safelist')
    expect(css).toContain(".a\\'b {\n  color: red;\n}")
    expect(css).toContain('content: "it\'s";')
  })

  it('merges imported stylesheet class directives into the parent root scope', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/shared.css'), `
      @safelist 'block fg:red';
      @blocklist 'fg:*';

      .shared-card {
        color: red;
      }

      .legacy-card {
        color: blue;
      }
    `)
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/a/a.css'), `
      @import "@stet-css/core";
      @import '../shared.css';
    `)

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(css).toContain('.block{display:block}')
    expect(css).not.toContain('.fg\\:red')
    expect(css).not.toContain('@safelist')
  })
})
