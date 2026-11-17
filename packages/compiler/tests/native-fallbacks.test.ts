import { expect, test } from 'vitest'
import { compileCSS } from '../src'

const lines = (...rows: string[]) => rows.join('\n')

/**
 * Prevents: the entry's native CSS losing the fallbacks written for older browsers. Browsers
 * without `dvh`, `oklch()` or unprefixed `backdrop-filter` get no height, colour or blur when
 * only the last declaration of each property survives, though the same rule in a plain
 * stylesheet keeps them all (#163).
 * Reverse check: making `preserveNativeFallbacks` in `core.ts` return before it replaces the
 * declarations turns this test, the shorthand/nesting, longhand, placeholder, comment and
 * multi-line tests red, and no other compiler test.
 */
test.concurrent('keeps repeated, vendor-prefixed and colour fallback declarations in source order', () => {
  const { nativeCSS } = compileCSS(
    '.a { height: 100vh; height: 100dvh; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); color: #f00; color: oklch(60% .2 30) }'
  )

  expect(nativeCSS).toBe(lines(
    '.a {',
    '  height: 100vh;',
    '  height: 100dvh;',
    '  -webkit-backdrop-filter: blur(2px);',
    '  backdrop-filter: blur(2px);',
    '  color: red;',
    '  color: oklch(60% .2 30);',
    '}'
  ))
})

/**
 * Prevents: fallbacks surviving only in the flat case. A longhand that overrides its shorthand,
 * `!important` pairs, rules nested in `@media` or another rule, and declarations that follow a
 * nested rule are the same fallback written another way.
 * Reverse check: as above.
 */
test.concurrent('keeps shorthand, important and nested fallbacks', () => {
  const { nativeCSS } = compileCSS([
    '.a { background: #f00; background-color: oklch(60% .2 30) }',
    '.b { color: #f00 !important; color: oklch(60% .2 30) !important }',
    '@media (width >= 1px) { .d { width: 100vw; width: 100dvw; .e & { height: 100vh; height: 100dvh } min-height: 100vh; min-height: 100dvh } }'
  ].join('\n'))

  expect(nativeCSS).toBe(lines(
    '.a {',
    '  background: red;',
    '  background-color: oklch(60% .2 30);',
    '}',
    '',
    '.b {',
    '  color: red !important;',
    '  color: oklch(60% .2 30) !important;',
    '}',
    '',
    '@media (width >= 1px) {',
    '  .d {',
    '    width: 100vw;',
    '    width: 100dvw;',
    '',
    '    .e & {',
    '      height: 100vh;',
    '      height: 100dvh;',
    '    }',
    '',
    '    min-height: 100vh;',
    '    min-height: 100dvh;',
    '  }',
    '}'
  ))
})

/**
 * Prevents: longhands that a later shorthand overrides being dropped, or printed as the
 * shorthand twice, when the names share no prefix: `place-items` sets `align-items` and
 * `justify-items`, `inset` sets `top`, `right`, `bottom` and `left`.
 * Reverse check: as above.
 */
test.concurrent('keeps longhands a later shorthand overrides when their names differ', () => {
  const { nativeCSS } = compileCSS([
    '.p { align-items: center; justify-items: center; place-items: start }',
    '.i { top: 0; right: 0; bottom: 0; left: 0; inset: 0 }'
  ].join('\n'))

  expect(nativeCSS).toBe(lines(
    '.p {',
    '  align-items: center;',
    '  justify-items: center;',
    '  place-items: start;',
    '}',
    '',
    '.i {',
    '  top: 0;',
    '  right: 0;',
    '  bottom: 0;',
    '  left: 0;',
    '  inset: 0;',
    '}'
  ))
})

/**
 * Prevents: rules without an overridden declaration changing output. `border` does not set
 * `border-radius`, and the four margin longhands override nothing, so lightningcss still prints
 * the rule, `margin: 0` included, as before #163.
 * Reverse check: making `hasOverriddenDeclaration` return true for any rule with two
 * declarations turns only this test red.
 */
test.concurrent('leaves rules without an overridden declaration as lightningcss prints them', () => {
  const { nativeCSS } = compileCSS(
    '.c { border: 1px solid red; border-radius: 2px; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0 }'
  )

  expect(nativeCSS).toBe(lines(
    '.c {',
    '  border: 1px solid red;',
    '  border-radius: 2px;',
    '  margin: 0;',
    '}'
  ))
})

/**
 * Prevents: a stylesheet that declares the placeholder's public-looking name breaking the build
 * (an index past the saved groups) or receiving another rule's declarations (lightningcss merging
 * rules whose declarations are equal). Placeholders carry a per-compile nonce.
 * Reverse check: dropping the nonce from `nativeFallbacksPlaceholder` turns only this test red.
 */
test.concurrent('leaves custom properties named like the placeholder alone', () => {
  const { nativeCSS } = compileCSS([
    '.a { height: 1px; height: 2px }',
    '.b { --stet-native-fallbacks-0: x }',
    '.c { --stet-native-fallbacks-7: x }'
  ].join('\n'))

  expect(nativeCSS).toBe(lines(
    '.a {',
    '  height: 1px;',
    '  height: 2px;',
    '}',
    '',
    '.b {',
    '  --stet-native-fallbacks-0: x;',
    '}',
    '',
    '.c {',
    '  --stet-native-fallbacks-7: x;',
    '}'
  ))
})

/**
 * Prevents: comments between declarations counting as declarations, so a commented rule would
 * lose its fallbacks or print a comment as a declaration line.
 * Reverse check: as in the first test.
 */
test.concurrent('keeps fallbacks in rules with comment-only statements', () => {
  expect(compileCSS('.c { /* lead */ height: 100vh; /* mid */ height: 100dvh; /* tail */ }').nativeCSS).toBe(lines(
    '.c {',
    '  height: 100vh;',
    '  height: 100dvh;',
    '}'
  ))
})

/**
 * Prevents: a value lightningcss prints over several lines losing its continuation indent, or its
 * rows, when the rule is reprinted.
 * Reverse check: as in the first test.
 */
test.concurrent('keeps the indent of multi-line values', () => {
  expect(compileCSS('@media (width >= 1px) { .g { grid-template-areas: "a b" "c d"; grid-template-areas: "a" "b" } }').nativeCSS).toBe(lines(
    '@media (width >= 1px) {',
    '  .g {',
    '    grid-template-areas: "a b"',
    '                         "c d";',
    '    grid-template-areas: "a"',
    '                         "b";',
    '  }',
    '}'
  ))
})

/**
 * Prevents: declarations disappearing when the written block does not split the way lightningcss
 * parsed it (a `{}` value reads as a nested rule to the source scanner). Such a rule keeps
 * lightningcss's printing: it loses the fallback, as before #163, but every property survives.
 * Reverse check: removing the declaration-count check in `preserveNativeFallbacks` turns only
 * this test red (`--x` and `height` vanish).
 */
test.concurrent('falls back to lightningcss printing when the written declarations do not line up', () => {
  expect(compileCSS('.d { width: 1px; width: 2px; --x: { a: b }; height: 1px }').nativeCSS).toBe(lines(
    '.d {',
    '  --x: { a: b };',
    '  width: 2px;',
    '  height: 1px;',
    '}'
  ))
})
