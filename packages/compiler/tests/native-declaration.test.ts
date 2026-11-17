import { describe, expect, it } from 'vitest'
import { parse } from 'css-tree'
import { compileCSSManifest } from '../src'
import { cssTreeNativeDeclarationMatcher, matchNativeDeclarationValue } from '../src/native-declaration'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import type { StetCSSManifest } from '@stet-css/schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest

const matches = (property: string, value: string) => cssTreeNativeDeclarationMatcher({ property, value })

/**
 * Guards #164: css-tree 3.2.1 rejects native syntax that browsers ship, so
 * builds silently dropped these declarations while the runtime, which asks
 * `CSS.supports`, kept them. Each `describe` is one narrow exception; its
 * rejected rows keep the exception from accepting other invalid values of
 * the same property or the construct where the property does not take it.
 * Reverse-checked: dropping `|| scroll-state` from `containerTypeSyntax` reds
 * the container-type accept rows and the compose test; giving the default
 * resolution unit `px` reds the image-set accept rows and the compose test;
 * skipping the property's own `auto` check reds only the `max-width` row;
 * allowing `size` after `any` reds only the `any` row.
 */
describe('css-tree gap exceptions', () => {
  describe('container-type: scroll-state (CSS Conditional 5)', () => {
    it.each(['scroll-state', 'size scroll-state', 'scroll-state inline-size'])('accepts %s', (value) => {
      expect(matches('container-type', value)).toBe(true)
    })

    it.each(['foo', 'normal scroll-state', 'scroll-state scroll-state', 'size inline-size scroll-state'])('rejects %s', (value) => {
      expect(matches('container-type', value)).toBe(false)
    })
  })

  describe('image-set() options without a resolution (CSS Images 4)', () => {
    it.each([
      ['background-image', 'image-set(url(a.png))'],
      ['background-image', 'image-set("a.png")'],
      ['background-image', 'image-set(url(a.png), url(b.png) 2x)'],
      ['background-image', 'image-set(url(a.png) type("image/png"))'],
      ['background', 'image-set(url(a.png)) no-repeat'],
      ['list-style-image', 'image-set(url(a.png))']
    ])('accepts %s: %s', (property, value) => {
      expect(matches(property, value)).toBe(true)
    })

    it.each([
      ['background-image', 'image-set(foo)'],
      ['background-image', 'image-set()'],
      ['background-image', 'image-set(url(a.png) 2x 3x)'],
      ['height', 'image-set(url(a.png))']
    ])('rejects %s: %s', (property, value) => {
      expect(matches(property, value)).toBe(false)
    })
  })

  describe('calc-size() with a size keyword basis and the size keyword (CSS Values 5)', () => {
    it.each([
      ['height', 'calc-size(auto,size)'],
      ['height', 'calc-size(auto, size + 10px)'],
      ['height', 'calc-size(auto, size * 2)'],
      ['height', 'calc-size(stretch, size)'],
      ['height', 'calc-size(fit-content, size)'],
      ['width', 'calc-size(calc-size(auto, size), size)'],
      ['height', 'calc-size(auto, calc(size * 2))']
    ])('accepts %s: %s', (property, value) => {
      expect(matches(property, value)).toBe(true)
    })

    it.each([
      ['height', 'calc-size(foo, size)'],
      ['height', 'calc-size(auto)'],
      ['height', 'calc-size(auto, foo)'],
      ['height', 'calc-size(any, size)'],
      ['height', 'calc-size(auto, size) 10px'],
      ['max-width', 'calc-size(auto, size)'],
      ['margin-top', 'calc-size(auto, size)']
    ])('rejects %s: %s', (property, value) => {
      expect(matches(property, value)).toBe(false)
    })
  })

  /**
   * Guards the reason `validateCSS` and `generateValidRules` agree with the
   * matcher: they call `matchNativeDeclarationValue` on css-tree's unparsed
   * `Raw` value, so the exceptions must see through it.
   * Reverse-checked: walking the `Raw` node unparsed reds this test and the
   * validator's `builds` rows for `image-set()` and `calc-size()`.
   */
  it('applies the exceptions to an unparsed Raw value', () => {
    const raw = parse('height:calc-size(auto,size)', { context: 'declaration', parseValue: false }) as any
    expect(raw.value.type).toBe('Raw')
    expect(matchNativeDeclarationValue('height', raw.value)).toBeNull()
    expect(matchNativeDeclarationValue('height', parse('calc-size(foo,size)', { context: 'value' }))).toMatchObject({ name: 'SyntaxMatchError' })
  })
})

/**
 * Guards #164 in the compiler's own lowering: `@compose` resolves native
 * classes through the same matcher, and threw "Invalid @compose class" for
 * these before.
 */
it('composes native declarations css-tree does not know', () => {
  const { css } = compileCSSManifest(`
    .card {
      @compose container-type:scroll-state height:calc-size(auto,size) background-image:image-set(url(a.png));
    }
  `, { baseManifest: defaultManifest })

  expect(css).toContain('container-type:scroll-state')
  expect(css).toContain('height:calc-size(auto,size)')
  expect(css).toContain('background-image:image-set(url(a.png))')
})
