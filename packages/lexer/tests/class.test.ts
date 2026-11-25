import { expect, test } from 'vitest'
import {
  collectStetCSSClassListTokenRanges,
  parseStetCSSClassList,
  tokenizeStetCSSAtQuery,
  tokenizeStetCSSGroupedClassToken,
  tokenizeStetCSSState,
  tokenizeStetCSSValue,
  type StetCSSLexicalTokenItem
} from '../src'

function texts(source: string, tokens: StetCSSLexicalTokenItem[]) {
  return tokens.map((token) => ({
    text: source.slice(token.start, token.end),
    type: token.type,
    role: token.role,
    modifiers: token.modifiers
  }))
}

test.concurrent('parses class lists with ASCII whitespace ranges', () => {
  expect(parseStetCSSClassList('  block\tfg:red\nm:md ', { preserveSpaces: true })).toEqual([
    { type: 'space', start: 0, end: 2, raw: '  ', token: '  ' },
    { type: 'class', start: 2, end: 7, raw: 'block', token: 'block' },
    { type: 'space', start: 7, end: 8, raw: '\t', token: '\t' },
    { type: 'class', start: 8, end: 14, raw: 'fg:red', token: 'fg:red' },
    { type: 'space', start: 14, end: 15, raw: '\n', token: '\n' },
    { type: 'class', start: 15, end: 19, raw: 'm:md', token: 'm:md' },
    { type: 'space', start: 19, end: 20, raw: ' ', token: ' ' }
  ])
})

test.concurrent('does not split class lists on full-width whitespace', () => {
  expect(parseStetCSSClassList('block\u3000fg:red')).toEqual([
    { type: 'class', start: 0, end: 12, raw: 'block\u3000fg:red', token: 'block\u3000fg:red' }
  ])
})

test.concurrent('parses empty class positions for cursor contexts', () => {
  expect(parseStetCSSClassList('a  b ', { includeEmpty: true }).filter((item) => item.type === 'class')).toEqual([
    { type: 'class', start: 0, end: 1, raw: 'a', token: 'a' },
    { type: 'class', start: 1, end: 1, raw: '', token: '' },
    { type: 'class', start: 2, end: 2, raw: '', token: '' },
    { type: 'class', start: 3, end: 4, raw: 'b', token: 'b' },
    { type: 'class', start: 4, end: 4, raw: '', token: '' },
    { type: 'class', start: 5, end: 5, raw: '', token: '' }
  ])
})

test.concurrent('unescapes configured quote characters in class list tokens', () => {
  expect(parseStetCSSClassList("content:\\'\\' block", { unescape: '\'' })).toEqual([
    { type: 'class', start: 0, end: 12, raw: "content:\\'\\'", token: 'content:\'\'' },
    { type: 'class', start: 13, end: 18, raw: 'block', token: 'block' }
  ])
  expect(parseStetCSSClassList('content:\\`\\`', { unescape: '`' })[0]).toEqual({
    type: 'class',
    start: 0,
    end: 12,
    raw: 'content:\\`\\`',
    token: 'content:``'
  })
})

test.concurrent('collects class list token ranges through the shared parser', () => {
  expect(collectStetCSSClassListTokenRanges(' block  fg:red\u3000m:md ')).toEqual([
    { start: 1, end: 6, token: 'block' },
    { start: 8, end: 19, token: 'fg:red\u3000m:md' }
  ])
})

test.concurrent('tokenizes values without depending on core utilities', () => {
  const source = '12px/$space url("/a;b.png")!'
  expect(texts(source, tokenizeStetCSSValue(source, 0, {
    isKnownVariable: (name) => name === '$space'
  }))).toEqual([
    { text: '12', type: 'number', role: 'value.number', modifiers: undefined },
    { text: 'px', type: 'enumMember', role: 'value.unit', modifiers: ['unit'] },
    { text: '/', type: 'operator', role: 'value.separator', modifiers: undefined },
    { text: '$space', type: 'variable', role: 'value.variable', modifiers: undefined },
    { text: 'url', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: '/a;b.png', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '!', type: 'operator', role: 'value.important', modifiers: ['important'] }
  ])
})

test.concurrent('tokenizes managed value placeholders as CSS functions', () => {
  const source = '--value() calc(--value() * -1)'
  expect(texts(source, tokenizeStetCSSValue(source, 0))).toEqual([
    { text: '--value', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: 'calc', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '--value', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '*', type: 'operator', role: 'value.operator', modifiers: undefined },
    { text: '-', type: 'operator', role: 'value.operator', modifiers: undefined },
    { text: '1', type: 'number', role: 'value.number', modifiers: undefined },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined }
  ])
})

test.concurrent('tokenizes at queries and selector state', () => {
  const source = '@sm>=640:hover>.item'
  expect(texts(source, [
    ...tokenizeStetCSSAtQuery(source.slice(0, 8), 0),
    ...tokenizeStetCSSState(source, 8, 0)
  ])).toEqual([
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] },
    { text: '>=', type: 'operator', role: 'query.operator', modifiers: ['query'] },
    { text: '640', type: 'number', role: 'query.number', modifiers: ['query'] },
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'hover', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '>', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: '.', type: 'operator', role: 'selector.class.delimiter', modifiers: ['selector'] },
    { text: 'item', type: 'class', role: 'selector.class', modifiers: ['selector'] }
  ])
})

test.concurrent('tokenizes native-like query and selector punctuation roles', () => {
  const source = '@media(pointer:coarse),screen_:is(.active,#target,button)'
  const stateStart = source.indexOf('_')
  expect(texts(source, [
    ...tokenizeStetCSSAtQuery(source.slice(0, stateStart), 0),
    ...tokenizeStetCSSState(source, stateStart, 0)
  ])).toEqual([
    { text: '@media', type: 'keyword', role: 'query.keyword', modifiers: ['query'] },
    { text: '(', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: 'pointer', type: 'property', role: 'query.feature', modifiers: ['query'] },
    { text: ':', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: 'coarse', type: 'enumMember', role: 'query.value', modifiers: ['query'] },
    { text: ')', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: ',', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: 'screen', type: 'enumMember', role: 'query.value', modifiers: ['query'] },
    { text: '_', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'is', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '(', type: 'operator', role: 'selector.function.punctuation', modifiers: ['selector'] },
    { text: '.', type: 'operator', role: 'selector.class.delimiter', modifiers: ['selector'] },
    { text: 'active', type: 'class', role: 'selector.class', modifiers: ['selector'] },
    { text: ',', type: 'operator', role: 'selector.separator', modifiers: ['selector'] },
    { text: '#', type: 'operator', role: 'selector.id.delimiter', modifiers: ['selector'] },
    { text: 'target', type: 'variable', role: 'selector.id', modifiers: ['selector'] },
    { text: ',', type: 'operator', role: 'selector.separator', modifiers: ['selector'] },
    { text: 'button', type: 'type', role: 'selector.type', modifiers: ['selector'] },
    { text: ')', type: 'operator', role: 'selector.function.punctuation', modifiers: ['selector'] }
  ])
})

/**
 * Guards: a type, class or id name stopped at `\`, so `.literal\:first` coloured `literal` as the
 * class and `:first` as a pseudo-class, and `.a\.b` as two classes, while the engine keeps an
 * escaped character in the name (`:is(.literal\:first)`). The editor then showed a selector the
 * class does not generate.
 * Dropping the escape alternative from `SELECTOR_NAME_RE` or `TYPE_SELECTOR_RE` in `class.ts`
 * reds this test only.
 */
test.concurrent('tokenizes an escaped character as part of a type, class or id name', () => {
  const source = ':is(.literal\\:first).a\\.b#x\\:y>a\\:b'
  expect(texts(source, tokenizeStetCSSState(source, 0, 0))).toEqual([
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'is', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '(', type: 'operator', role: 'selector.function.punctuation', modifiers: ['selector'] },
    { text: '.', type: 'operator', role: 'selector.class.delimiter', modifiers: ['selector'] },
    { text: 'literal\\:first', type: 'class', role: 'selector.class', modifiers: ['selector'] },
    { text: ')', type: 'operator', role: 'selector.function.punctuation', modifiers: ['selector'] },
    { text: '.', type: 'operator', role: 'selector.class.delimiter', modifiers: ['selector'] },
    { text: 'a\\.b', type: 'class', role: 'selector.class', modifiers: ['selector'] },
    { text: '#', type: 'operator', role: 'selector.id.delimiter', modifiers: ['selector'] },
    { text: 'x\\:y', type: 'variable', role: 'selector.id', modifiers: ['selector'] },
    { text: '>', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: 'a\\:b', type: 'type', role: 'selector.type', modifiers: ['selector'] }
  ])
})

/**
 * Guards: an escaped `@` in a class name. The engine reads `.a\@sm` as one class and only an
 * unescaped `@` as a condition, so `block.a\@sm@sm` is the class `.a\@sm` inside `@sm`; the
 * editor colours the same split.
 * Dropping the escape alternative from `SELECTOR_NAME_RE` in `class.ts` reds this test and the
 * escaped name test above.
 */
test.concurrent('tokenizes an escaped `@` as part of a class name, not a condition', () => {
  const source = '.a\\@sm@sm'
  expect(texts(source, tokenizeStetCSSState(source, 0, 0))).toEqual([
    { text: '.', type: 'operator', role: 'selector.class.delimiter', modifiers: ['selector'] },
    { text: 'a\\@sm', type: 'class', role: 'selector.class', modifiers: ['selector'] },
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] }
  ])
})

/**
 * Guards: an attribute selector got tokens only for its brackets, and text after its value (`_i`)
 * was read as a `_` combinator and a type selector although the engine keeps it inside the brackets.
 * Skipping `tokenizeAttributeSelector` in `class.ts` reds this test and the case flag test.
 */
test.concurrent('tokenizes every part of an attribute selector', () => {
  const source = '[data-state=open][data-x^="a]"_i][hidden]'
  expect(texts(source, tokenizeStetCSSState(source, 0, 0))).toEqual([
    { text: '[', type: 'operator', role: 'selector.attribute.bracket', modifiers: ['selector'] },
    { text: 'data-state', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: '=', type: 'operator', role: 'selector.attribute.operator', modifiers: ['selector'] },
    { text: 'open', type: 'string', role: 'selector.attribute.value', modifiers: ['selector'] },
    { text: ']', type: 'operator', role: 'selector.attribute.bracket', modifiers: ['selector'] },
    { text: '[', type: 'operator', role: 'selector.attribute.bracket', modifiers: ['selector'] },
    { text: 'data-x', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: '^=', type: 'operator', role: 'selector.attribute.operator', modifiers: ['selector'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'a]', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'i', type: 'keyword', role: 'selector.attribute.flag', modifiers: ['selector'] },
    { text: ']', type: 'operator', role: 'selector.attribute.bracket', modifiers: ['selector'] },
    { text: '[', type: 'operator', role: 'selector.attribute.bracket', modifiers: ['selector'] },
    { text: 'hidden', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: ']', type: 'operator', role: 'selector.attribute.bracket', modifiers: ['selector'] }
  ])
})

/**
 * Guards: the case flag after a quoted value (`"a"_i`, which the engine emits as `"a" i`) had no
 * token, so it kept the host string colour. Native CSS colours `i` as a modifier keyword
 * (`storage.modifier.ignore-case.css`) and reads `s` as an attribute name, so the flag takes the
 * matching token type. `_` after an unquoted value is part of it (`a_i`), and `_x` and `_is` are no
 * flag, since the engine keeps them as written.
 * Dropping the case flag match in `tokenizeAttributeSelector` reds this test and the first one;
 * dropping the `]` lookahead from `ATTRIBUTE_CASE_FLAG_RE` reds only this test.
 */
test.concurrent('tokenizes an attribute case flag after a quoted value only', () => {
  const source = '[a="x"_s][a=\'x\'_I][a=x_i][a="x"_x][a="x"_is]'
  expect(texts(source, tokenizeStetCSSState(source, 0, 0)).filter(({ role }) => role !== 'selector.attribute.bracket' && role !== 'selector.attribute.operator')).toEqual([
    { text: 'a', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'x', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 's', type: 'property', role: 'selector.attribute.flag', modifiers: ['selector'] },
    { text: 'a', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: '\'', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'x', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '\'', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'I', type: 'keyword', role: 'selector.attribute.flag', modifiers: ['selector'] },
    { text: 'a', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: 'x_i', type: 'string', role: 'selector.attribute.value', modifiers: ['selector'] },
    { text: 'a', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'x', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'a', type: 'property', role: 'selector.attribute', modifiers: ['selector'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: 'x', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] }
  ])
})

/**
 * Guards: an `:nth-*()` argument read `+` as a combinator and left `2n` and `1` without tokens,
 * and the `of S` form (`_of_`) dropped the argument's token. Turning off the `NTH_PSEUDO_CLASSES`
 * check, or restoring the `(?![\w-])` lookahead, in `class.ts` reds this test.
 */
test.concurrent('tokenizes an+b and parity arguments, with or without of S', () => {
  const source = ':nth-child(2n+1):nth-last-of-type(-n+3_of_li):nth-child(odd_of_.x)'
  expect(texts(source, tokenizeStetCSSState(source, 0, 0)).filter(({ role }) => role.startsWith('selector.nth') || role === 'selector.type' || role === 'selector.combinator')).toEqual([
    { text: '2n+1', type: 'number', role: 'selector.nth', modifiers: ['selector'] },
    { text: '-n+3', type: 'number', role: 'selector.nth', modifiers: ['selector'] },
    { text: 'li', type: 'type', role: 'selector.type', modifiers: ['selector'] },
    { text: 'odd', type: 'enumMember', role: 'selector.nth', modifiers: ['selector'] }
  ])
})

/**
 * Guards: the `|` between a container name and its condition had no token.
 * Dropping `|` from the query punctuation in `class.ts` reds this test.
 */
test.concurrent('tokenizes the container name separator in a query', () => {
  const source = '@container(card|w>=600)'
  expect(texts(source, tokenizeStetCSSAtQuery(source, 0))).toContainEqual(
    { text: '|', type: 'operator', role: 'query.punctuation', modifiers: ['query'] }
  )
})

test.concurrent('tokenizes named query ranges with matching endpoint values', () => {
  const source = '@sm&<=md'
  expect(texts(source, tokenizeStetCSSAtQuery(source, 0))).toEqual([
    { text: '@', type: 'keyword', role: 'query.keyword', modifiers: ['query'] },
    { text: 'sm', type: 'enumMember', role: 'query.value', modifiers: ['query'] },
    { text: '&', type: 'operator', role: 'query.operator', modifiers: ['query'] },
    { text: '<=', type: 'operator', role: 'query.operator', modifiers: ['query'] },
    { text: 'md', type: 'enumMember', role: 'query.value', modifiers: ['query'] }
  ])
})

test.concurrent('tokenizes grouped class shell without parsing class semantics', () => {
  const source = '{fg:red;bg:blue}'
  const tokens = tokenizeStetCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'bg:blue', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined }
  ])
})

test.concurrent('tokenizes grouped class suffix as selector and query state', () => {
  const source = '{fg:red;block}>li:hover@sm'
  const tokens = tokenizeStetCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'block', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: '>', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: 'li', type: 'type', role: 'selector.type', modifiers: ['selector'] },
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'hover', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] }
  ])
})

test.concurrent('tokenizes grouped class query suffix', () => {
  const source = '{block}@sm'
  const tokens = tokenizeStetCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'block', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] }
  ])
})

test.concurrent('preserves grouped class recovery without closing braces', () => {
  const source = '{fg:red;bg:blue'
  const tokens = tokenizeStetCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'bg:blue', type: 'class', role: 'utility.semantic', modifiers: undefined }
  ])
})

test.concurrent('preserves brace-less grouped declarations', () => {
  const source = 'fg:red;bg:blue'
  const tokens = tokenizeStetCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'bg:blue', type: 'class', role: 'utility.semantic', modifiers: undefined }
  ])
})
