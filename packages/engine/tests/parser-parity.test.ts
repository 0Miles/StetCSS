import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { generateCondition, generateSelector, parseCondition, parseSelector } from '../src/compiler'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

describe.concurrent('compiled condition parser parity', () => {
  const cases = [
    ['print', '@media print'],
    ['base', '@layer base'],
    ['default', '@layer defaults'],
    ['!print', '@media not print'],
    ['start', '@starting-style'],
    ['and()', '@media and'],
    ['or', '@media or'],
    ['not', '@media not'],
    [',', '@media or'],
    ['!', '@media not'],
    ['&', '@media and'],
    ['>=sm', '@media (width>=52.125rem)'],
    ['<=sm', '@media (width<=52.125rem)'],
    ['>sm', '@media (width>52.125rem)'],
    ['<sm', '@media (width<52.125rem)'],
    ['=sm', '@media (width=52.125rem)'],
    ['height>=sm', '@media (height>=52.125rem)'],
    ['w>=sm', '@media (width>=52.125rem)'],
    ['h>=sm', '@media (height>=52.125rem)'],
    ['container(h>160px)', '@container (height>160px)'],
    ['sidebar(sm)', '@container sidebar (width>=24rem)'],
    ['screen&print', '@media screen and print'],
    ['screen,print', '@media screen or print'],
    ['!screen', '@media not screen'],
    ['sm&<=lg', '@media (width>=52.125rem) and (width<=80rem)'],
    ['@media', '@media']
  ] as const

  test.each(cases)('%s', (input, expected) => {
    const condition = parseCondition(input, createDefaultCSS())
    expect(generateCondition(condition)).toBe(expected)
  })

  test('resolves custom at-rule and condition aliases from the compiled manifest', () => {
    const manifest = cloneManifest()
    manifest.conditions = {
      ...(manifest.conditions || {}),
      'supports-backdrop': {
        id: 'supports',
        nodes: [{
          type: 'group',
          children: [{ type: 'string', value: 'backdrop-filter:blur(0px)' }]
        }]
      }
    }
    const css = StetCSS.create({ manifest: manifest })

    expect(generateCondition(parseCondition('supports-backdrop', css))).toBe('@supports (backdrop-filter:blur(0px))')
    expect(generateCondition(parseCondition('container(sm)', css))).toBe('@container (width>=24rem)')
    expect(generateCondition(parseCondition('container(md)', css))).toBe('@container (width>=28rem)')
  })
})

/**
 * Prevents: query numbers being rewritten into rem, which breaks queries the way native CSS would
 * not: a unitless media feature such as `color>=8` becomes `color>=0.5rem` and never matches, and a
 * `px` breakpoint drifts away from its pixel width once the user changes the browser's font size.
 * Numbers stay as written, unitless ones included (like `font:14`), so `@>=768` is as inert as the
 * same query in plain CSS.
 * Reverse-checked: passing `'rem'` back to `parseValue` in `parse-condition.ts` reds the five
 * unitless rows and nothing else; the px and em rows guard that written units survive.
 */
describe.concurrent('query numbers keep the value and unit as written', () => {
  test.each([
    ['fg:red@media(color>=8)', '@media (color>=8){.fg\\:red\\@media\\(color\\>\\=8\\){color:var(--color-red)}}'],
    ['fg:red@media(grid:1)', '@media (grid:1){.fg\\:red\\@media\\(grid\\:1\\){color:var(--color-red)}}'],
    ['fg:red@media(-webkit-min-device-pixel-ratio:2)', '@media (-webkit-min-device-pixel-ratio:2){.fg\\:red\\@media\\(-webkit-min-device-pixel-ratio\\:2\\){color:var(--color-red)}}'],
    ['fg:red@>=768', '@media (width>=768){.fg\\:red\\@\\>\\=768{color:var(--color-red)}}'],
    ['fg:red@container(width>=400)', '@container (width>=400){.fg\\:red\\@container\\(width\\>\\=400\\){color:var(--color-red)}}'],
    ['fg:red@>=768px', '@media (width>=768px){.fg\\:red\\@\\>\\=768px{color:var(--color-red)}}'],
    ['fg:red@<50em', '@media (width<50em){.fg\\:red\\@\\<50em{color:var(--color-red)}}']
  ])('%s', (className, expected) => {
    expect(createDefaultCSS().createRule(className)?.text).toBe(expected)
  })
})

/**
 * Prevents (#184): a decimal or ratio in a query being split into two queries, such as
 * `@w>=600.5` compiling to `@media (width>=600) (width>=5)` or `@w>=.5rem` to `(width>=5rem)`,
 * which match the wrong widths; and a viewport feature written without `@media(...)`
 * (`min-resolution:`, `aspect-ratio>=`) landing in `@container`, where `resolution` does not
 * exist. The value stays as written, unit included (`.5` prints as the equal `0.5`).
 * Reverse-checked in `parse-condition.ts`: dropping `.` from the token regex reds the 600.5,
 * 37.5rem, 1.5dppx and .5rem rows; dropping `/` reds the 16/9 row (and the ratio ordering test in
 * `cascade-layer-parity.test.ts`); not merging a string value after a comparison reds the same
 * two; deciding the identifier from the raw token instead of its feature name reds the 1.5dppx row.
 */
describe.concurrent('query decimals and ratios stay one value', () => {
  test.each([
    ['block@w>=600.5', '@media (width>=600.5){.block\\@w\\>\\=600\\.5{display:block}}'],
    ['block@media(width>=37.5rem)', '@media (width>=37.5rem){.block\\@media\\(width\\>\\=37\\.5rem\\){display:block}}'],
    ['block@min-resolution:1.5dppx', '@media (min-resolution:1.5dppx){.block\\@min-resolution\\:1\\.5dppx{display:block}}'],
    ['block@aspect-ratio>=16/9', '@media (aspect-ratio>=16/9){.block\\@aspect-ratio\\>\\=16\\/9{display:block}}'],
    ['block@w>=.5rem', '@media (width>=0.5rem){.block\\@w\\>\\=\\.5rem{display:block}}']
  ])('%s', (className, expected) => {
    expect(createDefaultCSS().createRule(className)?.text).toBe(expected)
  })
})

/**
 * Prevents (#184): a feature written without `@media(...)` or `@container(...)` landing in the
 * wrong at-rule. Colon-form `resolution` features go to `@media`, since a container query cannot
 * test resolution and `@container (min-resolution:2dppx)` never matches; other colon-form
 * features keep the `@container` default, which is valid for width and height. A bare range
 * feature (`@aspect-ratio`) is a media feature, like `@w>=600`.
 * Reverse-checked in `parse-condition.ts`: treating every colon-form range feature as media reds
 * the min-width, width and max-height rows; matching only the raw token reds the resolution rows;
 * removing `aspect-ratio` from `CONDITION_COMPARABLE_FEATURES` in `common.ts` reds the
 * aspect-ratio row (and the 16/9 row above).
 */
describe.concurrent('query features without an at-rule pick the at-rule that can test them', () => {
  test.each([
    ['block@resolution:2dppx', '@media (resolution:2dppx){.block\\@resolution\\:2dppx{display:block}}'],
    ['block@max-resolution:2dppx', '@media (max-resolution:2dppx){.block\\@max-resolution\\:2dppx{display:block}}'],
    ['block@min-width:600px', '@container (min-width:600px){.block\\@min-width\\:600px{display:block}}'],
    ['block@width:600px', '@container (width:600px){.block\\@width\\:600px{display:block}}'],
    ['block@max-height:500px', '@container (max-height:500px){.block\\@max-height\\:500px{display:block}}'],
    ['block@aspect-ratio', '@media (aspect-ratio){.block\\@aspect-ratio{display:block}}']
  ])('%s', (className, expected) => {
    expect(createDefaultCSS().createRule(className)?.text).toBe(expected)
  })
})

describe.concurrent('compiled selector parser parity', () => {
  const cases = [
    ['.class', '&.class'],
    [':hover', '&:hover'],
    [':first', '&:first-child'],
    [':last', '&:last-child'],
    [':even', '&:nth-child(2n)'],
    [':odd', '&:nth-child(odd)'],
    [':nth-child(2)', '&:nth-child(2)'],
    [':nth(2)', '&:nth(2)'],
    [':nth-last(2)', '&:nth-last(2)'],
    ['::scrollbar-thumb', '&::-webkit-scrollbar-thumb'],
    ['::scrollbar-corner', '&::scrollbar-corner'],
    ['::view-transition-new(root)', '&::view-transition-new(root)'],
    ['::vt-new(root)', '&::vt-new(root)'],
    ['[open]', '&[open]'],
    [':has(.active)', '&:has(.active)'],
    [':of(.active)', '.active &'],
    [':of(#active)', '#active &'],
    [':of(active)', 'active &'],
    [':of(.active_)', '.active &'],
    [':of(.active>)', '.active>&'],
    [':first:focus:disabled', '&:first-child:focus:disabled'],
    [':not(:last)', '&:not(:last-child)'],
    [':has(:first)', '&:has(:first-child)'],
    [':before', '&::before'],
    ['::first-letter', '&::first-letter'],
    ['>.title', '&>.title'],
    ['*', '&*'],
    ['_hr+*', '& hr+*'],
    [':hover+div:has(:active)', '&:hover+div:has(:active)'],
    ['>li::before,>li::after', '&>li::before,&>li::after'],
    ['_.feature__tab-title', '& .feature__tab-title']
  ] as const

  test.each(cases)('%s', (input, expected) => {
    const nodes = parseSelector(input, createDefaultCSS(), false)
    expect(generateSelector(nodes, '&')).toBe(expected)
  })
})
