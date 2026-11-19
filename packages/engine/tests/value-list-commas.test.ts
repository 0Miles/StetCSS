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
   * Reverse check: skipping the `hasEmptyListItem` call at the end of `parseValues`
   * (`src/utility.ts`) reddens this test and the comma rows of `group-items.test.ts`, whose
   * items then generate rules such as `color:var(--color-red),`.
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
   * Guards: the same empty item in a function's arguments. `fg:rgb(1,2,)` emitted
   * `color:rgb(1,2,)`, which native CSS drops; unnamed parentheses belong to the function around
   * them (`calc((1,))`).
   *
   * Reverse check: skipping the `hasEmptyListItem` call where a nested `parseValues` closes a
   * function reddens this test and the group case below.
   */
  test.each([
    'fg:rgb(1,2,)',
    'fg:rgb(,1,2)',
    'fg:rgb(1,,2)',
    'fg:color-mix(in|srgb,red,)',
    'w:calc(1,)',
    'w:calc((1,))'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): the same empty item in a function the class leaves open. The engine closes the
   * function at the end of the class, so `fg:rgb(1,` emitted `color:rgb(1,)`, which native CSS
   * drops; the check above ran only where a `)` closed the function.
   *
   * Reverse check: without the empty-item check where `parseValues` reaches the end of the class
   * inside a function, these rows fail.
   */
  test.each([
    'fg:rgb(1,',
    'fg:rgb(,1',
    'fg:rgb(1,,2',
    'w:calc(1,',
    'w:calc((1,'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): the check above rejecting open functions as such. Closing a function at the end
   * of the class, as CSS closes one at the end of its input, keeps working when no argument is
   * empty, and an open `var()` keeps its empty fallback.
   */
  test('a function left open without an empty item keeps its rule', () => {
    expect(generateText('fg:rgb(1,2,3')).toBe('@layer utilities{.fg\\:rgb\\(1\\,2\\,3{color:rgb(1,2,3)}}')
    expect(generateText('fg:var(--x,')).toBe('@layer utilities{.fg\\:var\\(--x\\,{color:var(--x,)}}')
  })

  /**
   * Guards: an empty item inside a function in a group item. The group generates each item, so
   * `{fg:rgb(1,2,)}` is rejected by the function check above on `fg:rgb(1,2,)` (#234).
   *
   * Reverse check: the same as the function cases; skipping that call reddens this test too.
   */
  test('a group item with an empty function argument generates no CSS', () => {
    expect(generateText('{fg:rgb(1,2,)}')).toBe('')
  })

  /**
   * Guards: the checks above rejecting complete lists. A comma followed by a `|` space and an item,
   * multi-value lists, complete function arguments, and functions whose arguments may hold empty
   * items (`var()` and `env()` fallbacks, `attr()`, unquoted `url()`, custom `--*` functions) keep
   * their output.
   *
   * Reverse check: emptying `OPAQUE_ARGUMENT_FUNCTIONS` and the `--` exemption reddens only this
   * test; treating `|` spaces as list commas in `hasEmptyListItem` reddens this test and the
   * #358 `clamp()` case in `issue-regressions.test.ts`, whose arguments hold `|` spaces.
   */
  test('complete lists and opaque function arguments keep their rules', () => {
    expect(generateText('font-family:a,b')).toBe('@layer utilities{.font-family\\:a\\,b{font-family:a,b}}')
    expect(generateText('font-family:a,|b')).toBe('@layer utilities{.font-family\\:a\\,\\|b{font-family:a, b}}')
    expect(generateText('transition:opacity|.3s,transform|.3s')).toBe('@layer utilities{.transition\\:opacity\\|\\.3s\\,transform\\|\\.3s{transition:opacity 0.3s,transform 0.3s}}')
    expect(generateText('fg:rgb(1,2,3)')).toBe('@layer utilities{.fg\\:rgb\\(1\\,2\\,3\\){color:rgb(1,2,3)}}')
    expect(generateText('w:clamp(1px,2vw,3px)')).toBe('@layer utilities{.w\\:clamp\\(1px\\,2vw\\,3px\\){width:clamp(1px, 2vw, 3px)}}')
    expect(generateText('fg:var(--x,)')).toBe('@layer utilities{.fg\\:var\\(--x\\,\\){color:var(--x,)}}')
    expect(generateText('fg:var(--x,,)')).toBe('@layer utilities{.fg\\:var\\(--x\\,\\,\\){color:var(--x,,)}}')
    expect(generateText('fg:env(a,)')).toBe('@layer utilities{.fg\\:env\\(a\\,\\){color:env(a,)}}')
    expect(generateText('content:attr(a,)')).toBe('@layer utilities{.content\\:attr\\(a\\,\\){content:attr(a,)}}')
    expect(generateText('bg:url(a,)')).toBe('@layer utilities{.bg\\:url\\(a\\,\\){background-image:url(a,)}}')
    expect(generateText('fg:--f(a,)')).toBe('@layer utilities{.fg\\:--f\\(a\\,\\){color:--f(a,)}}')
  })
})
