import { expect, test } from 'vitest'
import type { HighlightTokenItem } from '../src/semantic/highlight'
import { tokenizeManagedDefinitionBlock } from '../src/semantic/css/managed'

/**
 * Guards #186 in the managed definition tokenizer: an escaped quote outside a string in a
 * declaration value (`Foo\'s`) opened a string to the end of the value, so a later `$name` in it
 * lost its highlighting. A quote escaped inside a string still ends that string, so the
 * `--value()` after `'it\'s'` keeps its highlighting.
 * Rule 6 trade-off: `tokenizeManagedDefinitionBlock` has no caller in any package, so no public
 * entry reaches it; this test calls the module directly instead of a public seam.
 * Reverse check: dropping the `\` branch of `skipCSSEscapeStringOrComment` in lexer `src`, then
 * `bun run build`, reds this test.
 */
test('highlights value syntax after an escaped quote outside a string', () => {
  const source = "btn { font-family: Foo\\'s, $brand; content: 'it\\'s' --value(); }"
  const tokens: HighlightTokenItem[] = []
  tokenizeManagedDefinitionBlock(source, 0, source.length, tokens)

  expect(tokens.map((token) => [source.slice(token.start, token.end), token.role])).toEqual(expect.arrayContaining([
    ['$brand', 'value.variable'],
    ['--value', 'value.function.name']
  ]))
})
