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

  describe('dependency chains through inline variables', () => {
    // Guards: a token reached only through an inline variable (`@theme inline`) is emitted, or the
    // lowered `var(--color-base)` in --color-brand resolves to nothing and the colour is unset.
    const createInlineChainManifest = (brandOptions: { static?: true } = {}) => createManifestWithVariables([
      { name: 'color-base', key: 'base', namespace: 'color', type: 'string', value: 'red' },
      { name: 'color-alias', key: 'alias', namespace: 'color', type: 'string', value: 'var(--color-base)', dependencies: ['color-base'], inline: true },
      { name: 'color-brand', key: 'brand', namespace: 'color', type: 'string', value: 'var(--color-alias)', dependencies: ['color-alias'], ...brandOptions }
    ])

    test('ensure emits the token behind an inline variable and delete removes it', () => {
      const css = StetCSS.create({ manifest: createInlineChainManifest() })

      css.ensureClassRules('fg:brand')
      expect(css.themeLayer.text).toBe('@layer theme{:root{--color-brand:var(--color-base);--color-base:red}}')

      css.deleteClassRules('fg:brand')
      expect(css.text).toBe('')
      expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({})
    })

    test('static initialization emits the token behind an inline variable and keeps it through ensure and delete', () => {
      const css = StetCSS.create({ manifest: createInlineChainManifest({ static: true }) })
      const staticThemeText = '@layer theme{:root{--color-brand:var(--color-base);--color-base:red}}'

      expect(css.themeLayer.text).toBe(staticThemeText)

      css.ensureClassRules('fg:brand')
      expect(css.themeLayer.text).toBe(staticThemeText)
      expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({ 'color-brand': 2, 'color-base': 2 })

      css.deleteClassRules('fg:brand')
      expect(css.themeLayer.text).toBe(staticThemeText)
      expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({ 'color-brand': 1, 'color-base': 1 })
    })
  })

  /**
   * Guards #186 in the engine: inline references are resolved by `replaceCSSVariableReferences`
   * (`@stet-css/lexer`), which let an escaped quote outside a string, as in an unquoted font name
   * `Foo\'s`, open a string. The `var(--color-alias)` after it stayed unresolved, pointing at an
   * inline variable that is never emitted, and `--color-base` was dropped.
   * Reverse check: dropping the `\` branch of `skipCSSEscapeStringOrComment` in lexer `src`, then
   * `bun run build`, reds this test (engine tests read lexer `dist`).
   */
  test('resolves an inline variable after an escaped quote outside a string', () => {
    const css = StetCSS.create({
      manifest: createManifestWithVariables([
        { name: 'color-base', key: 'base', namespace: 'color', type: 'string', value: 'red' },
        { name: 'color-alias', key: 'alias', namespace: 'color', type: 'string', value: 'var(--color-base)', dependencies: ['color-base'], inline: true },
        { name: 'color-brand', key: 'brand', namespace: 'color', type: 'string', value: "Foo\\'s, var(--color-alias)", dependencies: ['color-alias'] }
      ])
    })

    css.ensureClassRules('fg:brand')
    expect(css.themeLayer.text).toBe("@layer theme{:root{--color-brand:Foo\\'s, var(--color-base);--color-base:red}}")
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

  /**
   * Prevents (#184): ratio queries sorting by their class names, so `@aspect-ratio>=3/1` lands
   * before `@aspect-ratio>=16/9` and loses to it on the widest screens. Ratios order by their
   * quotient. Rows are listed in the expected order; their class names sort differently.
   * Reverse-checked (#184): making the ratio helper return `NaN` reds this test; dropping `/` from
   * the token regex in `parse-condition.ts` reds it and the 16/9 row in `parser-parity.test.ts`.
   * The helper is now `toComparableQueryRatio` in `utils/query-features.ts`, which the ratio rows
   * of the close min query and exclusive bound tests below (#233) also depend on.
   */
  test('orders aspect-ratio queries by ratio', () => {
    const expected = ['block@aspect-ratio>=1/2', 'block@aspect-ratio>=16/9', 'block@aspect-ratio>=3/1']
    const css = createDefaultCSS()
    css.ensureClassRules(...[...expected].reverse())
    expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
  })

  /**
   * Prevents (#233): two min-width queries a few pixels apart coming out largest first, so
   * `fg:red@w>=601px` follows `fg:blue@w>=605px` and red wins on screens 605px and wider.
   * Checked in both class orders, since insertion order alone must not decide the cascade.
   * Reverse-checked: the old `compareFeatureTuples`, which subtracted each min from the unbounded
   * max, reds this test and the close min query rows below, and nothing else in this package.
   */
  test('lets the larger of two close min-width queries win', () => {
    const expected = '@layer utilities{@media (width>=601px){.fg\\:red\\@w\\>\\=601px{color:var(--color-red)}}@media (width>=605px){.fg\\:blue\\@w\\>\\=605px{color:var(--color-blue)}}}'
    for (const classNames of [['fg:red@w>=601px', 'fg:blue@w>=605px'], ['fg:blue@w>=605px', 'fg:red@w>=601px']]) {
      const css = createDefaultCSS()
      css.ensureClassRules(...classNames)
      expect(css.utilitiesLayer.text).toBe(expected)
    }
  })

  /**
   * Prevents (#233): min queries less than about 1rem apart sorting in reverse, so the narrower
   * query lands first and loses the cascade to the wider one where both match. Covers width and
   * height, px, rem decimals, container queries and ratios. Rows are listed in the expected order
   * and inserted in both orders.
   * Reverse-checked: the old `compareFeatureTuples` arithmetic reds every row and the 601/605 test.
   */
  test.each([
    ['px', ['block@w>=10px', 'block@w>=12px']],
    ['rem decimal', ['block@w>=1.25rem', 'block@w>=1.5rem']],
    ['height', ['block@h>=601px', 'block@h>=605px']],
    ['container', ['block@container(w>=601px)', 'block@container(w>=605px)']],
    ['container rem decimal', ['block@container(w>=1.25rem)', 'block@container(w>=1.5rem)']],
    ['aspect-ratio', ['block@aspect-ratio>=16/9', 'block@aspect-ratio>=2/1']]
  ])('orders close %s min queries from smallest to largest', (_, expected) => {
    for (const classNames of [expected, [...expected].reverse()]) {
      const css = createDefaultCSS()
      css.ensureClassRules(...classNames)
      expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
    }
  })

  /**
   * Prevents (#233): an exclusive bound (`>`, `<`) ordering by a fixed offset instead of by its
   * value, so `fg:red@w>600px` lands after `fg:blue@w>=600.1px` and wins on screens 600.1px and
   * wider. Bounds order by value; on the same value the exclusive one matches less and comes later.
   * Covers min and max bounds, ratios, and a range whose ends are both exclusive. Rows are listed in
   * the expected order and inserted in both orders.
   * Reverse-checked: the fixed 0.02 offset this replaces reds the three close rows, and nothing
   * else in this file; review r1 of #233 found dropping the exclusive adjustment puts `w>600px`
   * first in the same-value min row.
   */
  test.each([
    ['inclusive and exclusive min on one value', ['fg:red@w>=600px', 'fg:blue@w>600px']],
    ['exclusive min below a close inclusive min', ['fg:red@w>600px', 'fg:blue@w>=600.1px']],
    ['exclusive ratio min below a close inclusive one', ['fg:red@aspect-ratio>1/1', 'fg:blue@aspect-ratio>=101/100']],
    ['inclusive and exclusive max on one value', ['fg:red@w<=600px', 'fg:blue@w<600px']],
    ['exclusive max above a close inclusive max', ['fg:red@w<600px', 'fg:blue@w<=599.9px']],
    ['exclusive range inside an inclusive one', ['fg:red@w>=600px&w<=800px', 'fg:blue@w>600px&w<800px']]
  ])('orders %s by value, then exclusivity', (_, expected) => {
    for (const classNames of [expected, [...expected].reverse()]) {
      const css = createDefaultCSS()
      css.ensureClassRules(...classNames)
      expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
    }
  })

  /**
   * Prevents: two overlapping ranges of the same width swapping order, which flips the winner
   * where they overlap (650px to 700px). Equal widths keep the order they had before #233: the
   * range that starts higher comes first.
   */
  test('orders equal-width ranges with the higher start first', () => {
    const expected = ['fg:red@w>=650px&w<=750px', 'fg:blue@w>=600px&w<=700px']
    for (const classNames of [expected, [...expected].reverse()]) {
      const css = createDefaultCSS()
      css.ensureClassRules(...classNames)
      expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
    }
  })

  /**
   * Prevents: rules querying different features swapping order, which flips the winner where both
   * match (both rules set `color`). Feature lists compare by feature name first, so the `height`
   * rule comes before the `width` rule; compiled component blocks share this comparison.
   * Reverse-checked (review r1 of #233): comparing feature names in reverse puts the width rule first.
   */
  test('orders queries on different features by feature name', () => {
    const expected = ['fg:red@h>=600px', 'fg:blue@w>=600px']
    for (const classNames of [expected, [...expected].reverse()]) {
      const css = createDefaultCSS()
      css.ensureClassRules(...classNames)
      expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
    }
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
