import { expect, test } from 'vitest'
import { compileCSSManifest } from '../src'

const lines = (...rows: string[]) => rows.join('\n')

/**
 * Prevents (#187): a native `@layer`, `@media`, `@supports` or `@container` block failing the build
 * with "@keyframes is not allowed inside @variant" once one of its style rules uses `@compose`,
 * although the same block without `@compose` builds. The `@keyframes` stays where the author wrote
 * it, as in plain CSS, and the `@compose` rule still lowers.
 * Reverse check: throwing for every `@keyframes` in `parseNativeRuleBody` again, or returning `[]`
 * for the whole lowered block in `compileCSS`, reds all four rows and the next test.
 */
test.each([
  ['@layer components', '@layer components', '@layer components'],
  ['@media print', '@media print', '@media print'],
  ['@supports (display:grid)', '@supports (display: grid)', '@supports (display:grid)'],
  ['@container card (width > 1px)', '@container card (width > 1px)', '@container card (width>1px)']
])('keeps @keyframes beside a @compose rule in a native %s block', (atRule, nativeAtRule, generatedAtRule) => {
  const result = compileCSSManifest(`${atRule} { .x { @compose p:1rem; } @keyframes spin { to { rotate: 1turn } } }`)

  expect(result.nativeCSS).toBe(lines(
    `${nativeAtRule} {`,
    '  @keyframes spin {',
    '    to {',
    '      rotate: 1turn;',
    '    }',
    '  }',
    '}'
  ))
  expect(result.generatedCSS).toBe(`${generatedAtRule}{.x{padding:1rem}}`)
})

/**
 * Prevents: the other native statements of a block with a `@compose` rule being dropped without
 * an error. `@font-face`, `@property` and `@scope` stay where they were written, a nested condition
 * block keeps only what it holds besides lowered rules, and one left with nothing disappears
 * instead of printing empty.
 * Reverse check: returning `[]` for the whole lowered block in `compileCSS` reds this test on the
 * missing statements; no longer dropping the lowered rules of a kept block reds it and the rows
 * above on the lowered rules printed again as native CSS.
 */
test('keeps the other native statements of a block with a @compose rule in place', () => {
  const result = compileCSSManifest(`
    @layer components {
      .x { @compose p:1rem; }
      @font-face { font-family: a; src: url(a.woff) }
      @property --a { syntax: '*'; inherits: false }
      @scope (.a) { .b { color: red } }
      @media print { .y { @compose p:2rem; } @keyframes spin { to { rotate: 1turn } } }
      @media screen { .z { @compose p:3rem; } }
    }
  `)

  expect(result.nativeCSS).toBe(lines(
    '@layer components {',
    '  @font-face {',
    '    font-family: a;',
    '    src: url("a.woff");',
    '  }',
    '',
    '  @property --a {',
    '    syntax: "*";',
    '    inherits: false',
    '  }',
    '',
    '  @scope (.a) {',
    '    .b {',
    '      color: red;',
    '    }',
    '  }',
    '',
    '  @media print {',
    '    @keyframes spin {',
    '      to {',
    '        rotate: 1turn;',
    '      }',
    '    }',
    '  }',
    '}'
  ))
  expect(result.generatedCSS).toBe('@layer components{.x{padding:1rem}}@layer components{@media print{.y{padding:2rem}}}@layer components{@media screen{.z{padding:3rem}}}')
})
