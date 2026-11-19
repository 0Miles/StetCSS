import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

function generateText(className: string) {
  const css = createDefaultCSS()
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent('group items', () => {
  /**
   * Guards (#234): a group item whose value the engine rejects fell back to a raw declaration.
   * `{fg:red,}` emitted `.\{fg\:red\,\}{fg:red,}` and `{fg:red;bg:blue,}` kept `bg:blue,` next to
   * a valid `color`, both dead CSS. An item with an invalid value invalidates the whole group, as
   * an invalid value does a single class (#165, #175), whatever made it invalid: an empty list
   * item, `$()` or an alpha the variable does not take.
   *
   * Reverse check: writing a rejected item as a raw declaration again fails these rows.
   */
  test.each([
    '{fg:red,}',
    '{fg:red;bg:blue,}',
    '{bg:blue,;fg:red}',
    '{fg:red;bg:blue,}:hover',
    '{m:10,}',
    '{fg:red;font-family:a,}',
    '{fg:$(x)}',
    '{bg:neutral-30/50}',
    '{fg:red;{bg:blue,}}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): a function left open inside a group takes the group's closing `}` as an
   * argument, so the group never closes. `{fg:rgb(}` emitted `color:rgb(})`, and
   * `{fg:rgb(1,2,3}` emitted `color:rgb(1,2,3})`.
   *
   * Reverse check: without the check that a group's `{` closes at its own level, these rows fail.
   */
  test.each([
    '{fg:rgb(}',
    '{fg:rgb(1,}',
    '{fg:rgb(1,2,3}',
    '{fg:calc(1+2}',
    '{fg:red;{bg:blue}'
  ])('%s generates no CSS', (className) => {
    expect(generateText(className)).toBe('')
  })

  /**
   * Guards (#234): rejecting items for their value must not reject items that match nothing,
   * which a group writes as raw declarations (`{top:48}`, `{flex:col}`), nor complete lists and
   * function arguments.
   */
  test.each([
    ['{top:48}', '@layer utilities{.\\{top\\:48\\}{top:48}}'],
    ['{top:48;left:1}', '@layer utilities{.\\{top\\:48\\;left\\:1\\}{top:48;left:1}}'],
    ['{flex:col}', '@layer utilities{.\\{flex\\:col\\}{flex:col}}'],
    ['{display:flex;foo-bar:1}', '@layer utilities{.\\{display\\:flex\\;foo-bar\\:1\\}{display:flex;foo-bar:1}}'],
    ['{font-family:a,b}', '@layer utilities{.\\{font-family\\:a\\,b\\}{font-family:a,b}}'],
    ['{fg:rgb(1,2,3)}', '@layer utilities{.\\{fg\\:rgb\\(1\\,2\\,3\\)\\}{color:rgb(1,2,3)}}'],
    ['{transition:opacity|.3s,transform|.3s}', '@layer utilities{.\\{transition\\:opacity\\|\\.3s\\,transform\\|\\.3s\\}{transition:opacity 0.3s,transform 0.3s}}']
  ])('%s keeps its rule', (className, text) => {
    expect(generateText(className)).toBe(text)
  })
})
