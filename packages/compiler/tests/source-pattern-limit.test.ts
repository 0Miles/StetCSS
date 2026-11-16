import { describe, expect, it } from 'vitest'
import { compileCSS } from '../src'

const LIMIT_ERROR = 'expands its braces into more than 1024 patterns'

function repeat(group: string, times: number) {
  return `src/${group.repeat(times)}.tsx`
}

describe('@source brace expansion limit', () => {
  /**
   * Guards builds against `@source` and `@source not` patterns whose braces expand into more
   * globs than file listing can afford: the pattern must fail where the directive is read, and
   * the error must name the pattern and its file so the developer can find the line.
   * Reverse check: raising the limit turns this test, the "counts" test below, and the
   * stylesheet build test red.
   */
  it.each([
    ['@source', repeat('{a,b}', 11)],
    ['@source not', repeat('{a,b}', 11)]
  ])('rejects %s \'%s\', which expands past 1024 patterns', (directive, pattern) => {
    expect(() => compileCSS(`${directive} '${pattern}';`, { from: 'app/entry.css' }))
      .toThrow(`${directive} '${pattern}' ${LIMIT_ERROR} (in app/entry.css)`)
  })

  /**
   * Guards that every brace form glob matching expands is counted, so no spelling slips a
   * pattern past the limit and stalls the build: each case repeats a group just far enough to
   * pass 1024 and must be rejected. A form counted as one pattern would compile here.
   */
  it.each([
    ['nested lists', '{a,{b,c},d}', 6],
    ['empty alternatives', '{a,}', 11],
    ['numeric ranges', '{1..32}', 3],
    ['descending and negative ranges', '{3..-4}', 4],
    ['stepped ranges', '{1..10..3}', 6],
    ['letter ranges', '{a..z}', 3],
    ['stepped letter ranges', '{a..e..2}', 7],
    ['ranges mixing a digit and a letter', '{1..a}', 2],
    ['ranges with a plus sign', '{+1..4}', 6],
    ['ranges padded with spaces', '{ 1..4 }', 6],
    ['ranges in exponent notation', '{1e1..13}', 6],
    ['ranges in hex notation', '{0x1..0x4}', 6],
    ['ranges nested in a list', '{a,{1..3}}', 6],
    ['groups inside a lone alternative', '{x{a,b}}', 11],
    ['groups after an unclosed brace', '{x{a,b}', 11],
    ['groups after an escaped brace', '\\\\{{a,b}', 11],
    ['groups after a character class', '[a-z]{a,b}', 11],
    ['groups after a class opening with ]', '[]{a,b}]', 11],
    ['groups inside a character class', '[{a,b}]', 11]
  ])('counts %s: %s', (_form, group, times) => {
    const pattern = repeat(group, times)
    expect(() => compileCSS(`@source "${pattern}";`)).toThrow(LIMIT_ERROR)
  })

  /**
   * Guards patterns within the limit: exactly 1024 patterns still compile, and forms that glob
   * matching keeps literal do not count, however often they repeat. The pattern reaches the
   * source list as written.
   */
  it.each([
    ['@source', 'include', repeat('{a,b}', 10)],
    ['@source not', 'exclude', repeat('{a,b}', 10)],
    ['@source', 'include', 'src/{1..32}{a,{b,c},d}{0..7}.tsx'],
    ['@source', 'include', repeat('{a}', 40)],
    ['@source', 'include', repeat('{}', 40)],
    ['@source', 'include', repeat('{a,b', 40)],
    ['@source', 'include', repeat('a,b}', 40)],
    ['@source', 'include', repeat('{aa..zz}', 40)],
    ['@source', 'include', repeat('{1..}', 40)],
    ['@source', 'include', repeat('{1.5..3.5}', 40)],
    ['@source', 'include', repeat('{1..9..x}', 40)]
  ] as const)('keeps %s \'%s\'', (directive, field, pattern) => {
    expect(compileCSS(`${directive} '${pattern}';`).extractionPolicy[field]).toEqual([pattern])
  })

  /** Guards that a backslash keeps a brace literal; the CSS string escape doubles it. */
  it('keeps escaped braces literal', () => {
    const pattern = repeat('\\{a,b\\}', 40)
    expect(compileCSS(`@source '${pattern.replaceAll('\\', '\\\\')}';`).extractionPolicy.include).toEqual([pattern])
  })
})
