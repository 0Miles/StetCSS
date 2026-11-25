import { expect, test } from 'vitest'
import { compileCSS, compileCSSManifest } from '../src'

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

/**
 * Prevents: a `@keyframes` keyframe block losing its fallbacks, top-level or nested in `@layer` or
 * `@media`, so an animation frame sets no height in browsers without `dvh` (#242). The same
 * declarations in a style rule keep them.
 * Reverse check: with `preserveNativeFallbacks` leaving `keyframes` rules alone (before #242), this
 * test and the next were red.
 */
test.concurrent('keeps fallbacks in keyframe blocks, top-level and nested in @layer or @media', () => {
  const { nativeCSS } = compileCSS([
    '@keyframes k { from { height: 100vh; height: 100dvh } to { height: 0 } }',
    '@layer a { @keyframes l { from { height: 100vh; height: 100dvh } } }',
    '@media print { @keyframes m { 50%, to { color: #f00; color: oklch(60% .2 30) } } }'
  ].join('\n'))

  expect(nativeCSS).toBe(lines(
    '@keyframes k {',
    '  from {',
    '    height: 100vh;',
    '    height: 100dvh;',
    '  }',
    '',
    '  to {',
    '    height: 0;',
    '  }',
    '}',
    '',
    '@layer a {',
    '  @keyframes l {',
    '    from {',
    '      height: 100vh;',
    '      height: 100dvh;',
    '    }',
    '  }',
    '}',
    '',
    '@media print {',
    '  @keyframes m {',
    '    50%, to {',
    '      color: red;',
    '      color: oklch(60% .2 30);',
    '    }',
    '  }',
    '}'
  ))
})

/**
 * Prevents: a `@keyframes` kept beside a `@compose` rule in a native `@layer` block (#187) losing
 * its fallbacks, while the `@compose` rule still lowers (#242).
 * Reverse check: as above.
 */
test.concurrent('keeps keyframe fallbacks beside a @compose rule in a native @layer block', () => {
  const result = compileCSSManifest('@layer components { .x { @compose p:1rem; } @keyframes k { from { height: 100vh; height: 100dvh } } }')

  expect(result.nativeCSS).toBe(lines(
    '@layer components {',
    '  @keyframes k {',
    '    from {',
    '      height: 100vh;',
    '      height: 100dvh;',
    '    }',
    '  }',
    '}'
  ))
  expect(result.generatedCSS).toBe('@layer components{.x{padding:1rem}}')
})

/**
 * Prevents: one keyframe's fallbacks breaking or reprinting the other keyframes of its rule. A
 * sibling holding `var()`, `env()` or `image-set()` failed the build (lightningcss could not read
 * the rebuilt rule back), and percentages printed as `25.0%`, where the rule compiles and prints
 * them as written without the fallback (#242).
 * Reverse check: rebuilding the whole rule from its parsed form (the first #242 attempt) turned
 * this test red on the deserialize error.
 */
test.concurrent('prints sibling keyframes of a keyframe with fallbacks as lightningcss does', () => {
  const { nativeCSS } = compileCSS([
    '@keyframes a { from { transform: translateY(var(--distance)); opacity: 0 } to { height: 100vh; height: 100dvh } }',
    '@media (min-width: 1px) { @keyframes b { from { background-image: image-set("a.png" 1x); left: env(safe-area-inset-left) } to { transform: translateY(var(--distance)); height: 100vh; height: 100dvh } } }',
    '@keyframes c { from { animation-timing-function: linear(0, .5 25%, 1); shape-outside: circle(50%); transform-origin: 10% 20% 1px } to { height: 100vh; height: 100dvh } }'
  ].join('\n'))

  expect(nativeCSS).toBe(lines(
    '@keyframes a {',
    '  from {',
    '    transform: translateY(var(--distance));',
    '    opacity: 0;',
    '  }',
    '',
    '  to {',
    '    height: 100vh;',
    '    height: 100dvh;',
    '  }',
    '}',
    '',
    '@media (width >= 1px) {',
    '  @keyframes b {',
    '    from {',
    '      left: env(safe-area-inset-left);',
    '      background-image: image-set("a.png" 1x);',
    '    }',
    '',
    '    to {',
    '      transform: translateY(var(--distance));',
    '      height: 100vh;',
    '      height: 100dvh;',
    '    }',
    '  }',
    '}',
    '',
    '@keyframes c {',
    '  from {',
    '    animation-timing-function: linear(0, .5 25%, 1);',
    '    shape-outside: circle(50%);',
    '    transform-origin: 10% 20% 1px;',
    '  }',
    '',
    '  to {',
    '    height: 100vh;',
    '    height: 100dvh;',
    '  }',
    '}'
  ))
})

/**
 * Prevents: a `@keyframes` rule without fallbacks printing where it did not before: of two rules
 * with the same name, lightningcss keeps only the later, also when the later has fallbacks.
 * Reverse check: with a placeholder rule that did not carry the name (a draft of this fix), the
 * earlier rule printed too.
 */
test.concurrent('drops the earlier of two same-name @keyframes as before when the later has fallbacks', () => {
  expect(compileCSS('@keyframes k { from { height: 1px } } @keyframes k { from { height: 100vh; height: 100dvh } }').nativeCSS).toBe(lines(
    '@keyframes k {',
    '  from {',
    '    height: 100vh;',
    '    height: 100dvh;',
    '  }',
    '}'
  ))
})

/**
 * Prevents: a vendor-prefixed `@keyframes` with fallbacks vanishing beside an unprefixed rule of
 * the same name. lightningcss keeps both; a placeholder without the prefix read as a duplicate of
 * the later rule and was dropped.
 * Reverse check: `vendorPrefix: ['none']` for every placeholder in `preserveKeyframeFallbacks`
 * turns only this test red.
 */
test.concurrent('keeps a prefixed @keyframes with fallbacks beside an unprefixed one of the same name', () => {
  expect(compileCSS('@-webkit-keyframes k { from { height: 100vh; height: 100dvh } } @keyframes k { from { height: 1px } }').nativeCSS).toBe(lines(
    '@-webkit-keyframes k {',
    '  from {',
    '    height: 100vh;',
    '    height: 100dvh;',
    '  }',
    '}',
    '',
    '@keyframes k {',
    '  from {',
    '    height: 1px;',
    '  }',
    '}'
  ))
})

/**
 * Prevents: a keyframe losing a declaration when its written block does not split the way
 * lightningcss parsed it (a `{}` value reads as a nested rule to the source scanner). Such a
 * keyframe keeps lightningcss's printing: it loses the fallback, as before #242, but `--x` stays.
 * The expected output is the fixed point's. This pins the written/parsed count check in
 * `preserveKeyframeFallbacks`, which the review's mutant dropped.
 */
test.concurrent('falls back to lightningcss printing when a keyframe\'s written declarations do not line up', () => {
  expect(compileCSS('@keyframes k { from { height: 100vh; height: 100dvh; --x: {a;b} } }').nativeCSS).toBe(lines(
    '@keyframes k {',
    '  from {',
    '    --x: {a;b};',
    '    height: 100dvh;',
    '  }',
    '}'
  ))
})

/**
 * Prevents: a declaration whose name starts with U+00A0 (or U+2003, U+FEFF), which CSS reads as
 * part of the name, being split as if it were whitespace: the reprinted rule failed the build or printed
 * `\u00a0color` as `color`, a property the author did not write.
 * Reverse check: skipping `\s` instead of CSS whitespace in `splitRawDeclarationGroups` turned this
 * test red on `Unexpected token Semicolon`.
 */
test.concurrent('keeps a U+00A0, U+2003 or U+FEFF at the start of a declaration name when reprinting fallbacks', () => {
  expect(compileCSS([
    '@keyframes k { from { height: 100vh; height: 100dvh; \u00a0: red } }',
    '.a { height: 100vh; height: 100dvh; \u00a0color: red }',
    '.b { height: 100vh; height: 100dvh; \u2003color: red; \ufeffcolor: red }'
  ].join('\n')).nativeCSS).toBe(lines(
    '@keyframes k {',
    '  from {',
    '    height: 100vh;',
    '    height: 100dvh;',
    '    \u00a0: red;',
    '  }',
    '}',
    '',
    '.a {',
    '  height: 100vh;',
    '  height: 100dvh;',
    '  \u00a0color: red;',
    '}',
    '',
    '.b {',
    '  height: 100vh;',
    '  height: 100dvh;',
    '  \u2003color: red;',
    '  \ufeffcolor: red;',
    '}'
  ))
})

/**
 * Prevents: a native rule that `@compose` lowers losing the fallbacks the same rule keeps without
 * `@compose`, so browsers without `dvh` get no height (#242). The rule's own declarations, those
 * after a nested rule, and those of the nested rule keep them, inside an at-rule block too, and
 * so do the bodies of a nested `@media` and of `@variant`, which the compiler lowers the same way.
 * Reverse check: collecting a lowered rule's blocks one value per property (before #242) turned
 * this test and the next red.
 */
test.concurrent('keeps fallbacks in rules lowered by @compose', () => {
  expect(compileCSSManifest('.x { @compose p:1rem; height: 100vh; height: 100dvh }').generatedCSS)
    .toBe('.x{padding:1rem;height:100vh;height:100dvh}')
  expect(compileCSSManifest(
    '@media print { .y { @compose p:1rem; color: #f00; color: oklch(60% .2 30); .z & { height: 100vh; height: 100dvh } width: 100vw; width: 100dvw } }'
  ).generatedCSS).toBe(
    '@media print{.y{padding:1rem;color:red;color:oklch(60% .2 30);width:100vw;width:100dvw}}@media print{.z .y{height:100vh;height:100dvh}}'
  )
  expect(compileCSSManifest('.x { @compose p:1rem; @media print { height: 100vh; height: 100dvh } }').generatedCSS)
    .toBe('.x{padding:1rem}@media print{.x{height:100vh;height:100dvh}}')
  expect(compileCSSManifest('.x { @variant dark { height: 100vh; height: 100dvh } }').generatedCSS)
    .toBe('@media (prefers-color-scheme:dark){.x{height:100vh;height:100dvh}}')
  expect(compileCSSManifest('@variant dark { .x { height: 100vh; height: 100dvh } }').generatedCSS)
    .toBe('@media (prefers-color-scheme:dark){.x{height:100vh;height:100dvh}}')
})

/**
 * Prevents: a lowered rule's fallbacks printing out of the written order or under the wrong name.
 * A longhand written before and after its shorthand keeps its place around it, a vendor-prefixed
 * declaration keeps its prefix, `!important` pairs stay important, and the fallbacks of a
 * declaration a composed `!important` one keeps out go with it, even when written before another
 * property's declaration. A fallback written before another property's declaration stays when a
 * composed declaration replaces that one.
 * Reverse check: as above; passing those fallbacks on to the next declaration that applies, instead
 * of dropping them, turned only the `.f` row red; dropping the fallbacks listed under a replaced
 * declaration turned the `.g` row red.
 */
test.concurrent('keeps lowered fallbacks in written order with their prefix and importance', () => {
  expect(compileCSSManifest([
    '.a { @compose p:1rem; background-color: #f00; background: red; background-color: oklch(60% .2 30) }',
    '.b { @compose p:1rem; -webkit-transition: color 1s; transition: color 1s }',
    '.c { @compose p:1rem; color: #f00 !important; color: oklch(60% .2 30) !important }',
    '.d { @compose h:10px; height: 100vh; height: 100dvh }',
    '.e { @compose h:10px!; height: 100vh; height: 100dvh }',
    '.f { @compose h:10px!; height: 100vh; width: 1px; height: 100dvh }',
    '.g { min-height: 100vh; padding: 0; min-height: 100dvh; @compose p:1rem; }'
  ].join('\n')).generatedCSS).toBe([
    '.a{padding:1rem;background-color:red;background:red;background-color:oklch(60% .2 30)}',
    '.b{padding:1rem;-webkit-transition:color 1s;transition:color 1s}',
    '.c{padding:1rem;color:red !important;color:oklch(60% .2 30) !important}',
    '.d{height:100vh;height:100dvh}',
    '.e{height:10px!important}',
    '.f{height:10px!important;width:1px}',
    '.g{min-height:100vh;min-height:100dvh;padding:1rem}'
  ].join(''))
})

/**
 * Prevents: lowered declarations without a fallback changing output (#242): a rule with no
 * overridden declaration, and a later rule for the same selector whose declaration replaces one
 * that had fallbacks, which prints alone as it did, wherever those fallbacks were written.
 * Reverse check: clearing only the fallbacks listed under the replaced declaration printed a
 * stray `height:100vh` in the `.z` row.
 */
test.concurrent('leaves lowered declarations without fallbacks unchanged', () => {
  expect(compileCSSManifest([
    '.x { @compose p:1rem; height: 100dvh; border: 1px solid red; border-radius: 2px }',
    '.y { @compose p:1rem; height: 100vh; height: 100dvh }',
    '.y { @compose p:2rem; height: 1px }',
    '.z { @compose p:1rem; height: 100vh; width: 1px; height: 100dvh }',
    '.z { @compose p:2rem; height: 1px }'
  ].join('\n')).generatedCSS).toBe('.x{padding:1rem;height:100dvh;border:1px solid red;border-radius:2px}.y{padding:2rem;height:1px}.z{width:1px;padding:2rem;height:1px}')
})
