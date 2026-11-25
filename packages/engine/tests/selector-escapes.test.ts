import { describe, expect, test } from 'vitest'
import { StetCSS } from '../src'
import { cloneManifest, createDefaultCSS } from './helpers/css-tester'

function generateText(className: string) {
  const css = createDefaultCSS()
  css.ensureClassRules(className)
  return css.text
}

describe.concurrent('escapes in a class selector', () => {
  /**
   * Guards: the selector parser dropped every `\`, so `.literal\:first` read as the class
   * `.literal` and the `:first` alias (`:first-child`), and `.a\.b` as two classes. Each class
   * then matched elements the author never wrote, and missed the one they did. An escaped
   * character is part of the name, as in plain CSS, and stays escaped in the output.
   *
   * Reverse check: dropping the `\\[\s\S]` alternative from `SELECTOR_REGEX` in
   * `src/utils/parse-selector.ts` reddens these rows and the escaped `:dk` rows below.
   */
  test.each([
    ['block:is(.literal\\:first)', '@layer utilities{.block\\:is\\(\\.literal\\\\\\:first\\):is(.literal\\:first){display:block}}'],
    ['block:is(.a\\.b)', '@layer utilities{.block\\:is\\(\\.a\\\\\\.b\\):is(.a\\.b){display:block}}'],
  ])('%s keeps its escapes', (className, expected) => {
    expect(generateText(className)).toBe(expected)
  })

  /**
   * Guards: a state token split at every `@`, so `block.a\@sm` emitted `.a` inside the `@sm` media
   * query instead of the class `.a\@sm` (one class in plain CSS), and the editor and the validator
   * disagreed on it. An escaped `@` is a name character; an unescaped `@` after it still stacks a
   * condition.
   *
   * Reverse check: dropping the `\\` branch from `splitStateToken` in `src/utility.ts` reddens
   * these rows only.
   */
  test.each([
    ['block.a\\@sm', '@layer utilities{.block\\.a\\\\\\@sm.a\\@sm{display:block}}'],
    ['block:is(.a\\@sm)', '@layer utilities{.block\\:is\\(\\.a\\\\\\@sm\\):is(.a\\@sm){display:block}}'],
    ['block.a\\@sm@sm', '@layer utilities{@media (width>=52.125rem){.block\\.a\\\\\\@sm\\@sm.a\\@sm{display:block}}}'],
  ])('%s keeps its escaped `@` in the selector', (className, expected) => {
    expect(generateText(className)).toBe(expected)
  })

  /**
   * Guards: a `:` variant token right after a `\` was split off the selector as a variant, so
   * `block.a\:dk` with a `:dk` variant emitted `.dark .block\.a\\\:dk.a`: the class lost the
   * escaped `:dk` of its name and gained a `.dark` ancestor nobody wrote. The same happened past an
   * escaped `)` inside `:is()`, which ended the parentheses early. An escaped `:` is a name
   * character, never the start of a variant.
   *
   * Reverse check: removing the `\\` branch from `splitSelectorToken` in `src/utility.ts` reddens
   * the first row; removing the escape skip outside quotes from `findClosingParen` reddens the
   * second.
   */
  test.each([
    ['block.a\\:dk', '@layer utilities{.block\\.a\\\\\\:dk.a\\:dk{display:block}}'],
    ['block:is(.a\\):dk)', '@layer utilities{.block\\:is\\(\\.a\\\\\\)\\:dk\\):is(.a\\):dk){display:block}}'],
  ])('%s keeps the escaped `:dk` in its selector', (className, expected) => {
    const manifest = cloneManifest()
    manifest.variants = [...(manifest.variants || []), { token: ':dk', branches: [{ selector: '.dark &' }] }]
    const css = StetCSS.create({ manifest })
    css.ensureClassRules(className)
    expect(css.text).toBe(expected)
  })

  /**
   * Guards: an unescaped selector keeps its output: the `:first` alias still expands, `__` stays a
   * BEM name, `_` is still a descendant space, and an unescaped `:dk` still applies its variant.
   *
   * Reverse check: adding `_` to the name characters of `SELECTOR_REGEX` reddens the `_` row;
   * removing the `selectors` alias lookup from `parseSelector` reddens the two `:first` rows.
   */
  test.each([
    ['block:is(.a):first', '@layer utilities{.block\\:is\\(\\.a\\)\\:first:is(.a):first-child{display:block}}'],
    ['block.a:first', '@layer utilities{.block\\.a\\:first.a:first-child{display:block}}'],
    ['block:is(.a__b)', '@layer utilities{.block\\:is\\(\\.a__b\\):is(.a__b){display:block}}'],
    ['block:is(.a_b)', '@layer utilities{.block\\:is\\(\\.a_b\\):is(.a b){display:block}}'],
  ])('%s without escapes keeps its output', (className, expected) => {
    expect(generateText(className)).toBe(expected)
  })
})
