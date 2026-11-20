import { expect, test } from 'vitest'
import { decodeStetCSSClassListSource, parseStetCSSClassList } from '../src'
import { decodeStetCSSHTMLAttributeValue, decodeStetCSSJSXAttributeString } from '../src/character-reference'

/**
 * Source extraction reads class attributes by these decoders (#194), and editor tooling maps
 * decoded classes back onto the source through their ranges. A wrong decode extracts a class the
 * browser or the JSX compiler never sees; a wrong range points a diagnostic or edit elsewhere.
 * Expected values follow the HTML tokenizer's character reference state and Babel's JSX reader.
 * Reverse checks (each turned only its own test red):
 * - dropping the attribute rule for a legacy name before `=` or an alphanumeric → the HTML test
 *   (and the source ampersand test);
 * - accepting an uppercase `X` in JSX hex references → the JSX test;
 * - ending each reference's range one character early → the mapping test.
 */

test.concurrent('decodes HTML attribute values the way the HTML tokenizer does', () => {
  const cases: [string, string][] = [
    ['block&#32;hidden', 'block hidden'],
    ['inline&#x2d;flex&#X2D;x', 'inline-flex-x'],
    // Numeric references may omit their `;`.
    ['a&#45b&#x2d', 'a-b-'],
    // NUL, surrogates and code points past U+10FFFF become U+FFFD; C1 controls read as windows-1252.
    ['&#0;&#xD800;&#x110000;&#99999999999999999999;', '����'],
    ['&#128;&#x9F;&#x81;', '€Ÿ\u0081'],
    ['&#;&#x;&#xg;', '&#;&#x;&#xg;'],
    ['a&amp;b a&lt;b &nbsp;', 'a&b a<b  '],
    // Two code points, and one outside the BMP.
    ['&NotEqualTilde;&Afr;', '≂̸\u{1D504}'],
    // A legacy name may omit its `;`, but not before `=` or an alphanumeric.
    ['&amp &copy!', '& ©!'],
    ['x&copy=1 a&copyb &notin &notit;', 'x&copy=1 a&copyb &notin &notit;'],
    ['&notin;', '∉'],
    // Only legacy names may omit the `;`, and unknown names stay as written.
    ['&NotEqualTilde &unknown; & &;', '&NotEqualTilde &unknown; & &;']
  ]
  for (const [source, value] of cases) {
    expect(decodeStetCSSHTMLAttributeValue(source).value, source).toBe(value)
  }
})

test.concurrent('decodes JSX attribute strings the way JSX compilers do', () => {
  const cases: [string, string][] = [
    ['block&#32;hidden inline&#x2d;flex', 'block hidden inline-flex'],
    ['a&amp;b &nbsp; &apos;', 'a&b   \''],
    // XHTML values, which differ from HTML for these two.
    ['&lang;&rang;', '〈〉'],
    ['&#x1F600;', '\u{1F600}'],
    // Only references that end in `;`, a lowercase `x`, and the XHTML names decode.
    ['&#32 &amp &#X2D; &NotEqualTilde; &#x110000; &#; &', '&#32 &amp &#X2D; &NotEqualTilde; &#x110000; &#; &']
  ]
  for (const [source, value] of cases) {
    expect(decodeStetCSSJSXAttributeString(source).value, source).toBe(value)
  }
})

test.concurrent('maps each decoded unit onto the source it is spelled with', () => {
  // `&Afr;` decodes to a surrogate pair; both units span the reference.
  expect(decodeStetCSSHTMLAttributeValue('a&amp;b&Afr;&copy')).toEqual({
    value: 'a&b\u{1D504}©',
    starts: [0, 1, 6, 7, 7, 12],
    ends: [1, 6, 7, 12, 12, 17]
  })
  expect(decodeStetCSSJSXAttributeString('a&#32;b&amp')).toEqual({
    value: 'a b&amp',
    starts: [0, 1, 6, 7, 8, 9, 10],
    ends: [1, 6, 7, 8, 9, 10, 11]
  })
})

/**
 * Editor tooling, lint and the ESLint plugin read class attributes through these options (#240):
 * the classes must be the ones the build extracts, and each item's source spelling must rebuild
 * the attribute, so a sort or removal writes back where the class is spelled. A class split on
 * its source spelling reports `block&#32;hidden`, which the build never generates; a wrong range
 * corrupts the attribute on autofix. Reverse checks: skipping the quote unescape of decoded
 * markup tokens, or decoding only lists holding `&#`, reds the first test; ending a composed unit
 * at its reference's start (or one past it) reds the second (and the lint and ESLint Vue binding
 * fixes built on it).
 */
test.concurrent('splits a class attribute on its decoded value and keeps each item in source', () => {
  const source = 'block&#32;hidden inline&#x2d;flex'
  const items = parseStetCSSClassList(source, { preserveSpaces: true, characterReferences: decodeStetCSSHTMLAttributeValue })
  expect(items).toEqual([
    { type: 'class', start: 0, end: 5, raw: 'block', token: 'block' },
    { type: 'space', start: 5, end: 10, raw: '&#32;', token: ' ' },
    { type: 'class', start: 10, end: 16, raw: 'hidden', token: 'hidden' },
    { type: 'space', start: 16, end: 17, raw: ' ', token: ' ' },
    { type: 'class', start: 17, end: 33, raw: 'inline&#x2d;flex', token: 'inline-flex' }
  ])
  expect(items.map((item) => item.raw).join('')).toBe(source)
  // A list whose only reference is a named one.
  expect(parseStetCSSClassList('block&Tab;hidden', { characterReferences: decodeStetCSSHTMLAttributeValue }).map((item) => item.token))
    .toEqual(['block', 'hidden'])
  // JSX reads only references that end in `;`.
  expect(parseStetCSSClassList('a&#32;b c&#32d', { characterReferences: decodeStetCSSJSXAttributeString }).map((item) => item.token))
    .toEqual(['a', 'b', 'c&#32d'])
  // A reference elsewhere in the list leaves an escaped quote read as it is without one.
  expect(parseStetCSSClassList('content:\\"x\\" a&#32;b', { unescape: '"', characterReferences: decodeStetCSSHTMLAttributeValue }).map((item) => item.token))
    .toEqual(['content:"x"', 'a', 'b'])
})

test.concurrent('decodes the character references of a script string before its escapes', () => {
  // A Vue `:class` binding: the template compiler decodes the attribute, then parses the
  // expression, so `&#92;x62` is the escape `\x62`.
  const source = 'fg:white&#32;&#92;x62g:black'
  const options = { scriptString: '\'', characterReferences: decodeStetCSSHTMLAttributeValue } as const
  expect(decodeStetCSSClassListSource(source, options)?.value).toBe('fg:white bg:black')
  expect(parseStetCSSClassList(source, { preserveSpaces: true, ...options })).toEqual([
    { type: 'class', start: 0, end: 8, raw: 'fg:white', token: 'fg:white' },
    { type: 'space', start: 8, end: 13, raw: '&#32;', token: ' ' },
    { type: 'class', start: 13, end: 28, raw: '&#92;x62g:black', token: 'bg:black' }
  ])
  // A class that ends in a reference ends where the reference does.
  expect(parseStetCSSClassList('fg:whit&#x65; bg:black', { preserveSpaces: true, ...options })[0])
    .toEqual({ type: 'class', start: 0, end: 13, raw: 'fg:whit&#x65;', token: 'fg:white' })
})
