import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import {
  cloneManifest,
  createCSSWithSemanticUtilities,
  createDefaultCSS,
  createManifestWithSemanticUtilities,
  createManifestWithVariables,
  expectLayerText
} from './helpers/css-tester'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest

describe.concurrent('migrated cascade and layer parity', () => {
  test('keeps on-demand insertion lifecycle for utilities variables and semantic components', () => {
    const css = createDefaultCSS()

    expect(css.text).toBe('')
    css.ensureClassRules('text-center')
    expect(css.text).toContain('@layer utilities{.text-center{text-align:center}}')
    css.deleteClassRules('text-center')
    expect(css.text).toBe('')

    const componentCSS = createCSSWithSemanticUtilities([
      {
        name: 'btn',
        rules: [{ declarations: { display: 'block' } }]
      }
    ])

    componentCSS.ensureClassRules('text-center', 'font:bold')
    expect(componentCSS.text).toContain('@layer theme{:root{--font-weight-bold:700}}')
    expect(componentCSS.text).toContain('@layer utilities{.text-center{text-align:center}.font\\:bold{font-weight:var(--font-weight-bold)}}')
    componentCSS.ensureClassRules('btn')
    expect(componentCSS.text).toContain('@layer components{.btn{display:block}}')
    componentCSS.deleteClassRules('text-center', 'font:bold', 'btn')
    expect(componentCSS.text).toBe('')
  })

  test('prevents duplicate insertion and preserves emittedGlobals variable and animation counts', () => {
    const css = createDefaultCSS()
    css.ensureClassRules('text-center', 'text-center')
    expect(css.utilitiesLayer.rules).toHaveLength(1)

    const emittedGlobalsVariableCSS = StetCSS.create({
      manifest: defaultManifest,
      emittedGlobals: {
        variables: {
          'color-red-60': 1
        }
      }
    })
    emittedGlobalsVariableCSS.ensureClassRules('bg:red-60')
    expect(emittedGlobalsVariableCSS.text).toBe('@layer utilities{.bg\\:red-60{background-color:var(--color-red-60)}}')
    expect(Object.fromEntries(emittedGlobalsVariableCSS.themeLayer.tokenCounts)).toMatchObject({
      'color-red-60': 2
    })
    emittedGlobalsVariableCSS.deleteClassRules('bg:red-60')
    expect(emittedGlobalsVariableCSS.text).toBe('')
    expect(Object.fromEntries(emittedGlobalsVariableCSS.themeLayer.tokenCounts)).toMatchObject({
      'color-red-60': 1
    })

    const emittedGlobalsAnimationCSS = StetCSS.create({
      manifest: defaultManifest,
      emittedGlobals: {
        animations: {
          fade: 1
        }
      }
    })
    emittedGlobalsAnimationCSS.ensureClassRules('animate:fade')
    expect(emittedGlobalsAnimationCSS.text).toBe('@layer theme{:root{--animate-fade:fade 1s infinite}}@layer utilities{.animate\\:fade{animation:var(--animate-fade)}}')
    expect(Object.fromEntries(emittedGlobalsAnimationCSS.animationsNonLayer.tokenCounts)).toEqual({
      fade: 2
    })
    emittedGlobalsAnimationCSS.deleteClassRules('animate:fade')
    expect(emittedGlobalsAnimationCSS.text).toBe('')
    expect(Object.fromEntries(emittedGlobalsAnimationCSS.animationsNonLayer.tokenCounts)).toEqual({
      fade: 1
    })
  })

  test('emits static variables, dependencies, aliases, and keyframes without class references', () => {
    const manifest = createManifestWithVariables([
      {
        name: 'color-static-alias',
        key: 'static-alias',
        namespace: 'color',
        type: 'string',
        value: 'var(--color-static-base)',
        dependencies: ['color-static-base'],
        static: true
      },
      {
        name: 'color-static-base',
        key: 'static-base',
        namespace: 'color',
        type: 'string',
        value: '#123'
      },
      {
        name: 'spacing-card',
        key: 'card',
        namespace: 'spacing',
        type: 'number',
        value: 16,
        static: true
      },
      {
        name: '-spacing-card',
        key: '-card',
        namespace: 'spacing',
        type: 'number',
        value: -16,
        static: true
      }
    ])
    manifest.animations = {
      ...(manifest.animations || {}),
      'static-fade': {
        to: {
          color: 'var(--color-static-base)'
        }
      }
    }
    manifest.animationOptions = {
      'static-fade': {
        static: true
      }
    }
    const css = StetCSS.create({ manifest: manifest })

    expect(css.text).toContain('@layer theme{')
    expect(css.text).toContain('--color-static-alias:var(--color-static-base)')
    expect(css.text).toContain('--color-static-base:#123')
    expect(css.text).toContain('--spacing-card:16')
    expect(css.text).toContain('---spacing-card:-16')
    expect(css.text).toContain('@keyframes static-fade{to{color:var(--color-static-base)}}')

    css.ensureClassRules('fg:static-alias')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
      'color-static-alias': 2,
      'color-static-base': 2
    })
    css.deleteClassRules('fg:static-alias')
    expect(css.text).toContain('--color-static-alias:var(--color-static-base)')
    expect(css.text).toContain('--color-static-base:#123')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
      'color-static-alias': 1,
      'color-static-base': 1
    })
  })

  test('does not duplicate emittedGlobals static variables and keyframes', () => {
    const manifest = createManifestWithVariables([
      {
        name: 'color-static-simple',
        key: 'static-simple',
        namespace: 'color',
        type: 'string',
        value: '#123',
        static: true
      }
    ])
    manifest.animations = {
      ...(manifest.animations || {}),
      'static-spin': {
        to: {
          opacity: '1'
        }
      }
    }
    manifest.animationOptions = {
      'static-spin': {
        static: true
      }
    }
    const css = StetCSS.create({
      manifest,
      emittedGlobals: {
        variables: {
          'color-static-simple': 1
        },
        animations: {
          'static-spin': 1
        }
      }
    })

    expect(css.text).toBe('')
    css.ensureClassRules('fg:static-simple')
    expect(css.text).toBe('@layer utilities{.fg\\:static-simple{color:var(--color-static-simple)}}')
    css.deleteClassRules('fg:static-simple')
    expect(css.text).toBe('')
  })

  test('emits referenced keyframes outside cascade layers', () => {
    const css = createDefaultCSS()

    css.ensureClassRules('animate:fade')
    expect(css.text).toBe([
      '@layer theme{:root{--animate-fade:fade 1s infinite}}',
      '@layer utilities{.animate\\:fade{animation:var(--animate-fade)}}',
      '@keyframes fade{0%{opacity:0}to{opacity:1}}'
    ].join(''))
  })

  test('routes explicit layer variants and rejects conflicting layer variants', () => {
    expectLayerText(createDefaultCSS(), 'block@base', 'baseLayer', '.block\\@base{display:block}')
    expectLayerText(createDefaultCSS(), 'block@default', 'defaultsLayer', '.block\\@default{display:block}')
    expectLayerText(createDefaultCSS(), 'block@component', 'componentsLayer', '.block\\@component{display:block}')
    expectLayerText(createDefaultCSS(), 'block@utility', 'utilitiesLayer', '.block\\@utility{display:block}')
    expectLayerText(createDefaultCSS(), 'block@base@sm', 'baseLayer', '@media (width>=52.125rem){.block\\@base\\@sm{display:block}}')
    expectLayerText(createDefaultCSS(), 'block@default@sm', 'defaultsLayer', '@media (width>=52.125rem){.block\\@default\\@sm{display:block}}')
    expectLayerText(createDefaultCSS(), 'font:.75rem_:is(code,pre)@base', 'baseLayer', '.font\\:\\.75rem_\\:is\\(code\\,pre\\)\\@base :is(code,pre){font-size:0.75rem}')
    expectLayerText(createDefaultCSS(), 'font:.75rem_:is(code,pre)@default', 'defaultsLayer', '.font\\:\\.75rem_\\:is\\(code\\,pre\\)\\@default :is(code,pre){font-size:0.75rem}')

    const conflicted = createDefaultCSS().ensureClassRules('block@base@default')
    expect(conflicted.text).not.toContain('block\\@base\\@default')
  })

  test('keeps at-rules authored on semantic component rules within the component layer', () => {
    const css = StetCSS.create({
      manifest: createManifestWithSemanticUtilities([
      {
        name: 'btn',
        rules: [
          { selector: '&', conditions: ['@layer base'], declarations: { display: 'block' } }
        ]
      }
    ])
    })

    css.ensureClassRules('btn')
    expect(css.componentsLayer.text).toContain('@layer base{.btn{display:block}}')
  })

  test('keeps deterministic rule order independent of insertion order', () => {
    const inputs = [
      [
        'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
        'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
        'font:.75rem', 'font:medium', 'text-center', 'fixed', 'block', 'round', 'b:0'
      ],
      [
        'b:0', 'round', 'block', 'fixed', 'text-center', 'font:medium', 'font:.75rem',
        'my:0', 'mb:0', 'mt:0', 'm:0', 'mr:0', 'ml:0', 'mx:0',
        'py:0', 'pb:0', 'pt:0', 'p:0', 'pr:0', 'pl:0', 'px:0'
      ]
    ]
    const expected = [
      'block', 'fixed', 'round', 'text-center', 'b:0', 'm:0', 'mx:0', 'my:0', 'p:0',
      'px:0', 'py:0', 'font:.75rem', 'font:medium', 'mb:0', 'ml:0', 'mr:0', 'mt:0',
      'pb:0', 'pl:0', 'pr:0', 'pt:0'
    ]

    for (const input of inputs) {
      const css = createDefaultCSS()
      css.ensureClassRules(...input)
      expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
    }
  })

  test('keeps declaration and media priority order', () => {
    const css = createDefaultCSS()
    css.ensureClassRules('font:.75rem', 'font:2rem@md', 'font:1.5rem@sm', 'm:2rem', 'block', 'px:1rem', 'bg:blue-60:hover', 'round', 'mb:3rem')
    expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
      'block',
      'round',
      'm:2rem',
      'px:1rem',
      'font:.75rem',
      'mb:3rem',
      'bg:blue-60:hover',
      'font:1.5rem@sm',
      'font:2rem@md'
    ])

    const tabletCondition = { id: 'media' as const, nodes: [{ type: 'number' as const, value: 391 / 16, unit: 'rem' }] }
    const desktopCondition = { id: 'media' as const, nodes: [{ type: 'number' as const, value: 1025 / 16, unit: 'rem' }] }
    const manifest = cloneManifest()
    manifest.conditions = { ...(manifest.conditions || {}), tablet: tabletCondition, desktop: desktopCondition }
    manifest.breakpointConditions = { ...(manifest.breakpointConditions || {}), tablet: tabletCondition, desktop: desktopCondition }
    const mediaCSS = StetCSS.create({
      manifest,
      nativeDeclarationMatcher: ({ property }) => property === 'justify-content' || property === 'min-width'
    })
    mediaCSS.ensureClassRules('min-w:12.875rem', '{flex-row}@xs', 'justify-content:flex-end@xs', 'hidden@tablet&<desktop', '{flex-row}@2xs&<xs')
    expect(mediaCSS.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
      'min-w:12.875rem',
      '{flex-row}@xs',
      'justify-content:flex-end@xs',
      'hidden@tablet&<desktop',
      '{flex-row}@2xs&<xs'
    ])
  })

  /**
   * Prevents: queries written in different units sorting by their raw numbers once query values
   * keep their units, so `@>=600px` lands after `@sm` (52.125rem, 834px) and overrides it on wide
   * screens, or `@<600px` comes first among max-width queries and loses to `@<sm`. Ordering resolves
   * absolute units and `em` to rem through `toComparableQueryLength`, the helper compiled style
   * rules share. Rows are listed in the expected order.
   * Reverse-checked in `query-length.ts`: returning `value` unchanged reds the px, max-width, in,
   * and uppercase rows plus the compiler component-ordering test (the em row stays green: em
   * already compares as rem); dropping `in` from the table reds the max-width and in rows plus
   * the compiler component-ordering test; removing `.toLowerCase()` reds the uppercase row only.
   */
  test.each([
    ['px', ['block@>=600px', 'block@sm', 'block@>=900px']],
    ['em', ['block@>=40em', 'block@sm', 'block@>=60em']],
    ['max-width', ['block@<sm', 'block@<=8in', 'block@<600px']],
    ['in', ['block@>=600px', 'block@>=8in', 'block@sm']]
  ])('orders %s width queries against rem breakpoints by resolved width', (_, expected) => {
    const css = createDefaultCSS()
    css.ensureClassRules(...[...expected].reverse())
    expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
  })

  test('orders breakpoint tokens with uppercase units by resolved width', () => {
    const manifest = cloneManifest()
    const tab = { id: 'media' as const, nodes: [{ type: 'number' as const, value: 600, unit: 'PX' }] }
    manifest.conditions = { ...(manifest.conditions || {}), tab }
    manifest.breakpointConditions = { ...(manifest.breakpointConditions || {}), tab }
    const css = StetCSS.create({ manifest })
    css.ensureClassRules('block@sm', 'block@tab')
    expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(['block@tab', 'block@sm'])
  })

  test('keeps semantic component utility priority stable', () => {
    const css = createCSSWithSemanticUtilities([
      {
        name: 'btn-primary',
        rules: [
          { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } },
          { selector: '&:hover', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } },
          { selector: '&:disabled', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
        ]
      }
    ])

    css.ensureClassRules('btn-primary')
    expect(css.componentsLayer.rules.map(({ name }) => name)).toEqual(['btn-primary'])
    expect(css.componentsLayer.text).toContain('.btn-primary{background-color:oklch(63.7% 0.237 25.331)}')
    expect(css.componentsLayer.text).toContain('.btn-primary:hover{background-color:oklch(63.7% 0.237 25.331)}')
    expect(css.componentsLayer.text).toContain('.btn-primary:disabled{background-color:oklch(63.7% 0.237 25.331)}')
  })
})
