import { describe, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import { MasterCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'

function createCSSWithModes(modes: string[], extend: (manifest: MasterCSSManifest) => void = () => {}) {
  const manifest = cloneManifest()
  manifest.settings = { ...manifest.settings, modes }
  extend(manifest)
  return MasterCSS.create({ manifest })
}

/**
 * Declaring any `@theme <mode>` replaces the preset light and dark modes (#69). `@light` / `@dark`
 * used to fall through to condition parsing and compile to `@container light` / `@container dark`,
 * so a project that declared only `@theme sepia {}` or only `@theme dark {}` silently got rules
 * that never apply. They now throw, naming the class, the mode, the declared modes and the fix.
 */
describe('classes using an undeclared light or dark mode', () => {
  /**
   * Prevents: `@dark` / `@light` compiling to a container query nobody asked for when the
   * project's modes do not include them.
   * Reverse-checked: removing the undeclared-mode throw in `Utility.resolveStateBranches` turns
   * only these two rows red (they get `@container …` rules back).
   */
  test.each([
    ['custom modes only', ['sepia'], 'fg:red@dark', 'dark', '"sepia"'],
    ['dark only', ['dark'], 'fg:red@light', 'light', '"dark"']
  ])('throws for an undeclared mode: %s', (_, modes, className, mode, declared) => {
    const css = createCSSWithModes(modes)

    expect(() => css.generate(className)).toThrow(
      `Class "${className}" uses mode "${mode}", which is not declared (declared modes: ${declared}). `
      + `Declaring any @theme <mode> {} replaces the default light and dark modes; add @theme ${mode} {} to use @${mode}.`
    )
  })

  /**
   * Prevents: the error firing for a mode the project did declare, or for the preset light and
   * dark modes of a project that declares none (no CSS output change there).
   * Reverse-checked: moving the throw above the `css.modes` lookup in `resolveStateBranches` reds
   * both rows.
   */
  test.each([
    ['dark only', ['dark'], 'fg:red@dark', '@media (prefers-color-scheme:dark){.fg\\:red\\@dark{color:var(--color-red)}}'],
    ['preset modes', ['light', 'dark'], 'fg:red@light', '@media (prefers-color-scheme:light){.fg\\:red\\@light{color:var(--color-red)}}']
  ])('keeps compiling a declared mode: %s', (_, modes, className, text) => {
    const css = createCSSWithModes(modes)

    expect(css.generate(className).map((rule) => rule.text)).toEqual([text])
  })

  /**
   * Prevents: the error shadowing a `dark` the project defined another way, as a condition
   * variant or as a named condition (breakpoint), which resolve before plain condition parsing.
   * Reverse-checked: moving the throw above the variant lookup reds the variant row; dropping the
   * `css.conditions.has()` guard reds the condition row.
   */
  test.each([
    ['condition variant', (manifest: MasterCSSManifest) => {
      manifest.variants = [...(manifest.variants || []), { token: '@dark', branches: [{ conditions: ['@media print'] }] }]
    }, '@media print{.fg\\:red\\@dark{color:var(--color-red)}}'],
    ['named condition', (manifest: MasterCSSManifest) => {
      manifest.conditions = { ...manifest.conditions, dark: { id: 'media', nodes: [{ type: 'number', name: 'width', value: 100, unit: 'rem', operator: '>=' }] } }
    }, '@media (width>=100rem){.fg\\:red\\@dark{color:var(--color-red)}}']
  ])('resolves a project-defined dark first: %s', (_, extend, text) => {
    const css = createCSSWithModes(['sepia'], extend)

    expect(css.generate('fg:red@dark').map((rule) => rule.text)).toEqual([text])
  })
})
