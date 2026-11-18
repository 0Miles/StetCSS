import { afterAll, beforeAll, expect, test } from 'vitest'
import { createHighlighter, type HighlighterGeneric } from 'shiki'

import {
  collectClassListSemanticTokenItems,
  collectSemanticTokenItems,
  createLanguageCSS,
  getClassPositions,
  getStetCSSSemanticTokenScopeKeys,
  languageSettings,
  STET_CSS_SEMANTIC_TOKEN_SCOPE_MAP
} from '../src'
import type { SemanticTokenItem } from '../src'
import createDoc from './helpers/create-doc'

const css = createLanguageCSS()
let highlighter: HighlighterGeneric<any, any>

beforeAll(async () => {
  highlighter = await createHighlighter({ themes: ['github-dark'], langs: ['css'] })
})

afterAll(() => {
  highlighter?.dispose()
})

function classTokens(classList: string) {
  return collectClassListSemanticTokenItems(css, classList).map((token) => ({
    text: classList.slice(token.start, token.end),
    start: token.start,
    type: token.type,
    modifiers: token.modifiers ?? []
  }))
}

/** Innermost TextMate scope the native CSS grammar gives `text` (the n-th occurrence) in `code`. */
function nativeScope(code: string, text: string, occurrence = 0) {
  const tokens = highlighter.codeToTokens(code, { lang: 'css', theme: 'github-dark', includeExplanation: 'scopeName' }).tokens.flat()
  const parts = tokens.flatMap((token) => token.explanation ?? []).filter((part) => part.content === text)
  const scopes = parts[occurrence]?.scopes
  return scopes?.[scopes.length - 1]?.scopeName
}

/** The TextMate scope a theme colours this semantic token with: the first scope of its most specific mapped key. */
function semanticScope(token: Pick<SemanticTokenItem, 'type' | 'modifiers'>) {
  const [key] = getStetCSSSemanticTokenScopeKeys(token.type, token.modifiers)
  return key ? STET_CSS_SEMANTIC_TOKEN_SCOPE_MAP[key][0] : undefined
}

/** A theme rule that colours the mapped scope also colours the native one: same scope, or a dotted prefix of it. */
function expectNativeScope(classList: string, text: string, native: string) {
  const token = collectClassListSemanticTokenItems(css, classList).find((each) => classList.slice(each.start, each.end) === text)
  expect(token, `no semantic token for ${text} in ${classList}`).toBeDefined()
  const mapped = semanticScope(token!)?.replace(/\.css$/, '')
  expect(`${native.replace(/\.css$/, '')}.`.startsWith(`${mapped}.`), `${text}: ${mapped} does not cover native ${native}`).toBe(true)
}

/**
 * Guards: an attribute selector in a class state got tokens only for its brackets, so the name,
 * operator and value kept the host string colour instead of the native selector colours.
 * Skipping `tokenizeAttributeSelector` in lexer `class.ts` reds this and the Shiki attribute colour test.
 */
test.concurrent('tokenizes every part of an attribute selector like the native CSS selector', () => {
  const classList = 'block[data-state=open] block[data-x^="a"]'

  expect(classTokens(classList)).toEqual(expect.arrayContaining([
    expect.objectContaining({ text: 'data-state', start: 6 }),
    expect.objectContaining({ text: '=', start: 16 }),
    expect.objectContaining({ text: 'open', start: 17 }),
    expect.objectContaining({ text: '^=', start: 35 }),
    expect.objectContaining({ text: '"', start: 37 }),
    expect.objectContaining({ text: 'a', start: 38 }),
    expect.objectContaining({ text: '"', start: 39 })
  ]))

  const native = 'a[data-state=open] a[data-x^="a"] {}'
  expectNativeScope(classList, 'data-state', nativeScope(native, 'data-state')!)
  expectNativeScope(classList, '=', nativeScope(native, '=')!)
  expectNativeScope(classList, '^=', nativeScope(native, '^=')!)
  expectNativeScope(classList, 'open', nativeScope(native, 'open')!)
  expectNativeScope(classList, '"', nativeScope(native, '"')!)
  expectNativeScope(classList, 'a', nativeScope(native, 'a', 2)!)
})

/**
 * Guards: `nth-child(2n+1)` left `2n` and `1` without tokens and coloured `+` as a combinator;
 * native CSS colours the whole `an+b` expression as one number.
 * Turning off the `NTH_PSEUDO_CLASSES` check in lexer `class.ts` reds this and the Shiki an+b colour test.
 */
test.concurrent('tokenizes an an+b argument as one number, not a combinator', () => {
  const classList = 'fg:red:nth-child(2n+1) hidden:nth-last-of-type(-n+3) block:nth-child(odd)'
  const tokens = classTokens(classList)

  expect(tokens).toEqual(expect.arrayContaining([
    expect.objectContaining({ text: '2n+1', start: 17 }),
    expect.objectContaining({ text: '-n+3', start: 47 }),
    expect.objectContaining({ text: 'odd', start: 69 })
  ]))
  expect(tokens).not.toContainEqual(expect.objectContaining({ text: '+' }))

  const native = 'li:nth-child(2n+1) li:nth-child(odd) {}'
  expectNativeScope(classList, '2n+1', nativeScope(native, '2n+1')!)
  expectNativeScope(classList, '-n+3', nativeScope(native, '2n+1')!)
  expectNativeScope(classList, 'odd', nativeScope(native, 'odd')!)
})

/**
 * Guards: the `|` between a container name and its condition had no token.
 * Dropping `|` from the query punctuation in lexer `class.ts` reds only this test.
 */
test.concurrent('tokenizes the container name separator in a query', () => {
  expect(classTokens('hidden@container(card|w>=600)')).toContainEqual({
    text: '|',
    start: 21,
    type: 'operator',
    modifiers: ['query', 'queryPunctuation']
  })
})

/**
 * Guards: a class with escaped quotes was tokenized after unescaping but placed at raw offsets,
 * so every token after the first escape landed short of its text.
 * Skipping `mapTokenOffsetsToRaw` in `render-semantic-tokens.ts` reds only this test.
 */
test.concurrent('places tokens at raw offsets when the class contains escaped quotes', () => {
  const source = 'clsx("content:\\"x\\":hover")'
  const doc = createDoc('ts', source)
  const tokens = collectSemanticTokenItems(css, doc, getClassPositions(doc, languageSettings))
  const hover = tokens.find((token) => token.type === 'modifier')

  expect(hover).toMatchObject({ start: 20, end: 25 })
  expect(tokens.map((token) => source.slice(token.start, token.end))).toEqual([
    'content', ':', '\\"', 'x', '\\"', ':', 'hover'
  ])
})
