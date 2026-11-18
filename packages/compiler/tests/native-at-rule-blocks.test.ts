import { expect, test } from 'vitest'
import { compileCSSManifest } from '../src'

const lines = (...rows: string[]) => rows.join('\n')

/**
 * Prevents (#187): a native `@layer`, `@media`, `@supports`, `@container` or `@starting-style`
 * block failing the build with "@keyframes is not allowed inside @variant" once one of its style
 * rules uses `@compose`, although the same block without `@compose` builds. The `@keyframes` stays
 * where the author wrote it, as in plain CSS, and the `@compose` rule still lowers.
 * Reverse check: throwing for every `@keyframes` in `parseNativeRuleBody` again reds all five rows
 * and the two `prints no` tests below; returning `[]` for the whole lowered block in `compileCSS`
 * also reds the statements test.
 */
test.each([
  ['@layer components', '@layer components', '@layer components'],
  ['@media print', '@media print', '@media print'],
  ['@supports (display:grid)', '@supports (display: grid)', '@supports (display:grid)'],
  ['@container card (width > 1px)', '@container card (width > 1px)', '@container card (width>1px)'],
  ['@starting-style', '@starting-style', '@starting-style']
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
 * an error, though plain CSS applies them. `@font-face`, `@property` and `@scope` stay where they
 * were written, including inside a nested condition block.
 * Reverse check: returning `[]` for the whole lowered block in `compileCSS` reds this test, the
 * `@keyframes` rows above and the two `prints no` tests below on the missing statements.
 */
test('keeps @font-face, @property and @scope beside a @compose rule in place', () => {
  const result = compileCSSManifest(`
    @layer components {
      .x { @compose p:1rem; }
      @font-face { font-family: a; src: url(a.woff) }
      @property --a { syntax: '*'; inherits: false }
      @media print { .y { @compose p:2rem; } @scope (.a) { .b { color: red } } }
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
    '  @media print {',
    '    @scope (.a) {',
    '      .b {',
    '        color: red;',
    '      }',
    '    }',
    '  }',
    '}'
  ))
  expect(result.generatedCSS).toBe('@layer components{.x{padding:1rem}}@layer components{@media print{.y{padding:2rem}}}')
})

const keyframesInLayer = lines(
  '@layer components {',
  '  @keyframes spin {',
  '    to {',
  '      rotate: 1turn;',
  '    }',
  '  }',
  '}'
)

/**
 * Prevents: a block that keeps native statements also printing its lowered rules as native CSS,
 * so `.x` gets its declarations a second time outside the managed rule order.
 * Reverse check: no longer returning `[]` for lowered children of a kept block in `compileCSS`
 * reds this test, the next one, and every test above.
 */
test('prints no lowered rule of a kept block as native CSS', () => {
  const result = compileCSSManifest('@layer components { .x { @compose p:1rem; } @keyframes spin { to { rotate: 1turn } } }')

  expect(result.nativeCSS).toBe(keyframesInLayer)
  expect(result.generatedCSS).toBe('@layer components{.x{padding:1rem}}')
})

/**
 * Prevents: a nested condition block that holds only lowered rules printing as an empty
 * `@media screen {}` in a block that keeps other statements.
 * Reverse check: keeping every nested at-rule of a kept block in `compileCSS` (skipping
 * `keepsNativeStatement` for it) reds this test alone.
 */
test('prints no nested block emptied by lowering', () => {
  const result = compileCSSManifest(`
    @layer components {
      @media screen { .z { @compose p:3rem; } }
      @keyframes spin { to { rotate: 1turn } }
    }
  `)

  expect(result.nativeCSS).toBe(keyframesInLayer)
  expect(result.generatedCSS).toBe('@layer components{@media screen{.z{padding:3rem}}}')
})

/**
 * Prevents: a statement under `@variant` disappearing without an error. `@variant` blocks are
 * lowered whole, so nothing emits a `@font-face` or `@property` written there, and `@keyframes`
 * there is a managed animation that belongs in `@theme`; both fail the build, at top level and
 * inside a native block whose `@compose` rules are lowered.
 * Reverse check: dropping the `@variant` condition from the guards in `parseNativeRuleBody` reds
 * all three rows and nothing else; before #187 the `@font-face` and `@property` rows compiled to
 * nothing, without an error.
 */
test.each([
  ['@font-face', '@font-face { font-family: a; src: url(a.woff) }', 'Native @variant blocks only accept'],
  ['@property', "@property --a { syntax: '*'; inherits: false }", 'Native @variant blocks only accept'],
  ['@keyframes', '@keyframes spin { to { rotate: 1turn } }', '@keyframes is not allowed inside @variant']
])('rejects %s under @variant', (_, statement, message) => {
  expect(() => compileCSSManifest(`@variant print { ${statement} }`)).toThrow(message)
  expect(() => compileCSSManifest(`@layer a { .x { @compose p:1rem; } @variant print { ${statement} } }`)).toThrow(message)
})
