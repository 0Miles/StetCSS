import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'
import { flattenStetCSSManifestVariables, groupStetCSSManifestVariables } from '@stet-css/schema/manifest'

describe.concurrent('ThemeLayer', () => {
  test('keeps default variable buckets before mode buckets when defaults are inserted later', () => {
    const manifest = cloneManifest()
    manifest.settings = {
      ...manifest.settings,
      defaultMode: 'light',
      modeTrigger: 'class',
      modes: ['light', 'dark']
    }
    const overriddenVariables = new Set(['color-blue', 'color-accent', 'color-amber-10'])
    manifest.variables = groupStetCSSManifestVariables([
      ...flattenStetCSSManifestVariables(manifest.variables)
        .filter((variable) => !variable.name || !overriddenVariables.has(variable.name)),
      {
        name: 'color-blue',
        key: 'blue',
        namespace: 'color',
        type: 'string',
        modes: {
          light: { type: 'string', value: '#66f' },
          dark: { type: 'string', value: '#44f' }
        }
      },
      {
        name: 'color-accent',
        key: 'accent',
        namespace: 'color',
        type: 'string',
        value: 'var(--color-blue)',
        dependencies: ['color-blue', 'color-amber-10'],
        modes: {
          dark: { type: 'string', value: 'var(--color-amber-10)' }
        }
      },
      {
        name: 'color-amber-10',
        key: 'amber-10',
        namespace: 'color',
        type: 'string',
        value: '#fed'
      }
    ])

    const css = StetCSS.create({ manifest: manifest })
    css.ensureClassRules('fg:blue')
    css.ensureClassRules('fg:accent')

    const text = css.themeLayer.text
    expect(text).toContain('.light,:root{color-scheme:light;--color-blue:#66f}')
    expect(text).toContain(':root{--color-accent:var(--color-blue);--color-amber-10:#fed}')
    expect(text).toContain('.dark{color-scheme:dark;--color-blue:#44f;--color-accent:var(--color-amber-10)}')
    expect(text.indexOf(':root{--color-accent')).toBeLessThan(text.indexOf('.dark{color-scheme:dark;--color-blue:#44f;--color-accent'))
  })

  test('emits color-scheme for built-in class mode buckets', () => {
    const manifest = createModeVariableManifest('class')
    const css = StetCSS.create({ manifest })

    css.ensureClassRules('fg:primary')

    expect(css.themeLayer.text).toBe('@layer theme{.light,:root{color-scheme:light;--color-primary:#000}.dark{color-scheme:dark;--color-primary:#fff}}')
  })

  test('emits color-scheme for built-in host mode buckets', () => {
    const manifest = createModeVariableManifest('host')
    const css = StetCSS.create({ manifest })

    css.ensureClassRules('fg:primary')

    expect(css.themeLayer.text).toBe('@layer theme{:host(.light),:host{color-scheme:light;--color-primary:#000}:host(.dark){color-scheme:dark;--color-primary:#fff}}')
  })

  test('does not merge the default mode selector when default-mode is none', () => {
    const manifest = createModeVariableManifest('class', 'none')
    const css = StetCSS.create({ manifest })

    css.ensureClassRules('fg:primary')

    expect(css.themeLayer.text).toBe('@layer theme{.light{color-scheme:light;--color-primary:#000}.dark{color-scheme:dark;--color-primary:#fff}}')
  })

  test('does not emit color-scheme for media mode buckets', () => {
    const manifest = createModeVariableManifest('media')
    const css = StetCSS.create({ manifest })

    css.ensureClassRules('fg:primary')

    expect(css.themeLayer.text).toBe('@layer theme{@media (prefers-color-scheme:light){:root{--color-primary:#000}}@media (prefers-color-scheme:dark){:root{--color-primary:#fff}}}')
  })

  /**
   * Prevents #177 at the engine seam: a runtime rooted at a shadow root overrides `rootSelector`
   * with `:host`, and every theme bucket that targets the tree root must use it, since `:root`
   * never matches inside a shadow tree. Mode-specific selectors stay as the trigger writes them.
   * Reverse-checked: writing `':root'` for `this.css.rootSelector` in `src/variable-rule.ts` reds
   * these three cases and nothing else in the engine suite.
   */
  test.each([
    ['media', '@layer theme{:host{--color-base:#123}@media (prefers-color-scheme:light){:host{--color-primary:#000}}@media (prefers-color-scheme:dark){:host{--color-primary:#fff}}}'],
    ['class', '@layer theme{.light,:host{color-scheme:light;--color-primary:#000}:host{--color-base:#123}.dark{color-scheme:dark;--color-primary:#fff}}'],
    ['host', '@layer theme{:host(.light),:host{color-scheme:light;--color-primary:#000}:host{--color-base:#123}:host(.dark){color-scheme:dark;--color-primary:#fff}}']
  ] as const)('puts %s theme variables on :host in a shadow root', (modeTrigger, expected) => {
    const css = ShadowRootCSS.create({ manifest: createBaseAndModeVariableManifest(modeTrigger) })

    css.ensureClassRules('fg:primary', 'fg:base')

    expect(css.themeLayer.text).toBe(expected)
  })

  /**
   * Prevents #177's build-emitted half: the document's `.dark` and `:host(.dark)` rules never match
   * inside a shadow tree, so a mode variable the build already emitted must be emitted again in a
   * shadow root under the class and host triggers, or switching the mode there does nothing. A base
   * token, and every variable under the media trigger, still inherits from the document.
   * Reverse-checked: dropping the `rootSelector === ':host'` early return from
   * `isEmittedGlobalsVariable` in `src/core.ts` reds the class and host cases and nothing else in
   * the engine suite.
   */
  test.each([
    ['media', ''],
    ['class', '@layer theme{.light,:host{color-scheme:light;--color-primary:#000}.dark{color-scheme:dark;--color-primary:#fff}}'],
    ['host', '@layer theme{:host(.light),:host{color-scheme:light;--color-primary:#000}:host(.dark){color-scheme:dark;--color-primary:#fff}}']
  ] as const)('re-emits build-emitted %s mode variables in a shadow root', (modeTrigger, expected) => {
    const css = ShadowRootCSS.create({
      manifest: createBaseAndModeVariableManifest(modeTrigger),
      emittedGlobals: { variables: { 'color-primary': 1, 'color-base': 1 } }
    })

    css.ensureClassRules('fg:primary', 'fg:base')

    expect(css.themeLayer.text).toBe(expected)
  })

  test('does not emit color-scheme for custom mode buckets', () => {
    const manifest = createModeVariableManifest('class')
    manifest.settings!.modes = ['light', 'dark', 'sepia']
    manifest.variables = groupStetCSSManifestVariables([{
      name: 'color-primary',
      key: 'primary',
      namespace: 'color',
      type: 'string',
      modes: {
        sepia: { type: 'string', value: '#753' }
      }
    }])
    const css = StetCSS.create({ manifest })

    css.ensureClassRules('fg:primary')

    expect(css.themeLayer.text).toBe('@layer theme{.sepia{--color-primary:#753}}')
  })
})

function createModeVariableManifest(modeTrigger: 'class' | 'host' | 'media', defaultMode = 'light') {
  const manifest = cloneManifest()
  manifest.settings = {
    ...manifest.settings,
    defaultMode,
    modeTrigger,
    modes: ['light', 'dark']
  }
  manifest.variables = groupStetCSSManifestVariables([{
    name: 'color-primary',
    key: 'primary',
    namespace: 'color',
    type: 'string',
    modes: {
      light: { type: 'string', value: '#000' },
      dark: { type: 'string', value: '#fff' }
    }
  }])
  return manifest
}

/** Renders as a runtime rooted at a shadow root does. */
class ShadowRootCSS extends StetCSS {
  get rootSelector() {
    return ':host' as const
  }
}

function createBaseAndModeVariableManifest(modeTrigger: 'class' | 'host' | 'media') {
  const manifest = createModeVariableManifest(modeTrigger)
  manifest.variables = groupStetCSSManifestVariables([
    ...flattenStetCSSManifestVariables(manifest.variables),
    { name: 'color-base', key: 'base', namespace: 'color', type: 'string', value: '#123' }
  ])
  return manifest
}
