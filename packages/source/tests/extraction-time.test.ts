import { describe, expect, test } from 'vitest'
import { extractClassCandidates } from '../src'

// Long runs of tags, brackets or keywords without whitespace: what generated
// data and minified bundles contain, and what JS/TS nested past the oxc
// prescan hands to text extraction. Each input carries a quoted class to find.
const shapes: [name: string, nest: (depth: number) => string][] = [
  ['nested JSX elements', (depth) => `x=${'<a>'.repeat(depth)}'block'${'</a>'.repeat(depth)}`],
  // The upstream 20,000-deep JSX, as deep-nesting.test.ts sends it through oxc.ts
  ['nested JSX elements with a class attribute', (depth) => `x=<a className="block">${'<a>'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['nested parentheses', (depth) => `x=${'('.repeat(depth)}'block'${')'.repeat(depth)}`],
  ['nested arrays', (depth) => `x=${'['.repeat(depth)}'block'${']'.repeat(depth)}`],
  ['nested braces', (depth) => `x=${'{'.repeat(depth)}'block'${'}'.repeat(depth)}`],
  ['unclosed parentheses before a colon', (depth) => `x='block' a${'('.repeat(depth)}:b`],
  ['unclosed braces after letters', (depth) => `x='block' ${'a{'.repeat(depth)}`],
  ['unclosed object arguments', (depth) => `x='block' a${'({aaaa'.repeat(depth)}`],
  ['trailing punctuation before a letter', (depth) => `x='block' ${'(['.repeat(depth)}a`],
  ['unclosed require calls', (depth) => `x='block' ${'require('.repeat(depth)}`],
  ['unclosed import calls', (depth) => `x='block' ${'import('.repeat(depth)}`],
  ['imports without a source', (depth) => `x='block' ${'import a '.repeat(depth)}`],
  ['unclosed style tags', (depth) => `x='block' ${'<style>'.repeat(depth)}`],
  ['unclosed HTML comments', (depth) => `x='block' ${'<!--'.repeat(depth)}`],
  ['decorator lines without a declaration', (depth) => `x='block'\n${'@x\n'.repeat(depth)}`],
  ['a long line of at signs', (depth) => `x='block'\n${'@'.repeat(depth)}\n`],
  ['unclosed placeholders', (depth) => `x='block' ${'${'.repeat(depth)}`],
  ['unclosed placeholders in template literals', (depth) => `x='block' ${'${`'.repeat(depth)}`]
]

/**
 * Guards: text extraction scans a token once per character, not once per
 * character pair, so a 20,000-long run without whitespace no longer stalls a
 * build or dev server for seconds to minutes. The budget is far above the
 * linear cost (a few milliseconds) to stay clear of loaded CI machines. Reverse check, putting
 * back one replaced regex at a time (`src/extraction-scans.ts`):
 * `KEEP_TOKEN`'s brace alternative turns the JSX, parentheses, arrays, style
 * and comment cases red; `trimTrailing` the trailing-punctuation case;
 * `hasParenthesizedArrow` the require and import call cases; `getGroupBody`
 * the unclosed-brace and object-argument cases; `hasObjectArgument` the
 * object-argument case; each pre-exclusion scan the case named after what it
 * strips. The braces, parentheses-before-a-colon and at-sign cases exceed the
 * budget only with several of them back; the class-attribute case pins the
 * input the deep-nesting tests hand to text extraction. In
 * `src/template-placeholders.ts`, walking on past a `${` in placeholder code
 * or scanning back for the fragment before every unclosed `${` turns the
 * unclosed-placeholder case red, and re-walking the `${` left open inside an
 * unclosed placeholder the template-literal case.
 */
describe('text extraction of runs 20,000 long without whitespace', () => {
  test.each(shapes)('%s finish within a second and keep their classes', (_, nest) => {
    const content = nest(20_000)
    const start = performance.now()
    const classes = extractClassCandidates(content)
    const elapsed = performance.now() - start

    expect(classes).toContain('block')
    expect(elapsed).toBeLessThan(1_000)
  })
})
