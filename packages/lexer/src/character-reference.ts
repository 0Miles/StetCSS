import {
  HTML_LEGACY_REFERENCE_NAMES,
  HTML_NAMED_REFERENCES,
  JSX_NAMED_REFERENCE_NAMES,
  JSX_REFERENCE_OVERRIDES
} from './html-named-references'
import type { StetCSSDecodedSource } from './script-string'

// The longest name in `HTML_NAMED_REFERENCES` (`CounterClockwiseContourIntegral`).
const MAX_NAME_LENGTH = 31
const MAX_CODE_POINT = 0x10FFFF
const REPLACEMENT_CHARACTER = '�'

// The HTML tokenizer reads these numeric references as windows-1252 (the C1 controls it maps).
const WINDOWS_1252: Record<number, number> = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02DC,
  0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
}

let namedReferences: Map<string, string> | undefined
let legacyNames: Set<string> | undefined
let jsxNames: Set<string> | undefined

function getNamedReferences() {
  if (!namedReferences) {
    namedReferences = new Map()
    for (const entry of HTML_NAMED_REFERENCES.split(',')) {
      const [name, codePoints] = entry.split(':')
      namedReferences.set(name, String.fromCodePoint(...codePoints.split('.').map(hex => parseInt(hex, 16))))
    }
  }
  return namedReferences
}

function getLegacyNames() {
  return legacyNames ??= new Set(HTML_LEGACY_REFERENCE_NAMES.split(' '))
}

function getJSXNames() {
  return jsxNames ??= new Set(JSX_NAMED_REFERENCE_NAMES.split(' '))
}

function isAsciiDigit(char: string | undefined) {
  return char !== undefined && char >= '0' && char <= '9'
}

function isAsciiHexDigit(char: string | undefined) {
  return isAsciiDigit(char) || char !== undefined && (char >= 'a' && char <= 'f' || char >= 'A' && char <= 'F')
}

function isAsciiAlphanumeric(char: string | undefined) {
  return isAsciiDigit(char) || char !== undefined && (char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z')
}

/** Reads the digits at `start`, saturating above the largest code point; `end` is `start` when there are none. */
function readCodePoint(source: string, start: number, hex: boolean) {
  const isDigit = hex ? isAsciiHexDigit : isAsciiDigit
  let value = 0
  let end = start
  while (isDigit(source[end])) {
    value = Math.min(value * (hex ? 16 : 10) + parseInt(source[end], 16), MAX_CODE_POINT + 1)
    end++
  }
  return { value, end }
}

function readNameEnd(source: string, start: number) {
  let end = start
  while (isAsciiAlphanumeric(source[end])) end++
  return end
}

interface CharacterReference {
  value: string
  end: number
}

type ReadReference = (source: string, ampersand: number) => CharacterReference | undefined

/** The HTML tokenizer's character reference state, returning to an attribute value. */
function readHTMLAttributeReference(source: string, ampersand: number): CharacterReference | undefined {
  const start = ampersand + 1
  if (source[start] === '#') {
    const hex = source[start + 1] === 'x' || source[start + 1] === 'X'
    const digitsStart = start + (hex ? 2 : 1)
    const { value, end } = readCodePoint(source, digitsStart, hex)
    if (end === digitsStart) return
    let char: string
    if (value === 0 || value > MAX_CODE_POINT || value >= 0xD800 && value <= 0xDFFF) {
      char = REPLACEMENT_CHARACTER
    } else {
      char = String.fromCodePoint(WINDOWS_1252[value] ?? value)
    }
    return { value: char, end: source[end] === ';' ? end + 1 : end }
  }

  const nameEnd = readNameEnd(source, start)
  if (nameEnd === start) return
  if (source[nameEnd] === ';') {
    const value = getNamedReferences().get(source.slice(start, nameEnd))
    if (value !== undefined) return { value, end: nameEnd + 1 }
  }
  // Without its `;`, only a legacy name matches, and the longest one that prefixes the name wins.
  for (let end = Math.min(nameEnd, start + MAX_NAME_LENGTH); end > start; end--) {
    const name = source.slice(start, end)
    if (!getLegacyNames().has(name)) continue
    // In an attribute value, a reference without its `;` followed by `=` or an alphanumeric stays as written.
    if (source[end] === '=' || isAsciiAlphanumeric(source[end])) return
    return { value: getNamedReferences().get(name)!, end }
  }
}

/** A JSX attribute string's reference: a numeric or XHTML named one, always ending in `;`. */
function readJSXReference(source: string, ampersand: number): CharacterReference | undefined {
  const start = ampersand + 1
  if (source[start] === '#') {
    const hex = source[start + 1] === 'x'
    const digitsStart = start + (hex ? 2 : 1)
    const { value, end } = readCodePoint(source, digitsStart, hex)
    if (end === digitsStart || source[end] !== ';' || value > MAX_CODE_POINT) return
    return { value: String.fromCodePoint(value), end: end + 1 }
  }

  const nameEnd = readNameEnd(source, start)
  if (source[nameEnd] !== ';') return
  const name = source.slice(start, nameEnd)
  if (!getJSXNames().has(name)) return
  return { value: JSX_REFERENCE_OVERRIDES[name] ?? getNamedReferences().get(name)!, end: nameEnd + 1 }
}

function decodeCharacterReferences(source: string, readReference: ReadReference): StetCSSDecodedSource {
  let value = ''
  const starts: number[] = []
  const ends: number[] = []
  for (let index = 0; index < source.length;) {
    const reference = source[index] === '&' ? readReference(source, index) : undefined
    if (!reference) {
      value += source[index]
      starts.push(index)
      ends.push(index + 1)
      index++
      continue
    }
    value += reference.value
    for (let unit = 0; unit < reference.value.length; unit++) {
      starts.push(index)
      ends.push(reference.end)
    }
    index = reference.end
  }
  return { value, starts, ends }
}

/**
 * Decodes an HTML attribute value (the text between its quotes, or an unquoted value, as written
 * in the source) the way the HTML tokenizer does, and records where each decoded unit is spelled:
 * every unit of a character reference spans the whole reference.
 *
 * Like the tokenizer, it reads numeric references with or without their `;`, named ones that
 * omit the `;` only when HTML allows that, and keeps such a reference as written before `=` or an
 * alphanumeric (`x&copy=1`); an `&` that starts no reference stays as written.
 */
export function decodeStetCSSHTMLAttributeValue(source: string): StetCSSDecodedSource {
  return decodeCharacterReferences(source, readHTMLAttributeReference)
}

/**
 * Decodes the body of a JSX attribute string (the text between its quotes) the way JSX compilers
 * such as Babel do, and records where each decoded unit is spelled. Only references that end in
 * `;` decode: `&#<decimal>;`, `&#x<hex>;` and the XHTML named references.
 */
export function decodeStetCSSJSXAttributeString(source: string): StetCSSDecodedSource {
  return decodeCharacterReferences(source, readJSXReference)
}
