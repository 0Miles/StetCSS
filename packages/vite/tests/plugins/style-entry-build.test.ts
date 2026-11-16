/**
 * Tests for the D1 fix in StyleEntryBuildPlugin (the build-mode plugin
 * that swaps the slot CSS placeholder for the real extracted CSS).
 *
 * D1 — `generateBundle` previously did a literal `String.replace()` on
 * every `*.css` asset and silently no-op'd if the placeholder was not
 * found. A downstream PostCSS plugin or minifier rewriting the placeholder
 * (e.g. unescaping `\:` in the ID selector, dropping the empty
 * `--slot:0` declaration, normalising whitespace) made the build ship
 * an empty stylesheet without warning.
 *
 * The fix:
 *   - Track whether a managed CSS import emitted the placeholder.
 *   - In `generateBundle`, count how many CSS assets had a successful
 *     replacement.
 *   - If the placeholder was emitted but no asset matched, call
 *     `this.warn(...)` so the user finds out at build time, not at
 *     runtime against a blank page.
 */
import { afterEach, beforeAll, describe, test, expect, vi } from 'vitest'
import StyleEntryBuildPlugin, { NO_STYLE_ENTRY_WARNING } from '../../src/plugins/style-entry-build'
import StyleEntryPlugin from '../../src/plugins/style-entry'
import getExtractedCSS from '../../src/utils/extracted-css'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { createProjectContext, removeProjects, SLOT_CSS_RULE } from '../plugin-test-helper'

afterEach(removeProjects)

/** A build whose project has one source file; the extracted CSS comes from its classes. */
function makeContext(html = '<div class="bg:white fg:black"></div>') {
  return createProjectContext({ html })
}

function makeBundle(entries: Record<string, string>) {
  const bundle: Record<string, any> = {}
  for (const [name, source] of Object.entries(entries)) {
    bundle[name] = { type: 'asset', source }
  }
  return bundle
}

const SLOT = SLOT_CSS_RULE
let REAL_CSS: string

beforeAll(async () => {
  REAL_CSS = await getExtractedCSS(makeContext())
  expect(REAL_CSS).toContain('.bg\\:white')
})

describe('StyleEntryBuildPlugin (D1 placeholder-leak warn)', () => {
  test('replaces placeholder when present and does NOT warn', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    ctx.virtualCSSPlaceholderEnvironments = new Set(['client'])

    const bundle = makeBundle({
      'assets/index-abc.css': `body{margin:0}${SLOT}`,
    })
    await (plugin as any).generateBundle.call({ warn }, {}, bundle)

    expect(bundle['assets/index-abc.css'].source).toContain(REAL_CSS)
    expect(bundle['assets/index-abc.css'].source).not.toContain(SLOT)
    expect(warn).not.toHaveBeenCalled()
  })

  test('deduplicates duplicate placeholder occurrences in the same CSS asset', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    ctx.virtualCSSPlaceholderEnvironments = new Set(['client'])

    const bundle = makeBundle({
      'assets/index-abc.css': `${SLOT}body{margin:0}${SLOT}`,
    })
    await (plugin as any).generateBundle.call({ warn }, {}, bundle)

    const css = String(bundle['assets/index-abc.css'].source)
    expect(css).not.toContain(SLOT)
    expect(css.match(new RegExp(REAL_CSS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toHaveLength(1)
    expect(css).toBe(`${REAL_CSS}body{margin:0}`)
    expect(warn).not.toHaveBeenCalled()
  })

  test('keeps one extracted CSS copy per CSS asset', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    ctx.virtualCSSPlaceholderEnvironments = new Set(['client'])

    const bundle = makeBundle({
      'assets/index-abc.css': SLOT,
      'assets/admin-abc.css': `${SLOT}${SLOT}`,
    })
    await (plugin as any).generateBundle.call({ warn }, {}, bundle)

    expect(bundle['assets/index-abc.css'].source).toBe(REAL_CSS)
    expect(bundle['assets/admin-abc.css'].source).toBe(REAL_CSS)
    expect(warn).not.toHaveBeenCalled()
  })

  test('warns when placeholder was emitted but no CSS asset still contains it', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    ctx.virtualCSSPlaceholderEnvironments = new Set(['client'])

    // Simulate a downstream PostCSS plugin / minifier having mutated
    // the placeholder rule beyond recognition.
    const bundle = makeBundle({
      'assets/index-abc.css': 'body{margin:0}#master_css_slot{--slot:0}',
    })
    await (plugin as any).generateBundle.call({ warn }, {}, bundle)

    expect(warn).toHaveBeenCalledTimes(1)
    const msg = warn.mock.calls[0][0] as string
    expect(msg).toContain('Could not splice managed style CSS')
    expect(msg).toContain(SLOT)
  })

  /**
   * Guards the silent unstyled build: when no stylesheet in the build imports Master CSS
   * (Astro inlines `@import '@stet-css/core'` written inside an `.astro` `<style>` before
   * Vite plugins see it), the build used to exit cleanly with zero generated rules. It now
   * warns once, naming the supported pattern, and never with the splice warning.
   * Reverse check: removing the `!context.virtualCSSPlaceholderEnvironments?.size` warning
   * in `style-entry-build.ts` turns only this test red.
   */
  test('warns once when no managed CSS import was registered in the build', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    const bundle = makeBundle({
      'assets/index-abc.css': 'body{margin:0}',
    })
    await (plugin as any).generateBundle.call({ warn, environment: { name: 'ssr' } }, {}, bundle)
    await (plugin as any).generateBundle.call({ warn, environment: { name: 'client' } }, {}, bundle)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(NO_STYLE_ENTRY_WARNING)
    expect(bundle['assets/index-abc.css'].source).toBe('body{margin:0}')
  })

  /**
   * Guards multi-environment builds against a false warning: Astro builds its server
   * environment, which holds the CSS entry, before a client environment with no CSS; the
   * shared context must keep the later environment quiet.
   * Reverse check: checking only the current environment's entry turns this test red, plus
   * the per-environment splice warning test, whose prerender-only fixture then also warns.
   */
  test('does NOT warn about a missing entry once any environment registered one', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    ctx.virtualCSSPlaceholderEnvironments = new Set(['ssr'])

    await (plugin as any).generateBundle.call({ warn, environment: { name: 'client' } }, {}, makeBundle({}))

    expect(warn).not.toHaveBeenCalled()
  })

  test('does NOT warn when extracted CSS is empty (no classes found at all)', async () => {
    // Edge case: a managed CSS import exists but no Master CSS class
    // was extracted (e.g. config-only project). Warning here would be
    // noise — there's nothing to splice anyway.
    const ctx = makeContext('<div></div>')
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()

    ctx.virtualCSSPlaceholderEnvironments = new Set(['client'])

    const bundle = makeBundle({
      'assets/index-abc.css': 'body{margin:0}', // placeholder absent
    })
    await (plugin as any).generateBundle.call({ warn }, {}, bundle)

    expect(warn).not.toHaveBeenCalled()
  })

  test('only treats `type: asset` chunks (skips `chunk` entries)', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const warn = vi.fn()
    ctx.virtualCSSPlaceholderEnvironments = new Set(['client'])

    const bundle: Record<string, any> = {
      'assets/index-abc.css': { type: 'asset', source: `body{margin:0}${SLOT}` },
      'assets/index-abc.js': { type: 'chunk', code: 'console.log(1)' }, // must not be touched
    }
    await (plugin as any).generateBundle.call({ warn }, {}, bundle)

    expect(bundle['assets/index-abc.css'].source).toContain(REAL_CSS)
    expect(bundle['assets/index-abc.js'].code).toBe('console.log(1)')
    expect(warn).not.toHaveBeenCalled()
  })

  /**
   * Guards multi-environment builds: Astro bundles prerender, server and client separately,
   * and only the environment whose own CSS import emitted the placeholder may warn that it
   * vanished. A flag shared across environments warned in the client bundle after the
   * prerender bundle had emitted it.
   * Reverse check: checking any environment instead of `getEnvironmentName(this)` in
   * `style-entry-build.ts` turns only this test red.
   */
  test('warns only for the environment that emitted the placeholder', async () => {
    const ctx = makeContext()
    const plugin = StyleEntryBuildPlugin(ctx)
    const styleEntryPlugin = StyleEntryPlugin(ctx)
    await (styleEntryPlugin as any).load.call({ environment: { name: 'prerender' } }, '\0' + VIRTUAL_CSS_ID)

    const clientWarn = vi.fn()
    await (plugin as any).generateBundle.call(
      { warn: clientWarn, environment: { name: 'client' } },
      {},
      makeBundle({ 'assets/index-abc.css': 'body{margin:0}' })
    )
    const prerenderWarn = vi.fn()
    await (plugin as any).generateBundle.call(
      { warn: prerenderWarn, environment: { name: 'prerender' } },
      {},
      makeBundle({ 'assets/page-abc.css': 'body{margin:0}' })
    )

    expect(clientWarn).not.toHaveBeenCalled()
    expect(prerenderWarn).toHaveBeenCalledTimes(1)
  })

  test('compiles managed CSS entry config rules and keeps all native CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-'))
    try {
      const entryPath = path.join(root, 'app.css')
      const source = `
        @import "@stet-css/core";

        body {
          margin: 0;
        }

        .native-card,
        .unused-card {
          color: red;
        }

        @components {
          btn {
            display: inline-flex;
          }
        }
      `
      writeFileSync(entryPath, source)
      const ctx = makeContext()
      ctx.config = {
        command: 'build',
        root,
        server: {
          fs: {
            allow: []
          }
        }
      }
      writeFileSync(path.join(root, 'index.html'), '<button class="btn native-card"></button>')
      const styleEntryPlugin = StyleEntryPlugin(ctx)
      const plugin = StyleEntryBuildPlugin(ctx)
      const warn = vi.fn()

      await (styleEntryPlugin as any).transform.call({ addWatchFile: vi.fn() }, source, entryPath)

      const bundle = makeBundle({
        'assets/index-abc.css': SLOT,
      })
      await (plugin as any).generateBundle.call({ warn }, {}, bundle)

      const css = String(bundle['assets/index-abc.css'].source)
      expect(css).toContain('body')
      expect(css).toContain('.native-card')
      expect(css).toContain('.unused-card')
      expect(css).toContain('.btn{display:inline-flex}')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('uses the managed CSS entry for config and keeps its native CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-'))
    try {
      const entryPath = path.join(root, 'app.css')
      const source = `
        @import "@stet-css/core";

        .native-used,
        .native-unused {
          color: var(--color-primary);
        }

        @theme {
          --color-primary: #123456;
        }

        @components {
          btn {
            display: grid;
          }
        }
      `
      writeFileSync(entryPath, source)
      const ctx = makeContext()
      ctx.config = {
        command: 'build',
        root,
        server: {
          fs: {
            allow: []
          }
        }
      }
      writeFileSync(path.join(root, 'index.html'), '<button class="btn native-used"></button>')

      const styleEntryPlugin = StyleEntryPlugin(ctx)
      const plugin = StyleEntryBuildPlugin(ctx)
      const warn = vi.fn()

      await (styleEntryPlugin as any).transform.call({ addWatchFile: vi.fn() }, source, entryPath)

      const bundle = makeBundle({
        'assets/index-abc.css': SLOT,
      })
      await (plugin as any).generateBundle.call({ warn }, {}, bundle)

      const css = String(bundle['assets/index-abc.css'].source)
      expect(css).toContain('.native-used')
      expect(css).toContain('.native-unused')
      expect(css).toMatch(/--color-primary:(rgb\(18 52 86\)|#123456)/)
      expect(css).toContain('.btn{display:grid}')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
