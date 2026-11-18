import { test, it, expect, describe } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { getClassPositions, languageSettings } from '../../src'
import createDoc from '../helpers/create-doc'
import { expectClassPosition, getClassPosition } from './test'

test.concurrent('empty string with single quote', () => {
  const target = ''
  const contents = ['export default () => <div className=\'', target, '\'></div>']
  expectClassPosition(target, contents, 'tsx')
})

test.concurrent('empty string with double quote', () => {
  const target = ''
  const contents = ['export default () => <div className="', target, '"></div>']
  expectClassPosition(target, contents, 'tsx')
})

test.concurrent('spaced jsx attribute assignment', () => {
  const target = 'class-a'
  const contents = ['export default () => <div className = "', target, '"></div>']
  expectClassPosition(target, contents, 'tsx')
})

test.concurrent('empty binding', () => {
  const contents = ['export default () => <div className={', '', '}></div>']
  const doc = createDoc('tsx', contents.join(''))
  expect(getClassPosition(doc, { line: 0, character: contents[0].length })).toBeUndefined()
})

test.concurrent('empty string binding with double quote', () => {
  const target = ''
  const contents = ['export default () => <div className={"', target, '"}></div>']
  expectClassPosition(target, contents, 'tsx')
})

test.concurrent('empty clsx', () => {
  const contents = ['export default () => <div className={clsx(', '', ')}></div>']
  const doc = createDoc('tsx', contents.join(''))
  expect(getClassPosition(doc, { line: 0, character: contents[0].length })).toBeUndefined()
})

test.concurrent('two classes in clsx fn', () => {
  const target = 'class-b'
  const contents = ['export default () => <div className={clsx("class-a","', target, '")}></div>']
  expectClassPosition(target, contents, 'tsx')
})

test.concurrent('quote in clsx fn', () => {
  const target = `content:''`
  const contents = ['export default () => <div className={clsx("class-a","', target, '")}></div>']
  expectClassPosition(target, contents)
})

test.concurrent('template literal and newlines', () => {
  const target = `class-e`
  const contents = ['export default () => <div className={clsx("class-a class-b",`class-c class-d\n', target, '`)}></div>']
  expectClassPosition(target, contents)
})

test.concurrent('template literal expressions use quasi ranges', () => {
  const doc = createDoc('tsx', 'export default () => <div className={`class-a ${active ? "class-b" : "hidden"} class-c`}></div>')
  expect(getClassPositions(doc, languageSettings).map((classPosition) => classPosition.token)).toEqual([
    'class-a',
    'class-b',
    'hidden',
    'class-c'
  ])
})

/**
 * Guards: `.js`, `.mjs` and `.cjs` files often hold JSX, and editors open
 * them as `javascript`. Parsed as plain JavaScript, the JSX fails and the
 * regex fallback, which finds class functions only after whitespace or `.`,
 * misses `c=clsx(...)`, so the editor loses the class. Reverse check:
 * dropping the `jsx` language for these names in
 * `src/utils/get-class-positions.ts` turns this test red.
 */
test.concurrent.each([
  'file:///abc.js',
  'file:///abc.mjs',
  'file:///abc.cjs'
])('parses JSX in a javascript document at %s', (uri) => {
  const doc = TextDocument.create(uri, 'javascript', 0, "const c=clsx(on && 'fg:red')\nexport default () => <div className={c}></div>")
  expect(getClassPositions(doc, languageSettings).map((classPosition) => classPosition.token)).toEqual([
    'fg:red'
  ])
})

test.concurrent('parse failure falls back to regex positions', () => {
  const doc = createDoc('tsx', 'const broken = <\nexport default () => <div className="class-a"></div>')
  expect(getClassPositions(doc, languageSettings).map((classPosition) => classPosition.token)).toEqual([
    'class-a'
  ])
})

test.concurrent('regex fallback ignores class attributes inside JS comments', () => {
  const doc = createDoc('tsx', 'const broken = <\n// <div className="fg:red"></div>\n<div className="fg:blue"></div>')
  expect(getClassPositions(doc, languageSettings).map((classPosition) => classPosition.token)).toEqual([
    'fg:blue'
  ])
})
