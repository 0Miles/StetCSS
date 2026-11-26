import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import {
  compileCSSManifest,
  createManifestFromCSSResult,
  resolveStetCSSPackageImportGraph
} from '@stet-css/compiler'
import CSSScanner from '@stet-css/scanner'
import {
  compileStyleCSS,
  compileRenderedStyleCSS,
  createStyleEntryEmittedGlobals,
  createStyleCSSHostSource,
  createStetCSSPackageHostSource,
  createExtractedCSS,
  createExtractedCSSResult,
  collectStyleCSSDependencies,
  getNativeCSS,
  hasStetStyleEntrypoint,
  hasLocalStyleDirectives,
  isStetStyleSource,
  isStyleCSSRequest,
  removeStetStyleDirectives,
  removeStyleCSSImports,
  registerStyleCSSSource,
  resolveStetStyleSource,
  resolveStyleCSSImportGraph,
  replaceStyleCSSImports,
  transformLocalStyleCSS
} from '../src'
import { renderCompiledManifestCSS } from '../src/render'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'stet-css-stylesheet-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  return root
}

describe('style CSS extraction helpers', () => {
  it('normalizes native CSS line endings while rendering managed CSS', () => {
    const result = renderCompiledManifestCSS({
      manifest: defaultManifest,
      nativeCSS: [
        '.card {\r\n    color: red;\r\n}',
        '.button {\r    color: blue;\r}'
      ],
      includeGeneratedCSS: false
    })

    expect(result.nativeCSS).toBe([
      '.card {\n    color: red;\n}',
      '.button {\n    color: blue;\n}'
    ].join('\n\n'))
    expect(result.css).toBe(result.nativeCSS)
  })

  it('ignores native CSS variable references inside comments and strings while emitting real references', () => {
    const result = renderCompiledManifestCSS({
      manifest: defaultManifest,
      nativeCSS: [
        '.quoted { content: "var(--color-blue-60)"; }',
        '/* var(--color-red-60) */',
        '.real { color: var(--color-green-60); }'
      ],
      includeGeneratedCSS: false
    })

    expect(result.generatedCSS).toContain('--color-green-60')
    expect(result.generatedCSS).not.toContain('--color-blue-60')
    expect(result.generatedCSS).not.toContain('--color-red-60')
  })

  it('emits theme variables referenced by compiled stylesheet --alpha() values', () => {
    const compiled = compileCSSManifest(`
      @theme {
        --color-primary: #ff0000;
      }

      .native {
        color: --alpha(var(--color-primary) / 50%);
      }
    `, { baseManifest: defaultManifest })
    const result = renderCompiledManifestCSS({
      manifest: compiled.manifest,
      nativeCSS: compiled.nativeCSS,
      includeGeneratedCSS: false
    })

    expect(result.nativeCSS).toContain('color-mix(in oklab,var(--color-primary) 50%,transparent)')
    expect(result.generatedCSS).toContain('--color-primary:red')
  })

  // Guards #185: a theme token a native CSS reference reaches only through an `@theme inline`
  // variable is emitted, or the lowered `var(--color-base)` resolves to nothing.
  it('emits theme variables reached from native CSS through an inline theme variable', () => {
    const compiled = compileCSSManifest(`
      @theme { --color-base: red; }
      @theme inline { --color-alias: var(--color-base); }
      @theme { --color-brand: var(--color-alias); }

      .native { color: var(--color-brand); }
    `, { baseManifest: defaultManifest })
    const result = renderCompiledManifestCSS({
      manifest: compiled.manifest,
      nativeCSS: compiled.nativeCSS,
      includeGeneratedCSS: false
    })

    expect(result.generatedCSS).toBe('@layer theme{:root{--color-brand:var(--color-base);--color-base:red}}')
  })

  it('replaces @stet-css/core imports with CSS import modifiers', () => {
    const result = replaceStyleCSSImports([
      '@import "@stet-css/core" layer(stet);',
      '@import url(\'stet.css\') layer(stet);',
      '@import "./other.css";'
    ].join('\n'), '/* stet */')

    expect(result.replaced).toBe(true)
    expect(result.code).toContain('/* stet */')
    expect(result.code).not.toContain('@stet-css/core')
    expect(result.code).toContain('@import url(\'stet.css\') layer(stet);')
    expect(result.code).toContain('@import "./other.css";')
  })

  it('renders native CSS and keyframes from expanded StetCSS entry graphs', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const homePath = join(root, 'app/home.css')
    writeFileSync(homePath, [
      '@theme { --color-active: #ff0000; }',
      '@components { active-card { animation: active-spin 1s infinite; } }',
      '@keyframes active-spin { to { opacity: .5; } }',
      '.native-card { color: var(--color-active); }'
    ].join('\n'))
    const source = [
      '@import "@stet-css/core";',
      '@import "./home.css";'
    ].join('\n')
    const resolvedSource = resolveStetStyleSource(entryPath, source, root)
    expect(resolvedSource?.source).toContain('@keyframes active-spin')

    const result = await compileRenderedStyleCSS(entryPath, resolvedSource?.source || source, {
      projectDir: root
    })

    expect(result.css).toContain('@keyframes active-spin')
    expect(result.css).toContain('.native-card')
    expect(result.css).toContain('--color-active:red')
    expect(result.css).not.toContain('@components')
    expect(result.css).not.toContain('@import "./home.css"')
    expect(result.generatedCSS).toContain('--color-active:red')
    expect(result.emittedGlobals.variables).toMatchObject({
      'color-active': 1
    })
    expect(result.emittedGlobals.animations).toMatchObject({
      'active-spin': 1
    })
  })

  it('detects StetCSS entrypoints', () => {
    expect(hasStetStyleEntrypoint('@import "@stet-css/core";')).toBe(true)
    expect(hasStetStyleEntrypoint('@master entry;')).toBe(false)
    expect(hasStetStyleEntrypoint('@safelist "card";')).toBe(false)
    expect(hasStetStyleEntrypoint('@theme { --color-primary: red; }')).toBe(false)
    expect(hasStetStyleEntrypoint('@import "./other.css";')).toBe(false)
    expect(isStetStyleSource('@theme { --color-primary: red; }')).toBe(false)
    expect(isStetStyleSource('@import "@stet-css/core";')).toBe(true)
    expect(isStetStyleSource(resolveStyleCSSImportGraph(
      join(createFixture(), 'app/globals.css'),
      '@import "@stet-css/core";',
      undefined,
      { expandStetCSSPackage: false }
    ).source)).toBe(true)
    expect(isStetStyleSource('@import "virtual:stet-utilities.css";')).toBe(false)
    expect(isStetStyleSource('@import "stet.css";')).toBe(false)
    expect(isStetStyleSource('@master entry;')).toBe(false)
    expect(isStetStyleSource('@safelist "card";')).toBe(false)
    expect(isStetStyleSource('@import "./other.css";')).toBe(false)
  })

  it('detects local compose styles without treating them as StetCSS entries', () => {
    expect(hasLocalStyleDirectives('.card { @compose block; }')).toBe(true)
    expect(hasLocalStyleDirectives('.card { @variant print { color: red; } }')).toBe(true)
    expect(hasLocalStyleDirectives('.card { @dark { color: red; } }')).toBe(true)
    expect(hasLocalStyleDirectives('.card { @slot; }')).toBe(false)
    expect(hasLocalStyleDirectives('.card { color: red; }')).toBe(false)
    expect(isStyleCSSRequest('/project/src/Button.module.css')).toBe(true)
    expect(isStyleCSSRequest('/project/src/Button.vue?vue&type=style&index=0&lang.css')).toBe(true)
    expect(isStetStyleSource('.card { @compose block; }')).toBe(false)
  })

  it('collects best-effort style dependencies from local import graphs', () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const tokenPath = join(root, 'app/tokens.css')
    writeFileSync(tokenPath, '@components { card { display: block; } }')
    writeFileSync(entryPath, '@import "@stet-css/core";\n@import "./tokens.css";')

    expect(collectStyleCSSDependencies(entryPath, undefined, root)).toEqual([
      entryPath,
      tokenPath
    ])
  })

  /**
   * Prevents (#239 review 4 F4): an unquoted directive argument in an imported stylesheet dropping
   * every dependency but the entry. Webpack and Vite watch this list after a failed transform, so
   * quoting the argument in `classes.css` would never rerun the entry.
   * Reverse check: resolving the dependency graph with the directive-argument check on turns this
   * test red.
   */
  it('collects the dependencies of an entry whose import holds an unquoted directive argument', () => {
    const root = createFixture()
    const entryPath = join(root, 'app/style.css')
    const stetPath = join(root, 'app/stet.css')
    const classesPath = join(root, 'app/classes.css')
    writeFileSync(stetPath, '@import "@stet-css/core";')
    writeFileSync(classesPath, '@blocklist debug-*;')
    writeFileSync(entryPath, '@import "./stet.css";\n@import "./classes.css";')

    expect(collectStyleCSSDependencies(entryPath, undefined, root)).toEqual([
      entryPath,
      stetPath,
      classesPath
    ])
  })

  it('keeps direct style dependencies when dependency graph resolution fails', () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')

    expect(collectStyleCSSDependencies(entryPath, '@import "@stet-css/core";\n@import "./missing.css";', root)).toEqual([
      entryPath
    ])
    expect(collectStyleCSSDependencies(join(root, 'app/missing.css'), undefined, root)).toEqual([
      join(root, 'app/missing.css')
    ])
  })

  it('locally lowers @compose using the provided project context', async () => {
    const { manifest } = compileCSSManifest('@utilities { brand { color: #fff; } }', {
      baseManifest: defaultManifest
    })
    const result = await transformLocalStyleCSS('/project/src/Button.module.css', `
      .button {
        @compose inline-flex brand;
        color: white;
      }
    `, {
      baseManifest: manifest
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.button{')
    expect(result.code).toContain('display:inline-flex')
    expect(result.code).toContain('color:#fff')
    expect(result.code).not.toContain('@compose')
  })

  /**
   * Prevents: a backslash-escaped quote in a CSS module selector opening a string for the local
   * directive scan, which then reported no directives and sent `@compose` through unlowered.
   */
  it('locally lowers @compose after an escaped quote in a selector', async () => {
    expect(hasLocalStyleDirectives(".a\\'b{} .x{@compose block;}")).toBe(true)

    const result = await transformLocalStyleCSS('/project/src/Button.module.css', ".a\\'b{color:red} .x{@compose block;}", {
      baseManifest: defaultManifest
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.x{display:block}')
    expect(result.code).not.toContain('@compose')
  })

  it('locally lowers explicit @reference styles without emitting referenced CSS', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, [
      '@components {',
      '  brand { background-color: #123456; }',
      '}',
      '.referenced-native { color: red; }'
    ].join('\n'))

    const result = await transformLocalStyleCSS(modulePath, `
      @reference "./tokens.css";

      .button {
        @compose brand;
      }
    `, {
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.button{background-color:#123456}')
    expect(result.code).not.toContain('@reference')
    expect(result.code).not.toContain('referenced-native')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('emits referenced theme variables and keyframes used by local styles', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, [
      '@theme {',
      '  --spacing-card: 2rem;',
      '',
      '  @keyframes pop {',
      '    to { opacity: 1; }',
      '  }',
      '}',
      '@components {',
      '  panel {',
      '    padding: var(--spacing-card);',
      '    animation: pop 1s;',
      '  }',
      '}',
      '.referenced-native { color: red; }'
    ].join('\n'))

    const result = await transformLocalStyleCSS(modulePath, `
      @reference "./tokens.css";

      .page-panel {
        @compose panel;
      }
    `, {
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.page-panel{padding:var(--spacing-card);animation:1s pop}')
    expect(result.code).toContain('--spacing-card:2rem')
    expect(result.code).toContain('@keyframes pop')
    expect(result.code).not.toContain('@reference')
    expect(result.code).not.toContain('referenced-native')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('skips referenced theme variables and keyframes already emitted by global CSS', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, [
      '@theme {',
      '  --spacing-card: 2rem;',
      '',
      '  @keyframes pop {',
      '    to { opacity: 1; }',
      '  }',
      '}',
      '@components {',
      '  panel {',
      '    padding: var(--spacing-card);',
      '    animation: pop 1s;',
      '  }',
      '}'
    ].join('\n'))

    const result = await transformLocalStyleCSS(modulePath, `
      @reference "./tokens.css";

      .page-panel {
        @compose panel;
      }
    `, {
      projectDir: root,
      emittedGlobals: {
        variables: { 'spacing-card': 1 },
        animations: { pop: 1 }
      }
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.page-panel{padding:var(--spacing-card);animation:1s pop}')
    expect(result.code).not.toContain('--spacing-card:2rem')
    expect(result.code).not.toContain('@keyframes pop')
    expect(result.code).not.toContain('@reference')
  })

  it('emits default preset variables used by local styles referencing a globals entry', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, '@import "@stet-css/core";')

    const result = await transformLocalStyleCSS(pagePath, `
      @reference "./globals.css";

      .home-section {
        @compose py:5xl;
      }
    `, {
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.home-section{padding-block:var(--spacing-5xl)}')
    expect(result.code).toContain('--spacing-5xl:')
    expect(result.code).not.toContain('@reference')
    expect(result.code).not.toContain('@stet-css/core')
    expect(result.dependencies).toContain(pagePath)
    expect(result.dependencies).toContain(globalsPath)
  })

  it('dedupes default preset variables already emitted by a globals entry snapshot', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, [
      '@import "@stet-css/core";',
      '.global-section { padding-block: var(--spacing-5xl); }'
    ].join('\n'))

    const globalResult = await createStyleEntryEmittedGlobals([globalsPath], {
      projectDir: root
    })
    const result = await transformLocalStyleCSS(pagePath, `
      @reference "./globals.css";

      .home-section {
        @compose py:5xl;
      }
    `, {
      projectDir: root,
      emittedGlobals: globalResult.emittedGlobals
    })

    expect(globalResult.emittedGlobals.variables).toHaveProperty('spacing-5xl')
    expect(globalResult.dependencies).toContain(globalsPath)
    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.home-section{padding-block:var(--spacing-5xl)}')
    expect(result.code).not.toContain('--spacing-5xl:')
    expect(result.code).not.toContain('@reference')
  })

  it('strips reference-only local styles and still reports dependencies', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Empty.module.css')
    writeFileSync(tokenPath, '@components { brand { display: block; } }')

    const result = await transformLocalStyleCSS(modulePath, '@reference "./tokens.css";', {
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toBe('')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  /**
   * Prevents: a component CSS file whose only directive is the removed `@dark {}` or `@light {}`
   * skipping the compiler, so it reaches the browser unchanged and the dark or light styles
   * silently disappear instead of failing the build with the `@variant` rewrite.
   * Reverse-checked: dropping `LOCAL_STYLE_REJECTED_DIRECTIVE_NAMES` from `hasLocalStyleDirectives`
   * reds both cases plus the routing assertion in `detects local compose styles…`.
   */
  it.each(['dark', 'light'])('rejects a local style whose only directive is @%s', async (name) => {
    await expect(transformLocalStyleCSS('/project/src/Button.module.css', `.button { @${name} { color: red; } }`))
      .rejects.toThrow(`@variant ${name} {}`)
  })

  /**
   * Prevents: a local stylesheet such as a CSS Module carrying a removed `@master` at-rule skipping
   * the compiler, so the at-rule reaches the browser and does nothing.
   * Reverse check: removing `master` from `LOCAL_STYLE_REJECTED_DIRECTIVE_NAMES` turns only this
   * test red.
   */
  it('rejects @master at-rules in local styles', async () => {
    await expect(transformLocalStyleCSS('/project/src/Button.module.css', '.button { color: red; }\n@master shake;'))
      .rejects.toThrow('so delete "@master shake;"')
  })

  /**
   * Prevents (#189): Vue's scoped style compiler runs after this transform and appends the
   * component attribute to every selector, so referenced theme variables emitted on `:root`
   * (or on the class trigger's `.dark,:root`) become `[data-v-…]:root` and never apply.
   * Generated rules are wrapped in `:global()` for scoped Vue style requests only; the
   * component's own rules stay as written.
   * Reverse check: making `getVueScopedStyleId` return undefined turns this test and the
   * keyframes test below red.
   */
  it.each([
    ['media', '@layer theme{@media (prefers-color-scheme:light){:global(:root){--color-brand:#123456}}@media (prefers-color-scheme:dark){:global(:root){--color-brand:#abcdef}}}'],
    ['class', '@layer theme{:global(.light),:global(:root){color-scheme:light;--color-brand:#123456}:global(.dark){color-scheme:dark;--color-brand:#abcdef}}']
  ])('keeps referenced theme variables global in a scoped Vue style (mode-trigger: %s)', async (modeTrigger, generatedCSS) => {
    const root = createFixture()
    writeFileSync(join(root, 'app/tokens.css'), [
      `@settings { mode-trigger: ${modeTrigger}; default-mode: light; }`,
      '@theme light { --color-brand: #123456; }',
      '@theme dark { --color-brand: #abcdef; }'
    ].join('\n'))
    const source = '@reference "./tokens.css"; .button { color: var(--color-brand); } .label { @compose fg:brand; }'

    const scoped = await transformLocalStyleCSS(join(root, 'app/Button.vue') + '?vue&type=style&index=0&scoped=7a7a37b1&lang.css', source, {
      projectDir: root
    })

    expect(scoped.code).toContain(generatedCSS)
    expect(scoped.code).toMatch(/\.button\s*\{\s*color:\s*var\(--color-brand\);?\s*\}/)
    expect(scoped.code).toContain('.label{color:var(--color-brand)}')

    const unscoped = await transformLocalStyleCSS(join(root, 'app/Button.vue') + '?vue&type=style&index=0&lang.css', source, {
      projectDir: root
    })
    expect(unscoped.code).not.toContain(':global(')
    expect(unscoped.code).toBe(scoped.code.replace(/:global\(([^()]*(?:\([^()]*\))?)\)/g, '$1'))
  })

  /**
   * Prevents (#189): Vue renames every `@keyframes` of a scoped block to `<name>-<id>` and
   * rewrites only that block's `animation` declarations, so a global theme variable such as
   * `--animate-fade: fade 1s infinite` pointed at keyframes that no longer existed. Generated
   * keyframes take the `-<id>` suffix themselves (Vue leaves those alone) and every generated
   * variable and native `animation` that names them follows; the component's own keyframes
   * stay for Vue to rename. Both Vite's `scoped=<id>` and vue-loader's `id=<id>&scoped=true`.
   * Reverse check: dropping the keyframe rename in `scopeVueGeneratedCSS` turns only this test red.
   */
  it.each([
    '?vue&type=style&index=0&scoped=7a7a37b1&lang.css',
    '?vue&type=style&index=0&id=7a7a37b1&scoped=true&lang=css'
  ])('suffixes generated keyframes with the scope id in a scoped Vue style (%s)', async (query) => {
    const root = createFixture()
    writeFileSync(join(root, 'app/globals.css'), '@import "@stet-css/core";')
    const source = [
      '@reference "./globals.css";',
      '.x { @compose animate:fade; }',
      '.y { animation: fade 2s, spin 1s; }',
      '@keyframes spin { to { rotate: 1turn; } }'
    ].join('\n')

    const scoped = await transformLocalStyleCSS(join(root, 'app/Button.vue') + query, source, { projectDir: root })

    expect(scoped.code).toContain('.x{animation:var(--animate-fade)}')
    expect(scoped.code).toMatch(/\.y\s*\{\s*animation:\s*2s fade-7a7a37b1,\s*1s spin;?\s*\}/)
    expect(scoped.code).toMatch(/@keyframes spin\s*\{/)
    expect(scoped.code).toMatch(/:global\(:root\)\{[^}]*--animate-fade:fade-7a7a37b1 /)
    expect(scoped.code).toMatch(/@keyframes fade-7a7a37b1\{/)
    expect(scoped.code).not.toMatch(/@keyframes fade\{/)

    const unscoped = await transformLocalStyleCSS(join(root, 'app/Button.vue') + '?vue&type=style&index=0&lang.css', source, { projectDir: root })
    expect(unscoped.code).toMatch(/:root\{[^}]*--animate-fade:fade /)
    expect(unscoped.code).toMatch(/@keyframes fade\{/)
    expect(unscoped.code).not.toContain('7a7a37b1')
  })

  /**
   * Prevents (#189): the scoped Vue transform split a generated rule's selector list on every
   * top-level comma, so an escaped comma in a mode class (`@theme a\,b` gives `.a\,b`) became
   * `:global(.a\),:global(b)` and the mode's variables never applied.
   * Reverse check: splitting with `splitStetCSSTopLevel` again turns only this test red.
   */
  it('keeps an escaped comma inside one selector of a scoped Vue style', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/tokens.css'), [
      '@settings { mode-trigger: class; }',
      '@theme a\\,b { --color-brand: #abcdef; }'
    ].join('\n'))
    const source = '@reference "./tokens.css"; .button { color: var(--color-brand); }'

    const scoped = await transformLocalStyleCSS(join(root, 'app/Button.vue') + '?vue&type=style&index=0&scoped=7a7a37b1&lang.css', source, {
      projectDir: root
    })
    const unscoped = await transformLocalStyleCSS(join(root, 'app/Button.vue') + '?vue&type=style&index=0&lang.css', source, {
      projectDir: root
    })

    expect(unscoped.code).toContain('.a\\,b{--color-brand:#abcdef}')
    expect(scoped.code).toContain(':global(.a\\,b){--color-brand:#abcdef}')
  })

  /**
   * Prevents (#244): Next compiles CSS Modules in pure mode, which rejects the generated
   * `:root` rule (`Selector ":root" is not pure`), and every CSS Module pass renames the class
   * trigger's `.dark`, so the mode's variables never applied. With `cssModule`, each generated
   * selector is wrapped in `:global()` and given `:where(:not(.stet-css-global))`: a local class
   * that makes it pure without matching anything else or adding specificity, and that, unlike a
   * `cssmodules-pure-ignore` comment, survives Sass's `compressed` output. The module's own rules
   * and the generated keyframes stay as written, and without the option nothing changes.
   * Reverse check: ignoring `cssModule` in `transformLocalStyleCSS` turns only this test red.
   */
  it.each([
    ['media', '@layer theme{:global(:root):where(:not(.stet-css-global)){--animate-ping:ping 1s infinite}@media (prefers-color-scheme:light){:global(:root):where(:not(.stet-css-global)){--color-brand:#123456}}@media (prefers-color-scheme:dark){:global(:root):where(:not(.stet-css-global)){--color-brand:#abcdef}}}'],
    ['class', '@layer theme{:global(:root):where(:not(.stet-css-global)){--animate-ping:ping 1s infinite}:global(.light):where(:not(.stet-css-global)),:global(:root):where(:not(.stet-css-global)){color-scheme:light;--color-brand:#123456}:global(.dark):where(:not(.stet-css-global)){color-scheme:dark;--color-brand:#abcdef}}']
  ])('keeps generated rules global and pure-mode safe in a CSS Module (mode-trigger: %s)', async (modeTrigger, generatedCSS) => {
    const root = createFixture()
    writeFileSync(join(root, 'app/tokens.css'), [
      '@import "@stet-css/core";',
      `@settings { mode-trigger: ${modeTrigger}; default-mode: light; }`,
      '@theme light { --color-brand: #123456; }',
      '@theme dark { --color-brand: #abcdef; }'
    ].join('\n'))
    const modulePath = join(root, 'app/Button.module.css')
    const source = '@reference "./tokens.css"; .label { @compose fg:brand animate:ping; }'

    const cssModule = await transformLocalStyleCSS(modulePath, source, { projectDir: root, cssModule: true })

    expect(cssModule.code).toContain(generatedCSS)
    expect(cssModule.code).toContain('.label{animation:var(--animate-ping);color:var(--color-brand)}')
    expect(cssModule.code).toContain('@keyframes ping{75%{')

    const plain = await transformLocalStyleCSS(modulePath, source, { projectDir: root })
    expect(plain.code).not.toContain(':global(')
    expect(plain.code).not.toContain('stet-css-global')
    expect(cssModule.code.replaceAll(':where(:not(.stet-css-global))', '').replace(/:global\(([^()]*)\)/g, '$1')).toBe(plain.code)
  })

  it('leaves ordinary local CSS unchanged', async () => {
    const source = '.button { color: red; }'
    const result = await transformLocalStyleCSS('/project/src/Button.module.css', source)

    expect(result.transformed).toBe(false)
    expect(result.code).toBe(source)
  })

  it('resolves StetCSS style sources through the stylesheet import graph', () => {
    const root = createFixture()
    const result = resolveStetStyleSource(
      join(root, 'app/globals.css'),
      '@import "@stet-css/core";',
      root
    )

    expect(result?.source).toContain('@layer base')
    expect(result?.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result?.dependencies.filter((dependency) => !dependency.startsWith(root)).length).toBeGreaterThan(0)
    expect(resolveStetStyleSource(
      join(root, 'app/theme.css'),
      '@theme { --color-primary: red; }',
      root
    )).toBeUndefined()
    expect(resolveStetStyleSource(
      join(root, 'app/main.ts'),
      '@import "@stet-css/core";',
      root
    )).toBeUndefined()
    expect(resolveStetStyleSource(
      join(root, 'app/regular.css'),
      '@import "./missing.css";',
      root
    )).toBeUndefined()
    expect(() => resolveStetStyleSource(
      join(root, 'app/entry.css'),
      '@import "@stet-css/core";\n@import "./missing.css";',
      root
    )).toThrow('CSS file not found')
  })

  /**
   * Prevents: a stylesheet that still uses a removed `@master` at-rule being handed back to the
   * bundler untouched. `@master entry;` no longer makes an entry, so without this check a file
   * marked only that way, or one importing such a file, is never compiled and the developer sees
   * no error. The import graph's catch hands non-entries with unreadable imports back to the
   * bundler; the `@master` error raised while reading an imported file must not go with them.
   * Reverse check: dropping the `@master` rethrow from that catch, or the check in the import-graph
   * reader, turns only this test red in this package.
   */
  it('rejects @master at-rules in a stylesheet or the stylesheets it imports', () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/settings.css'), '@master { mode-trigger: media; }')

    expect(() => resolveStetStyleSource(
      join(root, 'app/legacy.css'),
      '@master entry;\n.card { color: red; }',
      root
    )).toThrow(expect.objectContaining({
      message: expect.stringMatching(/@master entry;.*@import '@stet-css\/core'/)
    }))
    expect(() => resolveStetStyleSource(
      join(root, 'app/legacy.css'),
      '@master entry;',
      root
    )).toThrow(join(root, 'app/legacy.css'))
    expect(() => resolveStetStyleSource(
      join(root, 'app/legacy.css'),
      '@import "./missing.css";\n@master entry;',
      root
    )).toThrow('@master entry;')
    expect(() => resolveStetStyleSource(
      join(root, 'app/globals.css'),
      '@import "./settings.css";\n.card { color: red; }',
      root
    )).toThrow(join(root, 'app/settings.css'))
  })

  /**
   * Prevents (#239): a stylesheet that reaches `@stet-css/core` only through a relative import
   * silently losing its entry status when it, or a stylesheet it imports, holds an unquoted
   * `@safelist`/`@source`/`@blocklist` argument. The import graph's catch hands non-entries back
   * to the bundler, so the build went green with no generated utilities and no error.
   * Reverse check: turning the directive-argument check off in the resolve that follows the entry
   * probe in `resolveStetStyleSource`, or on in the probe, turns only this test red in this package.
   */
  it('rejects unquoted directive arguments in a stylesheet that imports the entry', () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/stet.css'), '@import "@stet-css/core";')
    writeFileSync(join(root, 'app/classes.css'), '@blocklist debug-*;')

    expect(() => resolveStetStyleSource(
      join(root, 'app/style.css'),
      '@import "./stet.css";\n@safelist fg:blue;',
      root
    )).toThrow("@safelist 'fg:blue';")
    expect(() => resolveStetStyleSource(
      join(root, 'app/style.css'),
      '@import "./stet.css";\n@import "./classes.css";',
      root
    )).toThrow(`@blocklist 'debug-*'; (in ${join(root, 'app/classes.css')})`)
  })

  /**
   * Prevents (#239 review F8): a build failing on a stylesheet StetCSS does not own. Bundler
   * plugins send every `.css`, `.scss` and `.sass` request here, so Tailwind's
   * `@source inline(...)` (in the file or a file it imports) and a Sass `//` comment that mentions
   * `@safelist` must leave a stylesheet whose graph never reaches `@stet-css/core` untouched.
   * Reverse check: restoring round 1 of the fix (the entry probe checks directive arguments and its
   * catch rethrows `unquoted-directive-argument`) turns only this test red in this package; the
   * probe check alone is caught by the test above.
   */
  it('leaves directive arguments alone in stylesheets that do not reach the entry', () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/sources.css'), '@source inline("underline");')

    expect(resolveStetStyleSource(
      join(root, 'app/tw.css'),
      '@import "tailwindcss";\n@source inline("underline");\n@source not inline("container");',
      root
    )).toBeUndefined()
    expect(resolveStetStyleSource(
      join(root, 'app/plain.css'),
      '@import "./sources.css";\n.a { color: red; }',
      root
    )).toBeUndefined()
    expect(resolveStetStyleSource(
      join(root, 'app/a.scss'),
      '// old: @safelist fg:blue;\n.a { color: red; }',
      root
    )).toBeUndefined()
  })

  it('derives package host CSS from the package entry graph', async () => {
    const hostSource = await createStetCSSPackageHostSource(process.cwd(), {
      projectDir: process.cwd()
    })
    const graph = resolveStetCSSPackageImportGraph(process.cwd())
    const compileSource = removeStetStyleDirectives(removeStyleCSSImports(graph.source).code).code
    const compiledResult = await compileStyleCSS(graph.dependencies[0] || '@stet-css/core', compileSource, {
      projectDir: process.cwd(),
      preserveNativeCSS: true
    })
    const finalizedResult = createManifestFromCSSResult(compiledResult, {
      root: process.cwd()
    })
    const expectedCSS = renderCompiledManifestCSS({
      manifest: finalizedResult.manifest,
      nativeCSS: getNativeCSS(finalizedResult)
    }).css

    expect(hostSource.dependencies.length).toBeGreaterThan(1)
    expect(hostSource.dependencies.some((dependency) => dependency.endsWith('default-manifest.json'))).toBe(true)
    expect(hostSource.dependencies.some((dependency) => dependency.endsWith('default-native.css'))).toBe(true)
    expect(hostSource.source).toBe(expectedCSS)
    expect(hostSource.source).toContain('@layer base')
    expect(hostSource.source).toContain('text-rendering: geometricprecision')
    expect(hostSource.source).toContain('--font-family-sans:var(--font-sans, ui-sans-serif)')
    expect(hostSource.source).toContain('--font-family-mono:var(--font-mono, ui-monospace)')
    expect(hostSource.source).not.toContain('@stet-css/core/base.css')
    expect(hostSource.source).not.toContain('virtual:stet-utilities.css')
  })

  it('tracks default package artifacts as style dependencies', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    const result = await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), '@import "@stet-css/core";')

    expect(result.dependencies.some((dependency: string) => dependency.endsWith('default-manifest.json'))).toBe(true)
    expect(result.dependencies.some((dependency: string) => dependency.endsWith('default-native.css'))).toBe(true)
  })

  it('removes top-level StetCSS style directives', () => {
    const result = removeStetStyleDirectives([
      '@source "./page.tsx";',
      '@safelist "card";',
      '@blocklist "debug-*";',
      '',
      '@media (min-width: 768px) {',
      '    @source "./nested.tsx";',
      '}',
      '',
      '.card { color: red; }'
    ].join('\n'))

    expect(result.removed).toBe(true)
    expect(result.code).not.toContain('@source "./page.tsx"')
    expect(result.code).not.toContain('@safelist')
    expect(result.code).not.toContain('@blocklist')
    expect(result.code).toContain('@media (min-width: 768px) {\n    @source "./nested.tsx";\n}')
  })

  it('treats an empty host source as an intentionally handled StetCSS import', () => {
    const result = createStyleCSSHostSource('@import "@stet-css/core";', {
      stetSource: ''
    })

    expect(result).toBe('')
  })

  it('keeps native imports before generated host CSS', () => {
    const stetFirst = createStyleCSSHostSource([
      '@import "@stet-css/core";',
      '@import "@fontsource/fira-mono";',
      '',
      '.card { color: red; }'
    ].join('\n'), {
      stetSource: '#stet-css-slot{--slot:0}'
    })
    const stetLast = createStyleCSSHostSource([
      '@import "@fontsource/fira-mono";',
      '@import "@stet-css/core";',
      '',
      '.card { color: red; }'
    ].join('\n'), {
      stetSource: '#stet-css-slot{--slot:0}'
    })

    expect(stetFirst).toBe('@import "@fontsource/fira-mono";\n#stet-css-slot{--slot:0}')
    expect(stetLast).toBe('@import "@fontsource/fira-mono";\n#stet-css-slot{--slot:0}')
  })

  it('preserves native import modifiers before generated host CSS', () => {
    const result = createStyleCSSHostSource([
      '@import url("@fontsource/fira-mono") layer(fonts) screen;',
      '@import "normalize.css" layer(reset);',
      '@import "@stet-css/core";'
    ].join('\n'), {
      stetSource: '#stet-css-slot{--slot:0}'
    })

    expect(result).toBe([
      '@import url("@fontsource/fira-mono") layer(fonts) screen;',
      '@import "normalize.css" layer(reset);',
      '#stet-css-slot{--slot:0}'
    ].join('\n'))
  })

  it('uses the managed CSS entry config and native CSS sources', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      @import "@stet-css/core";

      @theme {
        --color-primary: #ff0000;
        --animation-main: scale 1s;
      }

      @keyframes fade {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @layer components {
        .btn {
          display: grid;
        }
      }

      .main {
        color: var(--color-primary);
        animation-name: fade;
      }

      .unused {
        color: var(--color-primary);
      }
    `)
    writeFileSync(join(root, 'app/page.tsx'), '<main class="btn block main fg:red"></main>')

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })
    const fallbackCSS = await createExtractedCSS({
      scanner,
      styleCSSSources,
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(css).toBe(fallbackCSS)
    expect(css).toContain('@layer base')
    expect(css).toContain('text-rendering: geometricprecision')
    expect(css).toContain('.main')
    expect(css).toContain('.unused')
    expect(css).toContain('--color-primary:red')
    expect(css).toContain('--color-red')
    expect(css).toContain('@keyframes fade')
    expect(css.match(/@keyframes fade/g) || []).toHaveLength(1)
    expect(css).toContain('.btn')
    expect(css).toContain('display: grid')
    expect(css).toContain('.block{display:block}')
    expect(css).toContain('.fg\\:red{color:var(--color-red)}')
    expect(css).not.toContain('virtual:stet-utilities.css')
    expect(css).not.toContain('@stet-css/core')
  })

  /**
   * Prevents (#69): the build-plugin path, an entry that declares only `@theme sepia {}` plus
   * markup using `fg:red@dark`, shipping `@container dark{…}` without telling anyone, or the
   * pipeline swallowing the engine's undeclared-mode error so the build passes with the class
   * missing. Build integrations surface this rejection as a build error.
   * Reverse-checked: removing the undeclared-mode throw in the engine's `resolveStateBranches`
   * (and rebuilding) reds only this test.
   */
  it('fails extraction when markup uses a mode the entry does not declare', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      @import "@stet-css/core";

      @theme sepia {}
    `)
    writeFileSync(join(root, 'app/page.tsx'), '<main class="fg:red@dark"></main>')

    await expect(createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })).rejects.toThrow('Class "fg:red@dark" uses mode "dark", which is not declared (declared modes: "sepia")')
  })

  it('keeps non-expandable native imports out of generated managed CSS', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), [
      '@import "@stet-css/core";',
      '@import "@fontsource/fira-mono";',
      '',
      '.card {',
      '    color: red;',
      '}'
    ].join('\n'))
    writeFileSync(join(root, 'app/page.html'), '<div class="card"></div>')

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(css).toContain('.card')
    expect(css).not.toContain('@fontsource/fira-mono')
    expect(css).not.toContain('@stet-css/core')
  })

  it('reports emittedGlobals variables and animations emitted by the StetCSS entry', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      @theme {
        --animation-main: scale 1s;
        --color-primary: #ff0000;

        @keyframes fade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes slide {
          to {
            transform: translateX(1rem);
          }
        }

        @keyframes scale {
          to {
            transform: scale(1.1);
          }
        }
      }

      .main {
        color: var(--color-primary);
        animation-name: fade,slide;
      }

      .main-animated {
        animation: var(--animation-main);
      }
    `)
    writeFileSync(join(root, 'app/page.tsx'), '<main class="main main-animated"></main>')

    const result = await createExtractedCSSResult({
      scanner,
      styleCSSSources,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(result.css).toContain('.main')
    expect(result.css).toContain('--color-primary:red')
    expect(result.css).toContain('@keyframes fade')
    expect(result.emittedGlobals).toEqual({
      variables: {
        'animation-main': 1,
        'color-primary': 1
      },
      animations: {
        fade: 1,
        scale: 1,
        slide: 1
      }
    })
  })

  it('does not preload inline theme tokens', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      @theme inline {
        --color-primary: #ff0000;
      }
    `)
    writeFileSync(join(root, 'app/page.tsx'), '<main class="fg:primary"></main>')

    const result = await createExtractedCSSResult({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(result.css).toContain('.fg\\:primary{color:red}')
    expect(result.css).not.toContain('--color-primary')
    expect(result.emittedGlobals.variables).toEqual({})
  })

  it('emits static theme tokens and keyframes without class references', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      @theme static {
        --color-primary: #ff0000;

        @keyframes static-fade {
          to {
            opacity: 1;
          }
        }
      }
    `)

    const result = await createExtractedCSSResult({
      scanner,
      styleCSSSources,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(result.css).toContain('@layer theme')
    expect(result.css).toContain('--color-primary:red')
    expect(result.css).toContain('@keyframes static-fade')
    expect(result.emittedGlobals).toEqual({
      variables: {
        'color-primary': 1
      },
      animations: {
        'static-fade': 1
      }
    })
  })

  it('keeps native CSS from local CSS imports in StetCSS import roots', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'app/styles'), { recursive: true })
    writeFileSync(join(root, 'app/styles/btn.css'), `
      .btn-native {
        color: red;
      }

      .btn-unused {
        color: blue;
      }
    `)
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    const result = await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      @import "@stet-css/core";
      @import "./styles/btn.css";

      .card {
        display: grid;
      }

      .unused {
        display: block;
      }
    `)
    writeFileSync(join(root, 'app/page.html'), '<div class="card btn-native"></div>')

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root
    })

    expect(result.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result.dependencies).toContain(join(root, 'app/styles/btn.css'))
    expect(result.dependencies.filter((dependency: string) => !dependency.startsWith(root)).length).toBeGreaterThan(0)
    expect(css).toContain('.card')
    expect(css).toContain('.btn-native')
    expect(css).toContain('.unused')
    expect(css).toContain('.btn-unused')
    expect(css).not.toContain('@import "./styles/btn.css"')
  })

  /**
   * Prevents: a project that still carries `@preserve native;` in an imported file building as
   * if the directive mattered. Registering the entry must fail with the delete hint.
   */
  it('rejects @preserve native anywhere in an entry graph', async () => {
    const root = createFixture()
    mkdirSync(join(root, 'app/styles'), { recursive: true })
    writeFileSync(join(root, 'app/styles/btn.css'), '@preserve native;\n.btn-native { color: red; }')
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    await expect(registerStyleCSSSource(scanner, new Map(), join(root, 'app/globals.css'), `
      @import "@stet-css/core";
      @import "./styles/btn.css";
    `)).rejects.toThrow(/@preserve was removed; .* delete "@preserve native;" \(in .*app\/globals\.css or a stylesheet it imports\)/)
  })

  it('can emit native CSS without generated StetCSS', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
      .card {
        display: grid;
      }
    `)
    writeFileSync(join(root, 'app/page.html'), '<div class="card block"></div>')

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(css).toContain('.card')
    expect(css).not.toContain('@layer base')
    expect(css).not.toContain('text-rendering: geometricprecision')
    expect(css).not.toContain('.block{display:block}')
  })

  it('keeps package base CSS without generated utilities for StetCSS imports', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()

    const styleCSSSources = new Map()
    await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), '@import "@stet-css/core";')
    writeFileSync(join(root, 'app/page.html'), '<div class="block"></div>')

    const css = await createExtractedCSS({
      scanner,
      styleCSSSources,
      projectDir: root,
      includeGeneratedCSS: false
    })

    expect(css).toContain('@layer base')
    expect(css).toContain('text-rendering: geometricprecision')
    expect(css).toMatch(/font-family:\s*var\(--font-family-sans\)/)
    expect(css).not.toContain('.block{display:block}')
    expect(css).not.toContain('@stet-css/core')
  })

  it('returns empty CSS when generated output is disabled without style sources', async () => {
    const root = createFixture()
    const scanner = new CSSScanner({}, root)
    await scanner.init()
    writeFileSync(join(root, 'app/page.html'), '<div class="block"></div>')

    const css = await createExtractedCSS({
      scanner,
      includeGeneratedCSS: false
    })

    expect(css).toBe('')
  })
})
