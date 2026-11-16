import { afterEach, describe, expect, test, vi } from 'vitest'
import StyleEntryPlugin from '../../src/plugins/style-entry'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { createBuildDigest } from '../../src/utils/build-digest'
import getExtractedCSS from '../../src/utils/extracted-css'
import { createSlotCSSRule } from '../../src/utils/slot'
import { createProjectContext, removeProjects, SLOT_CSS_RULE as SLOT } from '../plugin-test-helper'

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

    expect(result.code).toBe('@import "@fontsource/fira-mono";\n' + await slotFor(context))
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
    expect(result.code.indexOf('@import "@fontsource/fira-mono";')).toBe(0)
    expect(result.code.match(/@fontsource\/fira-mono/g)).toHaveLength(1)
    expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
    expect(context.virtualCSSPlaceholderEnvironments).toBeUndefined()
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
      '@settings { base-unit: 0.25rem; }\n.card { color: red }',
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
    expect(await (plugin as any).transform.call({}, '@import "virtual:master-utilities.css";', '/project/src/style.css')).toBeUndefined()
    expect(await (plugin as any).transform.call({}, '@import "theme.css";', '/project/src/style.css')).toBeUndefined()
    expect(await (plugin as any).transform.call({}, '@import "./other.css";', '/project/src/style.css')).toBeUndefined()
  })
})
