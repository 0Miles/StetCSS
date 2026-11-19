import { describe, expect, test } from 'vitest'
import { extractAstroClasses, extractClassCandidates, extractOxcClasses, extractSourceClassCandidates, extractVueClasses } from '../src'

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
   * Reverse check: dropping the string literals of an expression turns this test, the braces test
   * and the nested template literals case of `tests/deep-nesting.test.ts` red; keeping the expression code turns
   * every test here but the unclosed-placeholder ones red.
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
   * Reverse check: letting the walk read a `}` inside a string closes the placeholder early and
   * turns this test red with the code after that brace (`size`) as a candidate.
   */
  test('closes a placeholder after the braces and strings its expression holds', () => {
    expect(extractClassCandidates('`a ${f({ k: \'}\' }) ? \'fg:red\' : size }x b`')).toEqual(['a', 'fg:red', 'b'])
  })

  /**
   * Guards the CSS output change: an identifier in placeholder code that names a class (`block`,
   * `hidden`) generated its rule although the host only fills in its value. Reverse check: keeping
   * the expression code turns this test red.
   */
  test('extracts no class from the identifiers of placeholder code', () => {
    expect(extractClassCandidates('`flex ${on ? block : hidden}`')).toEqual(['flex'])
  })

  /**
   * Reverse check: running an unclosed placeholder to the end of the content turns only this test
   * red.
   */
  test('leaves an unclosed placeholder as text', () => {
    expect(extractClassCandidates('m:1 ${size fg:red')).toEqual(['m:1', 'fg:red'])
  })

  /**
   * Guards: prose that writes a lone `${`, as MDX and Astro docs pages do, ended the pass there,
   * so every later placeholder came back as a candidate. Reverse check: stopping the pass at the
   * first unclosed `${` turns this test red with `${size}`.
   */
  test('reads the placeholders after an unclosed `${`', () => {
    expect(extractClassCandidates('Type `${` to start one.\n\n<div class={`grid ${size}`} />')).toEqual([
      'Type',
      'to',
      'start',
      'one',
      'grid'
    ])
  })

  /** The ticket's repro, through the adapter that reported it. */
  test('extracts only the classes beside a placeholder in Astro markup', () => {
    expect(extractAstroClasses('Page.astro', '<div class={`grid ${size}`}></div>')).toEqual(['grid'])
  })

  /** The ticket's repro in a Vue class binding, which reaches text extraction the same way. */
  test('extracts only the classes beside a placeholder in a Vue class binding', async () => {
    await expect(extractVueClasses('App.vue', '<template><div :class="`grid ${size}`"></div></template>')).resolves.toEqual(['grid'])
  })
})

/** A class expression written the same way in each source whose markup holds one. */
const classExpressionSources: [name: string, source: string, wrap: (expression: string) => string][] = [
  ['TSX', 'App.tsx', (expression) => `export const App = () => <div className={${expression}} />`],
  ['JSX', 'App.jsx', (expression) => `export const App = () => <div className={${expression}} />`],
  ['Svelte', 'Component.svelte', (expression) => `<div class={${expression}}></div>`],
  ['Astro', 'Page.astro', (expression) => `<div class={${expression}}></div>`],
  ['Vue', 'App.vue', (expression) => `<template><div :class="${expression}"></div></template>`],
  ['MDX', 'page.mdx', (expression) => `<div className={${expression}} />`]
]

/**
 * Guards: JSX, TSX and Svelte markup expressions parse with oxc, which read only the template
 * literals without a placeholder, so `grid` in `` `grid ${size}` `` generated no CSS there while
 * Astro, Vue and MDX, which reach text extraction, generated it (#243).
 */
describe('template literal placeholders in every source', () => {
  /**
   * The ticket's repro in each source. Reverse check: reading no static text from a template
   * literal with a placeholder in `src/adapters/oxc.ts` turns the TSX, JSX and Svelte cases red,
   * and the next test's.
   */
  test.each(classExpressionSources)('extracts the class beside a placeholder in %s', async (_, source, wrap) => {
    await expect(extractSourceClassCandidates({ source, content: wrap('`grid ${size}`') })).resolves.toEqual(['grid'])
  })

  /**
   * Guards: a parsed template literal drops the fragments text extraction drops, so a class beside
   * a placeholder generates CSS in every source or in none. Fragments touching a placeholder (`grid-`,
   * `x`, `-y`, `p:2`) and placeholder code (`size`, `block`) are no candidates; the strings an
   * expression holds and the whole classes of a nested template literal are. Reverse check:
   * keeping the fragments in `src/adapters/oxc.ts` turns only the TSX, JSX and Svelte cases red,
   * with `grid-` among them.
   */
  test.each(classExpressionSources)('extracts the same classes from a template literal with placeholders in %s', async (_, source, wrap) => {
    const expression = '`grid-${size} m:1 ${a}x${b}-y \'p:2${c}\' ${on ? \'fg:red\' : block} ${size > 1 ? `p:${size}x mt:2` : \'\'}`'
    await expect(extractSourceClassCandidates({ source, content: wrap(expression) })).resolves.toEqual([
      'm:1',
      'fg:red',
      'mt:2'
    ])
  })
})

/**
 * Guards: the static text of a parsed template literal is read as the script runs it, with its
 * escape sequences decoded, so `\t` separates two classes as the tab it stands for does; read as
 * written, `grid\tm:1` is one invalid class and neither generates CSS. Parsed sources only: text
 * extraction reads the literal as written. Reverse check: reading the raw text before the cooked
 * text in `src/adapters/oxc.ts` turns only this test red, with `grid\tm:1`.
 */
test('reads a template literal with placeholders by its decoded escape sequences', () => {
  expect(extractOxcClasses('App.tsx', 'export const App = () => <div className={`grid\\tm:1 ${x}`} />')).toEqual(['grid', 'm:1'])
})
