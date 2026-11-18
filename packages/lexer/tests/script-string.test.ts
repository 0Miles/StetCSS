import { expect, test } from 'vitest'
import { decodeStetCSSScriptString, parseStetCSSClassList, type StetCSSScriptStringQuote } from '../src'

/**
 * Lint and the ESLint plugin check classes by their decoded value and rebuild fixes from each
 * item's source spelling (#196). A wrong decode checks the wrong class; a wrong source range
 * corrupts the literal on autofix. Reverse checks (each turned only its own test red):
 * - writing a template's CRLF through undecoded → the cooking and mapping tests;
 * - accepting an unescaped closing quote → the rejection test;
 * - letting a class absorb a following line continuation → the mapping test;
 * - dropping the fallback for undecodable bodies → the fallback test.
 */

function cook(body: string, quote: StetCSSScriptStringQuote) {
  return new Function(`return ${quote}${body}${quote}`)() as string
}

test.concurrent('decodes string and template bodies the way JavaScript cooks them', () => {
  const cases: [string, StetCSSScriptStringQuote][] = [
    ['\\x62lock \\u0066g:red \\u{1F600} \\n\\t\\\\', '"'],
    ['fg:white\\\n bg:black\\\r\nm:0', '\''],
    ['\\101\\0\\8 \\\'', '\''],
    ['a\r\nb\rc\\`\\$', '`']
  ]
  for (const [body, quote] of cases) {
    expect(decodeStetCSSScriptString(body, quote)?.value).toBe(cook(body, quote))
  }
})

test.concurrent('rejects bodies that would end or break the literal', () => {
  expect(decodeStetCSSScriptString('a"b', '"')).toBeUndefined()
  expect(decodeStetCSSScriptString('a\nb', '\'')).toBeUndefined()
  expect(decodeStetCSSScriptString('a${b}', '`')).toBeUndefined()
  expect(decodeStetCSSScriptString('\\x6', '"')).toBeUndefined()
  expect(decodeStetCSSScriptString('a\\', '"')).toBeUndefined()
  expect(decodeStetCSSScriptString('\\1', '`')).toBeUndefined()
})

test.concurrent('maps decoded class list items onto their source spelling', () => {
  const source = '\\x62lock\\\n fg:red\r\n'
  const items = parseStetCSSClassList(source, { preserveSpaces: true, scriptString: '`' })
  expect(items).toEqual([
    { type: 'class', start: 0, end: 8, raw: '\\x62lock', token: 'block' },
    { type: 'space', start: 8, end: 11, raw: '\\\n ', token: ' ' },
    { type: 'class', start: 11, end: 17, raw: 'fg:red', token: 'fg:red' },
    { type: 'space', start: 17, end: 19, raw: '\r\n', token: '\n' }
  ])
  expect(items.map((item) => item.raw).join('')).toBe(source)
})

test.concurrent('falls back to quote unescaping when the body does not decode', () => {
  expect(parseStetCSSClassList('content:\\\'x\\\' \\x', { scriptString: '\'' })).toEqual([
    { type: 'class', start: 0, end: 13, raw: 'content:\\\'x\\\'', token: 'content:\'x\'' },
    { type: 'class', start: 14, end: 16, raw: '\\x', token: '\\x' }
  ])
})
