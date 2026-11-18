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
   * (`src/utility.ts`) reddens this test and the raw group declaration record below, whose
   * item then generates `color:var(--color-red),`.
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
   * Guards: an empty item inside a function in a group item. The group parses its own value, so
   * `{fg:rgb(1,2,)}` is rejected by the function check above.
   *
   * Reverse check: the same as the function cases; skipping that call reddens this test too.
   */
  test('a group item with an empty function argument generates no CSS', () => {
    expect(generateText('{fg:rgb(1,2,)}')).toBe('')
  })

  /**
   * Records known-wrong output, not a contract: a group item whose top-level value is rejected
   * (`fg:red,`) generates no rule, and `emitGroupDeclarations` then writes it as a raw
   * declaration. Telling a rejected value from a raw declaration needs the rejection reason from
   * `StetCSS.createRules`, which this fix does not reach; see the #175 status record. Trade-off
   * (rule 6): this pins the current output so a change to it is deliberate, in place of a guard
   * that the group is rejected.
   */
  test('a group item with an empty top-level item keeps its raw declaration', () => {
    expect(generateText('{fg:red,}')).toBe('@layer utilities{.\\{fg\\:red\\,\\}{fg:red,}}')
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
