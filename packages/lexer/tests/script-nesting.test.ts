import { describe, expect, test } from 'vitest'
import { exceedsScriptNestingLimit } from '../src'

const shapes: [name: string, nest: (depth: number) => string][] = [
  ['nested arrays', (depth) => `x=${'['.repeat(depth)}'block'${']'.repeat(depth)}`],
  ['chained arrow functions', (depth) => `x=${'a=>'.repeat(depth)}'block'`],
  ['chained conditionals', (depth) => `x=${'a?b:'.repeat(depth)}'block'`],
  ['nested JSX elements', (depth) => `x=<a className="block">${'<a>'.repeat(depth - 1)}${'</a>'.repeat(depth)}`],
  ['nested type arguments', (depth) => `let x:${'A<'.repeat(depth)}B${'>'.repeat(depth)}='block'`],
  ['nested template literals', (depth) => `x=${'`${'.repeat(depth)}'block'${'}`'.repeat(depth)}`]
]

/**
 * Guards: the limit is 1024 levels and every level of each shape counts once.
 * Counting a shape short lets a file oxc cannot survive through to the parser
 * and crash the host; counting it twice sends files of half that depth to text
 * extraction and changes their classes. Reverse check: raising the limit to
 * 2048 turns the six 1025-level cases red, and so does dropping the `=>` count
 * for the arrow case alone.
 */
describe('script nesting limit', () => {
  test.each(shapes)('%s are within the limit at 1024 levels', (_, nest) => {
    expect(exceedsScriptNestingLimit(nest(1024))).toBe(false)
  })

  test.each(shapes)('%s exceed the limit at 1025 levels', (_, nest) => {
    expect(exceedsScriptNestingLimit(nest(1025))).toBe(true)
  })
})

/**
 * Guards: long ordinary files stay within the limit. A file flagged by mistake
 * loses oxc extraction for text extraction, which finds different classes.
 * Such files chain thousands of unrelated arrows, conditionals and angle
 * brackets one after another, so a chain must stop counting at each kind of
 * place an expression ends (a newline, a semicolon, a comma, a closing
 * bracket), and a closing tag must take back its opening tag. Reverse check:
 * dropping the newline, `;` or `,` case or the `</` decrement turns only its
 * own case red; keeping a closed bracket's chain turns the two statement
 * cases red.
 */
describe('ordinary files within the script nesting limit', () => {
  test('one statement per line without semicolons', () => {
    const content = Array.from({ length: 2000 }, (_, index) =>
      `export const Icon${index} = (props: Props): JSX.Element => <svg {...props}>{open ? <path d="M0 0"/> : null}</svg>`
    ).join('\n')

    expect(exceedsScriptNestingLimit(content)).toBe(false)
  })

  test('a minified bundle of statements on one line', () => {
    const content = Array.from({ length: 2000 }, (_, index) =>
      `var a${index}=function(b){return b?c:d<e};f${index}=g=>g?.h??i;`
    ).join('')

    expect(exceedsScriptNestingLimit(content)).toBe(false)
  })

  test('a long line of sibling JSX elements', () => {
    const content = `x=<ul>${'<li>a</li>'.repeat(2000)}</ul>`

    expect(exceedsScriptNestingLimit(content)).toBe(false)
  })

  test('a long argument list of arrows on one line', () => {
    const content = `register(${Array.from({ length: 2000 }, () => 'a=>a?b:c<d').join(',')})`

    expect(exceedsScriptNestingLimit(content)).toBe(false)
  })
})

/**
 * Guards: a minifier turns an `if`/`else if` chain into a conditional chain
 * whose conditions compare (`c<1?a:c<2?b:…`). Counting each `<` as a level on
 * top of its `?` doubles the depth, and flagged prettier's own Flow parser
 * plugin (about 800 deep, which oxc parses fine). Reverse check: counting `?`
 * as a plain level turns only this test red.
 */
test('a minified conditional chain 1000 deep whose conditions compare stays within the limit', () => {
  const content = `x=${Array.from({ length: 1000 }, (_, index) => `c<${index}?${index}:`).join('')}0`

  expect(exceedsScriptNestingLimit(content)).toBe(false)
})
