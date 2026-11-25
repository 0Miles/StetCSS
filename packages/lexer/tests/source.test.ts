import { describe, expect, it } from 'vitest'
import {
  cssEscape,
  escapeRegExp,
  findCSSBlockEnd,
  findCSSStatementEnd,
  replaceCSSNestingSelector,
  skipCSSEscapeStringOrComment
} from '../src/source'

describe('source helpers', () => {
  it('escapes CSS identifiers', () => {
    expect(cssEscape('font:48px')).toBe('font\\:48px')
    expect(cssEscape('1col')).toBe('\\31 col')
    expect(cssEscape('-1col')).toBe('-\\31 col')
    expect(cssEscape('-')).toBe('\\-')
    expect(cssEscape('a b')).toBe('a\\ b')
  })

  it('escapes regular expression source text', () => {
    expect(escapeRegExp('a.b[c]')).toBe('a\\.b\\[c\\]')
  })

  it('skips one escape, string or comment at a time', () => {
    const source = String.raw`a\'b 'c\'d' /* e */ f`
    expect(skipCSSEscapeStringOrComment(source, 0)).toBe(0)
    expect(source.slice(1, skipCSSEscapeStringOrComment(source, 1))).toBe(String.raw`\'`)
    expect(source.slice(5, skipCSSEscapeStringOrComment(source, 5))).toBe(String.raw`'c\'d'`)
    expect(source.slice(12, skipCSSEscapeStringOrComment(source, 12))).toBe('/* e */')
    expect(skipCSSEscapeStringOrComment('"open', 0)).toBe(5)
    expect(skipCSSEscapeStringOrComment('/* open', 0)).toBe(7)
    expect(skipCSSEscapeStringOrComment('\\', 0)).toBe(1)
    expect(skipCSSEscapeStringOrComment('"a" b', 0, 2)).toBe(2)
  })

  /**
   * Prevents: a backslash-escaped quote outside a string, as in the selector `.a\'b`, opening a
   * string that ran to the next quote and hid the delimiters between.
   */
  it('bounds statements and blocks past escaped quotes outside strings', () => {
    const statement = String.raw`.a\'b, .c\"d { color: red }`
    expect(findCSSStatementEnd(statement, 0).reason).toBe('block')
    expect(statement[findCSSStatementEnd(statement, 0).end]).toBe('{')

    const block = String.raw`{ .a\'b { color: red } } @safelist 'x';`
    expect(findCSSBlockEnd(block, 0)).toBe(block.indexOf('} @safelist'))
  })

  /**
   * Prevents: an escaped `\&` in a class name (`.a\&b`, the class `a&b`), or an `&` inside an
   * attribute string (`[data-a="&"]`), being taken for the nesting selector, so the parent was
   * pasted into the class name or the attribute value.
   */
  it('replaces only nesting selectors, not escaped ampersands or ones in strings or comments', () => {
    expect(replaceCSSNestingSelector('&.a\\&b', '.x')).toBe('.x.a\\&b')
    expect(replaceCSSNestingSelector('& [data-a="&"]', '.x')).toBe('.x [data-a="&"]')
    expect(replaceCSSNestingSelector("& [data-a='&'] /* & */ + &", '.x')).toBe(".x [data-a='&'] /* & */ + .x")
    expect(replaceCSSNestingSelector('.a\\&b', '.x')).toBeUndefined()
    expect(replaceCSSNestingSelector('[data-a="&"]', '.x')).toBeUndefined()
    expect(replaceCSSNestingSelector('&:hover', '')).toBe(':hover')
  })
})
