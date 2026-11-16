import { describe, expect, test } from 'vitest'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { MasterCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'

type ModeTrigger = NonNullable<StetCSSManifest['settings']>['modeTrigger']

const createCSS = (modeTrigger: ModeTrigger) => {
  const manifest = cloneManifest()
  manifest.settings = { ...(manifest.settings || {}), modeTrigger, modes: ['light', 'dark'] }
  manifest.variants = [
    ...(manifest.variants || []),
    { token: '@touch', branches: [{ conditions: ['media(hover:none)'] }, { conditions: ['media(pointer:coarse)'] }] },
    { token: ':hocus', branches: [{ selector: '&:hover' }, { selector: '&:focus-visible' }] },
    { token: '@lay', branches: [{ layer: 'components' }, { conditions: ['media(print)'], layer: 'base' }] },
    { token: '@condsel', branches: [{ selector: '.touch &', conditions: ['media(hover:none)'] }, { selector: '&:active' }] }
  ]
  return MasterCSS.create({ manifest })
}

/**
 * Exact output of classes stacking multi-branch variants: two selector branches times two condition
 * branches, a variant whose branches set different layers (`@lay`), and one whose branches carry a
 * selector and a condition together (`@condsel`), each with a mode, under every mode trigger. The
 * expected values are the output before the branch-resolution rewrite (71e779632), so a change to
 * branch order, a branch's selector, conditions, layer or `!important`, or where the mode condition
 * goes turns this red. `generate()` order is pinned as well as the sorted sheet: the sheet alone
 * hides a swapped branch order. Reverse check: putting the mode's `prefers-color-scheme` before the
 * branch's media queries in `src/utility.ts`, or swapping the nesting of the condition-variant
 * `flatMap` in `resolveStateBranches`, turns this test red.
 *
 * Stacked media conditions join with `and` (`(hover:none) and (prefers-color-scheme:dark)`) and a
 * media type leads (`print and (…)`) since #72; before it the strings had no `and`, a query
 * browsers drop.
 */
describe('multi-branch variant output', () => {
  const classNames = ['fg:red:hocus@touch@light', '{block;fg:red}:hocus@touch@dark', 'p:10!:hocus@lay@dark', 'block@condsel@dark@touch']
  const expected: Record<'media' | 'class' | 'host', { rules: Record<string, [string, string][]>, text: string }> = {
    media: {
      rules: {
        'fg:red:hocus@touch@light': [
          ['@media (hover:none) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}', 'utilities'],
          ['@media (hover:none) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}', 'utilities']
        ],
        '{block;fg:red}:hocus@touch@dark': [
          ['@media (hover:none) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (hover:none) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}', 'utilities']
        ],
        'p:10!:hocus@lay@dark': [
          ['@media (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}', 'components'],
          ['@media print and (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}', 'base'],
          ['@media (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}', 'components'],
          ['@media print and (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}', 'base']
        ],
        'block@condsel@dark@touch': [
          ['@media (hover:none) and (hover:none) and (prefers-color-scheme:dark){.touch .block\\@condsel\\@dark\\@touch{display:block}}', 'utilities'],
          ['@media (hover:none) and (pointer:coarse) and (prefers-color-scheme:dark){.touch .block\\@condsel\\@dark\\@touch{display:block}}', 'utilities'],
          ['@media (hover:none) and (prefers-color-scheme:dark){.block\\@condsel\\@dark\\@touch:active{display:block}}', 'utilities'],
          ['@media (pointer:coarse) and (prefers-color-scheme:dark){.block\\@condsel\\@dark\\@touch:active{display:block}}', 'utilities']
        ]
      },
      text: '@layer theme{:root{--color-red-60:oklch(60.94% .2501 29.2);--color-red-50:oklch(62.82% .25 28.6)}@media (prefers-color-scheme:light){:root{--color-red:var(--color-red-60)}}@media (prefers-color-scheme:dark){:root{--color-red:var(--color-red-50)}}}@layer base{@media print and (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}@media print and (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}}@layer components{@media (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}@media (prefers-color-scheme:dark){.p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}}@layer utilities{@media (hover:none) and (hover:none) and (prefers-color-scheme:dark){.touch .block\\@condsel\\@dark\\@touch{display:block}}@media (hover:none) and (pointer:coarse) and (prefers-color-scheme:dark){.touch .block\\@condsel\\@dark\\@touch{display:block}}@media (hover:none) and (prefers-color-scheme:dark){.block\\@condsel\\@dark\\@touch:active{display:block}}@media (pointer:coarse) and (prefers-color-scheme:dark){.block\\@condsel\\@dark\\@touch:active{display:block}}@media (hover:none) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}@media (pointer:coarse) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}@media (hover:none) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}@media (pointer:coarse) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}@media (hover:none) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}@media (pointer:coarse) and (prefers-color-scheme:dark){.\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}@media (hover:none) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}@media (pointer:coarse) and (prefers-color-scheme:light){.fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}}'
    },
    class: {
      rules: {
        'fg:red:hocus@touch@light': [
          ['@media (hover:none){.light .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){.light .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}', 'utilities'],
          ['@media (hover:none){.light .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){.light .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}', 'utilities']
        ],
        '{block;fg:red}:hocus@touch@dark': [
          ['@media (hover:none){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (hover:none){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}', 'utilities']
        ],
        'p:10!:hocus@lay@dark': [
          ['.dark .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}', 'components'],
          ['@media print{.dark .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}', 'base'],
          ['.dark .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}', 'components'],
          ['@media print{.dark .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}', 'base']
        ],
        'block@condsel@dark@touch': [
          ['@media (hover:none) and (hover:none){.touch .dark .block\\@condsel\\@dark\\@touch{display:block}}', 'utilities'],
          ['@media (hover:none) and (pointer:coarse){.touch .dark .block\\@condsel\\@dark\\@touch{display:block}}', 'utilities'],
          ['@media (hover:none){.dark .block\\@condsel\\@dark\\@touch:active{display:block}}', 'utilities'],
          ['@media (pointer:coarse){.dark .block\\@condsel\\@dark\\@touch:active{display:block}}', 'utilities']
        ]
      },
      text: '@layer theme{.light,:root{color-scheme:light;--color-red:var(--color-red-60)}:root{--color-red-60:oklch(60.94% .2501 29.2);--color-red-50:oklch(62.82% .25 28.6)}.dark{color-scheme:dark;--color-red:var(--color-red-50)}}@layer base{@media print{.dark .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}@media print{.dark .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}}@layer components{.dark .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}.dark .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}@layer utilities{@media (hover:none) and (hover:none){.touch .dark .block\\@condsel\\@dark\\@touch{display:block}}@media (hover:none) and (pointer:coarse){.touch .dark .block\\@condsel\\@dark\\@touch{display:block}}@media (hover:none){.dark .block\\@condsel\\@dark\\@touch:active{display:block}}@media (pointer:coarse){.dark .block\\@condsel\\@dark\\@touch:active{display:block}}@media (hover:none){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}@media (pointer:coarse){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}@media (hover:none){.light .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}@media (pointer:coarse){.light .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}@media (hover:none){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}@media (pointer:coarse){.dark .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}@media (hover:none){.light .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}@media (pointer:coarse){.light .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}}'
    },
    host: {
      rules: {
        'fg:red:hocus@touch@light': [
          ['@media (hover:none){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}', 'utilities'],
          ['@media (hover:none){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}', 'utilities']
        ],
        '{block;fg:red}:hocus@touch@dark': [
          ['@media (hover:none){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (hover:none){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}', 'utilities'],
          ['@media (pointer:coarse){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}', 'utilities']
        ],
        'p:10!:hocus@lay@dark': [
          [':host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}', 'components'],
          ['@media print{:host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}', 'base'],
          [':host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}', 'components'],
          ['@media print{:host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}', 'base']
        ],
        'block@condsel@dark@touch': [
          ['@media (hover:none) and (hover:none){.touch :host(.dark) .block\\@condsel\\@dark\\@touch{display:block}}', 'utilities'],
          ['@media (hover:none) and (pointer:coarse){.touch :host(.dark) .block\\@condsel\\@dark\\@touch{display:block}}', 'utilities'],
          ['@media (hover:none){:host(.dark) .block\\@condsel\\@dark\\@touch:active{display:block}}', 'utilities'],
          ['@media (pointer:coarse){:host(.dark) .block\\@condsel\\@dark\\@touch:active{display:block}}', 'utilities']
        ]
      },
      text: '@layer theme{:host(.light),:host{color-scheme:light;--color-red:var(--color-red-60)}:root{--color-red-60:oklch(60.94% .2501 29.2);--color-red-50:oklch(62.82% .25 28.6)}:host(.dark){color-scheme:dark;--color-red:var(--color-red-50)}}@layer base{@media print{:host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}}@media print{:host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}}@layer components{:host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:hover{padding:10!important}:host(.dark) .p\\:10\\!\\:hocus\\@lay\\@dark:focus-visible{padding:10!important}}@layer utilities{@media (hover:none) and (hover:none){.touch :host(.dark) .block\\@condsel\\@dark\\@touch{display:block}}@media (hover:none) and (pointer:coarse){.touch :host(.dark) .block\\@condsel\\@dark\\@touch{display:block}}@media (hover:none){:host(.dark) .block\\@condsel\\@dark\\@touch:active{display:block}}@media (pointer:coarse){:host(.dark) .block\\@condsel\\@dark\\@touch:active{display:block}}@media (hover:none){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}@media (pointer:coarse){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:hover{display:block;color:var(--color-red)}}@media (hover:none){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}@media (pointer:coarse){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:hover{color:var(--color-red)}}@media (hover:none){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}@media (pointer:coarse){:host(.dark) .\\{block\\;fg\\:red\\}\\:hocus\\@touch\\@dark:focus-visible{display:block;color:var(--color-red)}}@media (hover:none){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}@media (pointer:coarse){:host(.light) .fg\\:red\\:hocus\\@touch\\@light:focus-visible{color:var(--color-red)}}}'
    }
  }

  test.each(['media', 'class', 'host'] as const)('under modeTrigger %s', (modeTrigger) => {
    const css = createCSS(modeTrigger)
    const { rules, text } = expected[modeTrigger]
    const generateAll = () => Object.fromEntries(classNames.map((className) => [
      className,
      css.generate(className).map((rule) => [rule.text, rule.layerName])
    ]))

    expect(generateAll()).toEqual(rules)
    css.ensureClassRules(...classNames)
    expect(css.text).toBe(text)
    expect(generateAll()).toEqual(rules)

    css.refresh()
    css.ensureClassRules(...classNames)
    expect(css.text).toBe(text)
    expect(generateAll()).toEqual(rules)
  })
})
