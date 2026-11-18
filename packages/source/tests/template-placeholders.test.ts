import { describe, expect, test } from 'vitest'
import { extractAstroClasses, extractClassCandidates, extractVueClasses } from '../src'

/**
 * Guards: a template literal's `${…}` placeholder is code that the host fills in at runtime, and
 * the text touching it is a fragment of a class that only exists then (`grid-` in
 * `grid-${size}`). Text extraction kept both as candidates, so `stetcss inspect` reported
 * `${size}` and `grid-${size}` as invalid classes (#195). The strings inside a placeholder may
 * still be whole classes, so dropping them would drop CSS.
 */
describe('template literal placeholders', () => {
  /**
   * Reverse check: skipping the placeholder pass in `extractClassCandidates` turns every test
   * here but the unclosed-placeholder one red.
   */
  test('extracts the classes beside a placeholder, not the placeholder', () => {
    expect(extractClassCandidates('<div class={`grid ${size}`}></div>')).toEqual(['grid'])
  })

  /**
   * Reverse check: letting a fragment run through quotes turns only this test red; keeping the
   * fragment before a placeholder turns this test and the expression-string test red.
   */
  test('drops the class fragments touching a placeholder', () => {
    expect(extractClassCandidates('`grid-${size} m:1 ${a}x${b}-y "p:2${c}" ${d}` cn("bg:blue",`${e}`)')).toEqual([
      'm:1',
      'bg:blue'
    ])
  })

  /**
   * Reverse check: dropping the string literals of an expression turns this test and the
   * existing nested-template-literal test red; keeping the expression code turns every test here but
   * the unclosed-placeholder one red.
   */
  test('extracts the strings inside a placeholder expression, not its code', () => {
    expect(extractClassCandidates('`block ${on ? \'fg:red\' : "bg:blue"} ${size > 1 ? `p:${size}x mt:2` : \'\'}`')).toEqual([
      'block',
      'fg:red',
      'bg:blue',
      'mt:2'
    ])
  })

  /**
   * Reverse check: letting the closing-brace scan read a `}` inside a string turns only this test
   * red, with the code after that brace (`size`) as a candidate.
   */
  test('closes a placeholder after the braces and strings its expression holds', () => {
    expect(extractClassCandidates('`a ${f({ k: \'}\' }) ? \'fg:red\' : size }x b`')).toEqual(['a', 'fg:red', 'b'])
  })

  /**
   * Reverse check: running an unclosed placeholder to the end of the content turns only this test
   * red.
   */
  test('leaves an unclosed placeholder as text', () => {
    expect(extractClassCandidates('m:1 ${size fg:red')).toEqual(['m:1', 'fg:red'])
  })

  test('extracts only the classes beside a placeholder in Astro markup', () => {
    expect(extractAstroClasses('Page.astro', '<div class={`grid ${size}`}></div>')).toEqual(['grid'])
  })

  test('extracts only the classes beside a placeholder in a Vue class binding', async () => {
    await expect(extractVueClasses('App.vue', '<template><div :class="`grid ${size}`"></div></template>')).resolves.toEqual(['grid'])
  })
})
