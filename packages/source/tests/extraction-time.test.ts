import { describe, expect, test } from 'vitest'
import { extractClassCandidates } from '../src'

// Runs of tags or brackets with no whitespace become one huge token. These are
// what JS/TS nested past the oxc prescan, or that oxc fails to parse, hand to
// text extraction. Each shape carries a quoted class to find.
const shapes: [name: string, nest: (depth: number) => string][] = [
  ['nested JSX elements', (depth) => `x=${'<a>'.repeat(depth)}'block'${'</a>'.repeat(depth)}`],
  ['nested parentheses', (depth) => `x=${'('.repeat(depth)}'block'${')'.repeat(depth)}`],
  ['nested arrays', (depth) => `x=${'['.repeat(depth)}'block'${']'.repeat(depth)}`],
  ['nested braces', (depth) => `x=${'{'.repeat(depth)}'block'${'}'.repeat(depth)}`],
  ['unclosed parentheses before a colon', (depth) => `x='block' a${'('.repeat(depth)}:b`]
]

/**
 * Guards: text extraction scans a token once per character, not once per
 * character pair, so a 20,000-deep run without whitespace (generated data,
 * minified bundles) no longer stalls a build or dev server for tens of
 * seconds; before the fix the JSX case took over a minute. The budget is
 * far above the linear cost (a few milliseconds) to stay clear of loaded CI
 * machines. Reverse check: testing `/\S*\{\S*\}/` in place of
 * `hasBraceGroup` turns the JSX, parentheses and arrays cases red; stripping
 * trailing characters with `/[([{\\:#=.]+$/` turns the parentheses, arrays and
 * braces cases red; testing `/\(.*\)=>/` in place of `hasParenthesizedArrow`
 * turns the unclosed-parentheses case red.
 */
describe('text extraction of runs 20,000 deep without whitespace', () => {
  test.each(shapes)('%s finish within a second and keep their classes', (_, nest) => {
    const content = nest(20_000)
    const start = performance.now()
    const classes = extractClassCandidates(content)
    const elapsed = performance.now() - start

    expect(classes).toContain('block')
    expect(elapsed).toBeLessThan(1_000)
  })
})
