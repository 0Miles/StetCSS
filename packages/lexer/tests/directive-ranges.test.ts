import { expect, test } from 'vitest'

import {
  collectCSSDeclarationRanges,
  collectCSSDirectiveRanges,
  findCSSStatementEnd
} from '../src'

test.concurrent('collects directive statement and block ranges', () => {
  const source = [
    '@source "a;b.css";',
    '@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } }'
  ].join('\n')
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['source', 'theme'])
  expect(source.slice(ranges[0].semicolonRange?.start, ranges[0].semicolonRange?.end)).toBe(';')
  expect(source.slice(ranges[0].quotedStringRanges[0].contentRange.start, ranges[0].quotedStringRanges[0].contentRange.end)).toBe('a;b.css')
  expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('')
  expect(ranges[1].blockRange).toBeDefined()
  expect(ranges[1].blockCloseRange).toBeDefined()
  expect(source.slice(ranges[1].blockRange!.start, ranges[1].blockRange!.start + 1)).toBe('{')
  expect(source.slice(ranges[1].blockCloseRange!.start, ranges[1].blockCloseRange!.end)).toBe('}')
})

test.concurrent('collects reference directive ranges', () => {
  const source = [
    '@reference "./a;b.css";',
    '@layer components { .btn { @reference "./nested.css"; } }'
  ].join('\n')
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['reference', 'reference'])
  expect(ranges[0].depth).toBe(0)
  expect(ranges[1].depth).toBe(2)
  expect(source.slice(ranges[0].semicolonRange?.start, ranges[0].semicolonRange?.end)).toBe(';')
  expect(source.slice(ranges[0].quotedStringRanges[0].contentRange.start, ranges[0].quotedStringRanges[0].contentRange.end)).toBe('./a;b.css')
})

test.concurrent('collects nested StetCSS directive ranges without treating host at-rules as directives', () => {
  const source = '@layer components { .btn { @compose block; @variant <sm { @compose hidden; } } }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['compose', 'variant', 'compose'])
  expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('<sm')
  expect(source.slice(ranges[2].preludeRange.start, ranges[2].preludeRange.end).trim()).toBe('hidden')
})

/**
 * Prevents: the range names `@stet-css/lexer` publishes for the removed `@dark` / `@light` blocks
 * drifting. Reported as `variant`, directive formatting treats them as directives and rewrites
 * `url(moon@light.png)` to `url(moon@light .png)`; not reported at all, a local CSS file whose
 * only directive is `@dark {}` skips the compiler and its removal error.
 * Reverse-checked in `collectCSSDirectiveRanges`: mapping dark and light back to `variant` reds this
 * test plus the language url formatting test; dropping them from `CSS_DIRECTIVE_RANGE_NAMES` reds
 * this test plus the three stylesheet local-style tests.
 */
test.concurrent('collects dark and light ranges under their own names', () => {
  const source = '.card { @dark { @compose fg:white; } @light { color: black; } }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['dark', 'compose', 'light'])
  expect(source.slice(ranges[0].keywordRange.start, ranges[0].keywordRange.end)).toBe('@dark')
  expect(source.slice(ranges[2].keywordRange.start, ranges[2].keywordRange.end)).toBe('@light')
})

/**
 * Prevents: a stylesheet whose only StetCSS syntax is a removed `@master` at-rule skipping the
 * compiler and its removal error. Every `@master` statement and block is located, whatever its
 * prelude, so local-style routing sends the file to the compiler; text such as
 * `url(logo@master.png)` is not an at-rule and is not located.
 * Reverse check: ignoring the statement-start flag for `@master`, or skipping non-entry `@master`
 * again, turns only this test red.
 */
test.concurrent('collects every @master at-rule, statement or block', () => {
  const source = '@master entry;\n@master shake;\n@master { mode-trigger: media; }\n.a { color: red; }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['master', 'master', 'master'])
  expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('shake')
  expect(ranges[2].blockRange).toBeDefined()
  expect(collectCSSDirectiveRanges('.logo { background: url(logo@master.png); }')).toEqual([])
})

test.concurrent('collects slot directive ranges inside custom variants', () => {
  const source = '@custom-variant motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['custom-variant', 'slot'])
  expect(source.slice(ranges[1].keywordRange.start, ranges[1].keywordRange.end)).toBe('@slot')
  expect(source.slice(ranges[1].semicolonRange!.start, ranges[1].semicolonRange!.end)).toBe(';')
})

test.concurrent('collects managed definition directive ranges', () => {
  const source = '@components { btn { @compose block; } }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['components', 'compose'])
  expect(source.slice(ranges[0].blockRange!.start, ranges[0].blockRange!.start + 1)).toBe('{')
  expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('block')
})

test.concurrent('does not collect @utility as a StetCSS directive', () => {
  const source = '@utility text-<left|center|right> { text-align: --value(); }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges).toEqual([])
})

test.concurrent('collects declaration ranges without splitting quoted semicolons', () => {
  const source = '@theme { --content: "a;b"; --root-size: 16 }'
  const blockStart = source.indexOf('{') + 1
  const blockEnd = source.lastIndexOf('}')
  const declarations = collectCSSDeclarationRanges(source, blockStart, blockEnd)

  expect(declarations.map((declaration) => source.slice(declaration.propertyRange.start, declaration.propertyRange.end))).toEqual([
    '--content',
    '--root-size'
  ])
  expect(source.slice(declarations[0].valueRange.start, declarations[0].valueRange.end)).toBe('"a;b"')
  expect(declarations[0].terminatorRange).toEqual({
    start: source.indexOf('; --root-size'),
    end: source.indexOf('; --root-size') + 1
  })
})

test.concurrent('collects only top-level declaration ranges', () => {
  const source = '@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } --duration-fast: 150ms }'
  const blockStart = source.indexOf('{') + 1
  const blockEnd = source.lastIndexOf('}')
  const declarations = collectCSSDeclarationRanges(source, blockStart, blockEnd)

  expect(declarations.map((declaration) => source.slice(declaration.propertyRange.start, declaration.propertyRange.end))).toEqual([
    '--color-primary',
    '--duration-fast'
  ])
})

test.concurrent('returns eof for incomplete directive statements', () => {
  const source = '@theme dark'
  expect(findCSSStatementEnd(source, '@theme'.length)).toEqual({
    end: source.length,
    reason: 'eof'
  })
})

/**
 * Prevents: a backslash-escaped quote in a selector opening a string for the directive scan, so a
 * CSS module with `.a\'b{}` before `@compose` reported no directives. A quote escaped inside a
 * string still leaves the string open.
 */
test.concurrent('locates directives after escaped quotes outside strings', () => {
  const source = String.raw`.a\'b{} .c{content:'it\'s'} .x{@compose block;}`
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => range.name)).toEqual(['compose'])
  expect(source.slice(ranges[0].start, ranges[0].end)).toBe('@compose block;')
  expect(collectCSSDirectiveRanges(String.raw`.a\'b{} @master entry;`).map((range) => range.name)).toEqual(['master'])
  expect(collectCSSDeclarationRanges(String.raw`a: \'x; b: 'y\';z'; c: 1`, 0, 24).map((range) => range.end))
    .toEqual([7, 19, 24])
})

/**
 * Prevents (#241): a nested directive written without its last `;`, as native CSS allows for the
 * last declaration of a block, running past the block's `}`. `.w { @compose p:2rem }` failed the
 * build with `Invalid @compose class: }`, and the directives after it read the wrong depth. The
 * prelude stops before the `}`, which still closes the block. A top-level statement has no block
 * to close and still runs to the end of the source.
 * Reverse check: dropping the nested `}` stop in `collectCSSDirectiveRanges` reds this test and the
 * compiler, language and lint `#241` tests.
 */
test.concurrent('ends a nested directive statement at the closing brace of its block', () => {
  const source = '@layer a { .w { @compose p:2rem } .x { @compose\n  m:1 } } @variant sm { @slot }'
  const ranges = collectCSSDirectiveRanges(source)

  expect(ranges.map((range) => [range.name, range.depth, source.slice(range.start, range.end)])).toEqual([
    ['compose', 2, '@compose p:2rem '],
    ['compose', 2, '@compose\n  m:1 '],
    ['variant', 0, '@variant sm { @slot }'],
    ['slot', 1, '@slot ']
  ])
  expect(source.slice(ranges[0].preludeRange.start, ranges[0].preludeRange.end)).toBe(' p:2rem ')
  expect(ranges[0].semicolonRange).toBeUndefined()
  expect(ranges[0].quotedStringRanges).toEqual([])
  expect(collectCSSDirectiveRanges('@compose p:2rem }').map((range) => range.end)).toEqual(['@compose p:2rem }'.length])
})
