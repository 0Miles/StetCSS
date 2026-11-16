import { describe, expect, test } from 'vitest'
import type { StetCSSManifest, StetCSSManifestModeTrigger } from '@stet-css/schema/manifest'
import { MasterCSS, isUndeclaredModeError } from '../src'
import { cloneManifest } from './helpers/css-tester'

function createCSSWithModes(modes: string[] | undefined, modeTrigger?: StetCSSManifestModeTrigger, extend: (manifest: StetCSSManifest) => void = () => {}) {
  const manifest = cloneManifest()
  manifest.settings = { ...manifest.settings, ...(modes ? { modes } : {}), ...(modeTrigger ? { modeTrigger } : {}) }
  extend(manifest)
  return MasterCSS.create({ manifest })
}

function catchError(callback: () => unknown) {
  try {
    callback()
  } catch (error) {
    return error
  }
}

/**
 * Declaring any `@theme <mode>` replaces the preset light and dark modes (#69). `@light` / `@dark`
 * used to fall through to condition parsing and compile to `@container light` / `@container dark`,
 * so a project that declared only `@theme sepia {}` or only `@theme dark {}` silently got rules
 * that never apply, while the theme layer kept switching preset colors on `.light` / `.dark`.
 */
describe('only declared modes exist', () => {
  /**
   * Prevents: `@dark` / `@light` compiling to a container query nobody asked for when the
   * project's modes do not include them, under any trigger; and an error that does not say which
   * class, which mode, what is declared, or how to fix it. Asserts those parts, not the wording.
   * Reverse-checked: removing the undeclared-mode throw in `Utility.resolveStateBranches` turns
   * only these six rows red (they get `@container …` rules back).
   */
  test.each([
    ['media', ['sepia'], 'fg:red@dark', 'dark', '"sepia"'],
    ['class', ['sepia'], 'fg:red@dark', 'dark', '"sepia"'],
    ['host', ['sepia'], 'fg:red@dark', 'dark', '"sepia"'],
    ['media', ['dark'], 'fg:red@light', 'light', '"dark"'],
    ['class', ['dark'], 'fg:red@light', 'light', '"dark"'],
    ['host', ['dark'], 'fg:red@light', 'light', '"dark"']
  ] as const)('%s trigger with modes %j rejects %s', (modeTrigger, modes, className, mode, declared) => {
    const error = catchError(() => createCSSWithModes([...modes], modeTrigger).generate(className))

    expect(isUndeclaredModeError(error)).toBe(true)
    const { message } = error as Error
    expect(message).toContain(`"${className}"`)
    expect(message).toContain(`mode "${mode}"`)
    expect(message).toContain(declared)
    expect(message).toContain(`@theme ${mode} {}`)
  })

  /**
   * Prevents: the error firing for a mode the project did declare, under the media and class
   * triggers, or for the preset light and dark modes of a project that declares none (no CSS
   * output change there).
   * Reverse-checked: moving the throw above the `css.modes` lookup in `resolveStateBranches` reds
   * all three rows.
   */
  test.each([
    ['dark only, media', ['dark'], 'media', 'fg:red@dark', '@media (prefers-color-scheme:dark){.fg\\:red\\@dark{color:var(--color-red)}}'],
    ['dark only, class', ['dark'], 'class', 'fg:red@dark', '.dark .fg\\:red\\@dark{color:var(--color-red)}'],
    ['preset modes', undefined, undefined, 'fg:red@light', '@media (prefers-color-scheme:light){.fg\\:red\\@light{color:var(--color-red)}}']
  ] as const)('keeps compiling a declared mode: %s', (_, modes, modeTrigger, className, text) => {
    const css = createCSSWithModes(modes && [...modes], modeTrigger)

    expect(css.generate(className).map((rule) => rule.text)).toEqual([text])
  })

  /**
   * Prevents: the error shadowing a `dark` the project defined another way, as a condition
   * variant or as a named condition (breakpoint), which resolve before plain condition parsing.
   * Reverse-checked: moving the throw above the variant lookup reds the variant row; dropping the
   * `css.conditions.has()` guard reds the condition row.
   */
  test.each([
    ['condition variant', (manifest: StetCSSManifest) => {
      manifest.variants = [...(manifest.variants || []), { token: '@dark', branches: [{ conditions: ['@media print'] }] }]
    }, '@media print{.fg\\:red\\@dark{color:var(--color-red)}}'],
    ['named condition', (manifest: StetCSSManifest) => {
      manifest.conditions = { ...manifest.conditions, dark: { id: 'media', nodes: [{ type: 'number', name: 'width', value: 100, unit: 'rem', operator: '>=' }] } }
    }, '@media (width>=100rem){.fg\\:red\\@dark{color:var(--color-red)}}']
  ])('resolves a project-defined dark first: %s', (_, extend, text) => {
    const css = createCSSWithModes(['sepia'], undefined, extend)

    expect(css.generate('fg:red@dark').map((rule) => rule.text)).toEqual([text])
  })

  /**
   * Prevents: the theme layer still emitting preset `.light,:root{…}` / `.dark{…}` (or their
   * `prefers-color-scheme` blocks) for modes the project did not declare, so `<html class="dark">`
   * switches preset colors while `fg:red@dark` is rejected; and the opposite failure, a preset
   * token such as `--color-red` losing its value when its light/dark values are dropped, which
   * would leave `fg:red` uncolored. Projects that declare no modes keep the preset output.
   * Reverse-checked: returning `definition` unchanged in `scopeVariableToDeclaredModes`, or
   * skipping its fallback value, reds the three declared-mode rows; dropping its dependency filter
   * reds the sepia row only (`--color-red-50` emitted).
   */
  test.each([
    ['sepia only, class', ['sepia'], 'class', '@layer theme{:root{--color-red:var(--color-red-60);--color-red-60:oklch(60.94% .2501 29.2)}}'],
    ['dark only, class', ['dark'], 'class', '@layer theme{:root{--color-red:var(--color-red-60);--color-red-60:oklch(60.94% .2501 29.2);--color-red-50:oklch(62.82% .25 28.6)}.dark{color-scheme:dark;--color-red:var(--color-red-50)}}'],
    ['dark only, media', ['dark'], 'media', '@layer theme{:root{--color-red:var(--color-red-60);--color-red-60:oklch(60.94% .2501 29.2);--color-red-50:oklch(62.82% .25 28.6)}@media (prefers-color-scheme:dark){:root{--color-red:var(--color-red-50)}}}'],
    ['preset modes, class', undefined, 'class', '@layer theme{.light,:root{color-scheme:light;--color-red:var(--color-red-60)}:root{--color-red-60:oklch(60.94% .2501 29.2);--color-red-50:oklch(62.82% .25 28.6)}.dark{color-scheme:dark;--color-red:var(--color-red-50)}}']
  ] as const)('theme layer emits only declared modes: %s', (_, modes, modeTrigger, text) => {
    const css = createCSSWithModes(modes && [...modes], modeTrigger).ensureClassRules('fg:red')

    expect(css.themeLayer.text).toBe(text)
  })
})
