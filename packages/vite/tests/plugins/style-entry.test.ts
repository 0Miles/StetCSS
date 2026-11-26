import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import StyleEntryPlugin from '../../src/plugins/style-entry'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { createBuildDigest } from '../../src/utils/build-digest'
import getExtractedCSS from '../../src/utils/extracted-css'
import { createSlotCSSRule } from '../../src/utils/slot'
import { createDevServerStub, createProjectContext, cssLayerOrder, removeProjects, SLOT_CSS_RULE as SLOT } from '../plugin-test-helper'

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

afterEach(removeProjects)

/** The build placeholder for the context's current build digest. */
async function slotFor(context: any) {
  return createSlotCSSRule(SLOT, await createBuildDigest(context))
}

/** A project whose only source file uses `fg:red`. */
function makeContext(command: 'serve' | 'build') {
  return createProjectContext({ command, html: '<div class="fg:red"></div>' })
}

describe('StyleEntryPlugin', () => {
  test('build load emits the slot placeholder for bundle-time replacement', async () => {
    const context = makeContext('build')
    const plugin = StyleEntryPlugin(context)

    expect((plugin as any).resolveId(VIRTUAL_CSS_ID)).toBe(RESOLVED_VIRTUAL_CSS_ID)
    const result = await (plugin as any).load.call({}, RESOLVED_VIRTUAL_CSS_ID)

    expect(result).toBe(await slotFor(context))
    expect(context.virtualCSSImporters).toEqual(new Set([RESOLVED_VIRTUAL_CSS_ID]))
    expect(context.virtualCSSPlaceholderEnvironments).toEqual(new Set(['client']))
  })

  test('serve load inlines current extracted CSS and tracks the virtual CSS module for HMR', async () => {
    const context = makeContext('serve')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).load.call({}, RESOLVED_VIRTUAL_CSS_ID)

    expect(result).toContain('.fg\\:red')
    expect(context.virtualCSSImporters).toEqual(new Set([RESOLVED_VIRTUAL_CSS_ID]))
    expect(context.virtualCSSPlaceholderEnvironments).toBeUndefined()
  })

  test('treats @stet-css/core import stylesheets as managed entries', async () => {
    const context = makeContext('build')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call(
      {},
      '@import "@stet-css/core";\n.card{color:red}',
      '/project/src/style.css'
    )

    expect(result.code).toBe(await slotFor(context))
    expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
      source: expect.stringContaining('.card')
    })
    expect(context.styleCSSSources.get('/project/src/style.css').source).not.toContain('@stet-css/core')
    expect(context.virtualCSSImporters).toBeUndefined()
    expect(context.virtualCSSPlaceholderEnvironments).toEqual(new Set(['client']))
  })

  test('build transform keeps native imports before the slot when @stet-css/core comes first', async () => {
    const context = makeContext('build')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call(
      {},
      '@import "@stet-css/core";\n@import "@fontsource/fira-mono";\n.card{color:red}',
      '/project/src/style.css'
    )

    // The spliced CSS declares the preset layers after the import; the host declares them first,
    // where `@import '@stet-css/core'` put them (#183).
    expect(result.code).toBe('@layer theme, base, defaults, components, utilities;\n@import "@fontsource/fira-mono";\n' + await slotFor(context))
    expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
      source: expect.stringContaining('.card')
    })
    expect(context.styleCSSSources.get('/project/src/style.css').source).not.toContain('@stet-css/core')
    expect(context.virtualCSSPlaceholderEnvironments).toEqual(new Set(['client']))
  })

  test('serve transform emits current CSS and reloads the managed stylesheet for HMR', async () => {
    const context = makeContext('serve')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call(
      {},
      '@import "@stet-css/core";\n.card{color:red}',
      '/project/src/style.css'
    )

    expect(result.code).toContain('.fg\\:red')
    expect(result.code).not.toBe(SLOT)
    expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
    expect(context.virtualCSSPlaceholderEnvironments).toBeUndefined()
  })

  test('keeps managed style dependencies registered after invalid CSS', async () => {
    const context = makeContext('serve')
    const plugin = StyleEntryPlugin(context)
    const addWatchFile = vi.fn()

    await expect((plugin as any).transform.call(
      { addWatchFile },
      [
        '@import "@stet-css/core";',
        '@components {',
        '    card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'),
      '/project/src/style.css'
    )).rejects.toThrow('Invalid @compose class')

    expect(addWatchFile).toHaveBeenCalledWith('/project/src/style.css')
  })

  test('serve transform keeps native imports before generated CSS when @stet-css/core comes first', async () => {
    const context = makeContext('serve')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call(
      {},
      '@import "@stet-css/core";\n@import "@fontsource/fira-mono";\n.card{color:red}',
      '/project/src/style.css'
    )

    expect(result.code).toContain('.fg\\:red')
    expect(result.code).not.toContain('@stet-css/core')
    // Only the layer statements of the generated CSS, which were written before the import, precede it (#183).
    expect(result.code.slice(0, result.code.indexOf('@import "@fontsource/fira-mono";'))).toBe('@layer theme;\n@layer base;\n@layer defaults, components, utilities;\n')
    expect(result.code.match(/@fontsource\/fira-mono/g)).toHaveLength(1)
    expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
    expect(context.virtualCSSPlaceholderEnvironments).toBeUndefined()
  })

  /**
   * Guards #250 in dev: with a kept import the dev host source declared `reset`, written before
   * `@import "@stet-css/core"`, after the preset layers, while the build declared it first. Dev
   * now orders it ahead of them as the build and static extraction do, and `b` after them.
   * Reverse check: before the fix this test was red with `reset` after `utilities`.
   */
  test('serve transform declares the layers written before @stet-css/core ahead of the preset layers', async () => {
    const context = makeContext('serve')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call(
      {},
      [
        '@layer reset;',
        '@import "@stet-css/core";',
        '@import url("https://example.com/b.css") layer(b);',
        '@layer reset { .r { color: green } }'
      ].join('\n'),
      '/project/src/style.css'
    )

    expect(cssLayerOrder(result.code)).toEqual(['reset', 'theme', 'base', 'defaults', 'components', 'utilities', 'b'])
  })

  /**
   * Guards #250 with two entries in dev: Vite transforms `a.css` before `b.css` registers, and the
   * CSS served for `a.css` was extracted from the entries registered so far, so the page declared
   * `y`, written before `@import "@stet-css/core"` in `b.css`, after `utilities` and `b`, and `.y`
   * beat `fg:blue` in dev only. Dev leads with the layers of every entry the app imports, which the
   * dev server knows of once it served the module importing it, as the build and the CLI do.
   * Reverse check: extracting the dev CSS from the registered entries' layers alone reds only this test.
   */
  test('serve transform declares the layers of entries not yet registered ahead of the preset layers', async () => {
    const context = createProjectContext({ command: 'serve', html: '<div class="y fg:blue"></div>' })
    const root = context.config.root
    mkdirSync(join(root, 'src'))
    const a = join(root, 'src/a.css')
    const b = join(root, 'src/b.css')
    writeFileSync(a, '@layer x;\n@import "@stet-css/core";\n@import url("https://example.com/b.css") layer(b);')
    writeFileSync(b, '@layer y;\n@import "@stet-css/core";\n@layer y { .y { color: rgb(0 128 0); } }')
    context.server = createDevServerStub([a, b])
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call({}, readFileSync(a, 'utf8'), a)

    expect(cssLayerOrder(result.code)).toEqual(['x', 'y', 'theme', 'base', 'defaults', 'components', 'utilities', 'b'])
  })

  /**
   * Guards #250's criterion 3 in dev: an entry that writes no `@layer` statement kept its order only
   * while no other stylesheet on disk did. Dev led with the leading layers of every entry discovered
   * on disk, so `legacy/old.css`, which nothing imports, put `reset` ahead of the preset and `.r`
   * lost to `fg:blue`. Only entries the app imports lead, as in a build.
   * Reverse check: leading with every discovered entry's layers again reds only this test.
   */
  test('serve transform ignores the leading layers of an entry nothing imports', async () => {
    const context = createProjectContext({ command: 'serve', html: '<div class="r fg:blue"></div>' })
    const root = context.config.root
    mkdirSync(join(root, 'src'))
    mkdirSync(join(root, 'legacy'))
    const site = join(root, 'src/site.css')
    writeFileSync(site, '@import "@stet-css/core";\n@layer reset { .r { color: rgb(0 128 0); } }')
    writeFileSync(join(root, 'legacy/old.css'), '@layer reset;\n@import "@stet-css/core";')
    context.server = createDevServerStub([site])
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call({}, readFileSync(site, 'utf8'), site)

    expect(cssLayerOrder(result.code)).toEqual(['theme', 'base', 'defaults', 'components', 'utilities', 'reset'])
  })

  /**
   * Guards #250's entry order: entries register in the order Vite transforms them, so the leading
   * layers follow the entries' paths instead, as in the CLI. A Vue style block, which discovery on
   * disk misses, sorts with the stylesheets it finds.
   * Reverse check: dropping the sort in `collectProjectEntries` reds only this test, with `y, x`.
   */
  test('serve transform orders the leading layers of entries by path', async () => {
    const context = createProjectContext({ command: 'serve', html: '<div class="fg:blue"></div>' })
    const root = context.config.root
    mkdirSync(join(root, 'src'))
    const main = join(root, 'src/main.css')
    const app = join(root, 'src/App.vue')
    writeFileSync(main, '@layer y;\n@import "@stet-css/core";')
    writeFileSync(app, '<style>\n@layer x;\n@import "@stet-css/core";\n</style>')
    const plugin = StyleEntryPlugin(context)

    await (plugin as any).transform.call({}, readFileSync(main, 'utf8'), main)
    const result = await (plugin as any).transform.call({}, '@layer x;\n@import "@stet-css/core";', `${app}?vue&type=style&index=0&lang.css`)

    expect(cssLayerOrder(result.code)).toEqual(['x', 'y', 'theme', 'base', 'defaults', 'components', 'utilities'])
  })

  /**
   * Guards #250 across a dev edit: the entry's leading layers come from a file it imports before
   * `@import "@stet-css/core"`. Dev kept reading them from the copy of the entry it discovered on
   * disk, cached until the entry's own text changed, so after `layers.css` moved `w` ahead of
   * `reset` and Vite transformed the entry again, dev still declared `w` after `utilities` until
   * a restart, while the build and the CLI declared it first.
   * Reverse check: caching the discovered entry by its own text alone reds only this test.
   */
  test('serve transform declares the leading layers of an edited imported file without a restart', async () => {
    const context = createProjectContext({ command: 'serve', html: '<div class="w fg:blue"></div>' })
    const root = context.config.root
    mkdirSync(join(root, 'src'))
    const entry = join(root, 'src/style.css')
    const layers = join(root, 'src/layers.css')
    writeFileSync(layers, '@layer reset;')
    writeFileSync(entry, '@import "./layers.css";\n@import "@stet-css/core";\n@layer w { .w { color: rgb(0 128 0); } }')
    const plugin = StyleEntryPlugin(context)

    const before = await (plugin as any).transform.call({}, readFileSync(entry, 'utf8'), entry)
    writeFileSync(layers, '@layer w, reset;')
    const after = await (plugin as any).transform.call({}, readFileSync(entry, 'utf8'), entry)

    expect(cssLayerOrder(before.code)).toEqual(['reset', 'theme', 'base', 'defaults', 'components', 'utilities', 'w'])
    expect(cssLayerOrder(after.code)).toEqual(['w', 'reset', 'theme', 'base', 'defaults', 'components', 'utilities'])
  })

  /**
   * Prevents: a stylesheet still marked with the removed `@master entry;` passing the build
   * untouched. It is no longer an entry, so the transform itself must fail and name
   * `@import '@stet-css/core'`, or the developer gets no CSS and no error.
   * Reverse check: removing the `@master` check from the import-graph reader turns only this test
   * red.
   */
  test('fails the build for stylesheets still marked with @master entry', async () => {
    const context = makeContext('build')
    const plugin = StyleEntryPlugin(context)

    await expect((plugin as any).transform.call(
      {},
      '@master entry;\n.card{color:red}',
      '/project/src/style.css'
    )).rejects.toThrow(expect.objectContaining({
      message: expect.stringMatching(/@master entry;.*@import '@stet-css\/core'/)
    }))
  })

  /**
   * Guards the cascade between stylesheet entries: Vite transforms modules concurrently, so
   * entries register in a different order from one build to the next, and the generated CSS
   * ordered each entry's native rules by registration. Two builds of the same project then
   * shipped the rules in a different order under the same file name, and a rule in one entry
   * could win over the other's in one build and lose in the next.
   * Reverse check: passing `context.styleCSSSources` unsorted in `getStylesheetSourceContext`
   * turns only this test red.
   */
  test('orders entries by path, not by the order they were transformed', async () => {
    const extract = async (order: string[]) => {
      const context = makeContext('build')
      const plugin = StyleEntryPlugin(context)
      for (const name of order) {
        await (plugin as any).transform.call(
          { addWatchFile: vi.fn() },
          `@import "@stet-css/core";\n.${name}-native{color:red}`,
          `/project/src/${name}.css`
        )
      }
      return getExtractedCSS(context)
    }

    const css = await extract(['b', 'a'])
    expect(css.indexOf('.a-native')).toBeGreaterThan(-1)
    expect(css.indexOf('.a-native')).toBeLessThan(css.indexOf('.b-native'))
    expect(await extract(['a', 'b'])).toBe(css)
  })

  test('ignores stylesheets without @stet-css/core imports', async () => {
    const context = makeContext('build')
    const plugin = StyleEntryPlugin(context)

    const result = await (plugin as any).transform.call(
      {},
      '@settings { mode-trigger: class; }\n.card { color: red }',
      '/project/src/style.css'
    )

    expect(result).toBeUndefined()
    expect(context.virtualCSSImporters).toBeUndefined()
    expect(context.virtualCSSPlaceholderEnvironments).toBeUndefined()
  })

  test('ignores non-CSS modules and unrelated CSS imports', async () => {
    const context = makeContext('build')
    const plugin = StyleEntryPlugin(context)

    expect(await (plugin as any).transform.call({}, '@import "@stet-css/core";', '/project/src/main.ts')).toBeUndefined()
    expect(await (plugin as any).transform.call({}, '@import "virtual:stet-utilities.css";', '/project/src/style.css')).toBeUndefined()
    expect(await (plugin as any).transform.call({}, '@import "theme.css";', '/project/src/style.css')).toBeUndefined()
    expect(await (plugin as any).transform.call({}, '@import "./other.css";', '/project/src/style.css')).toBeUndefined()
  })
})
