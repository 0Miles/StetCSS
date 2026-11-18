import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

function generateText(className: string) {
  const css = createDefaultCSS()
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent('empty items in a value list', () => {
  /**
   * Guards: a comma at the start or end of a value, or two in a row, leaves an empty list item.
   * `fg:red,` emitted `color:var(--color-red),` plus the theme variables for red; native CSS
   * drops that declaration, so the class did nothing but ship dead CSS. A value whose top-level
   * comma list has an empty item is invalid, so the class generates nothing, as `hidden.a,`
   * does for selectors (#165).
   *
   * Reverse check: skipping the `hasEmptyListItem` call in `parseValues` (`src/utility.ts`)
   * reddens only this test.
   */
  test.each([
    'fg:red,',
    'bg:red,',
    'm:10,',
    'font-family:a,',
    'fg:,red',
    'fg:red,:hover',
    'fg:red,@sm',
    'font-family:a,|',
    'font-family:a,!',
    'font-family:a,,b'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards: the check above rejecting complete lists. A comma followed by a `|` space and an item,
   * multi-value lists, and a comma inside a function (`var(--x,)` has a valid empty fallback) keep
   * their output.
   *
   * Reverse check: treating `|` spaces as list commas in `hasEmptyListItem`, or also running it
   * when a nested `parseValues` closes a function, reddens only this test.
   */
  test('complete lists and function commas keep their rules', () => {
    expect(generateText('font-family:a,b')).toBe('@layer utilities{.font-family\\:a\\,b{font-family:a,b}}')
    expect(generateText('font-family:a,|b')).toBe('@layer utilities{.font-family\\:a\\,\\|b{font-family:a, b}}')
    expect(generateText('transition:opacity|.3s,transform|.3s')).toBe('@layer utilities{.transition\\:opacity\\|\\.3s\\,transform\\|\\.3s{transition:opacity 0.3s,transform 0.3s}}')
    expect(generateText('fg:var(--x,)')).toBe('@layer utilities{.fg\\:var\\(--x\\,\\){color:var(--x,)}}')
  })
})
