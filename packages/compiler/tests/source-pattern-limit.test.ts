import { describe, expect, it } from 'vitest'
import { compileCSS } from '../src'

describe('@source brace expansion limit', () => {
  /**
   * Guards builds against `@source` and `@source not` patterns whose braces expand into more
   * globs than file listing can afford: the pattern must fail where the directive is read, and
   * the error must name it so the developer can find the line.
   * Reverse check: raising the limit turns this test, the boundary test below, and the
   * stylesheet build test red.
   */
  it.each([
    ['@source', `src/${'{a,b}'.repeat(11)}.tsx`],
    ['@source not', `src/${'{a,b}'.repeat(11)}.tsx`],
    ['@source', 'src/{1..32}{a,{b,c},d}{0..8}.tsx']
  ])('rejects %s \'%s\', which expands past 1024 patterns', (directive, pattern) => {
    expect(() => compileCSS(`${directive} '${pattern}';`))
      .toThrow(`${directive} '${pattern}' expands its braces into more than 1024 patterns`)
  })

  /**
   * Guards patterns within the limit, counting nested groups and ranges as glob matching expands
   * them: exactly 1024 patterns still compile, and the pattern reaches the source list unchanged.
   */
  it.each([
    ['@source', 'include', `src/${'{a,b}'.repeat(10)}.tsx`],
    ['@source not', 'exclude', `src/${'{a,b}'.repeat(10)}.tsx`],
    ['@source', 'include', 'src/{1..32}{a,{b,c},d}{0..7}.tsx']
  ] as const)('keeps %s \'%s\' at 1024 patterns', (directive, field, pattern) => {
    expect(compileCSS(`${directive} '${pattern}';`).extractionPolicy[field]).toEqual([pattern])
  })
})
