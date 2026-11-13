/**
 * Builtin single-colon pseudo-classes: mdn-data's `css/selectors.json` names
 * without `()`, minus the `@page`-only `:left`, `:right` and `:blank`, plus
 * the engine's `:of`. `tests/pseudo-class-allowlist.test.ts` keeps this list
 * equal to mdn-data.
 */
const pseudoClasses: ReadonlySet<string> = new Set([
  ':active',
  ':active-view-transition',
  ':active-view-transition-type',
  ':any-link',
  ':autofill',
  ':buffering',
  ':checked',
  ':current',
  ':default',
  ':defined',
  ':dir',
  ':disabled',
  ':empty',
  ':enabled',
  ':first',
  ':first-child',
  ':first-of-type',
  ':focus',
  ':focus-visible',
  ':focus-within',
  ':fullscreen',
  ':future',
  ':has',
  ':has-slotted',
  ':host',
  ':host-context',
  ':hover',
  ':in-range',
  ':indeterminate',
  ':invalid',
  ':is',
  ':lang',
  ':last-child',
  ':last-of-type',
  ':link',
  ':local-link',
  ':modal',
  ':muted',
  ':not',
  ':nth-child',
  ':nth-last-child',
  ':nth-last-of-type',
  ':nth-of-type',
  ':of',
  ':only-child',
  ':only-of-type',
  ':open',
  ':optional',
  ':out-of-range',
  ':past',
  ':paused',
  ':picture-in-picture',
  ':placeholder-shown',
  ':playing',
  ':popover-open',
  ':read-only',
  ':read-write',
  ':required',
  ':root',
  ':scope',
  ':seeking',
  ':stalled',
  ':state',
  ':target',
  ':target-current',
  ':target-within',
  ':user-invalid',
  ':user-valid',
  ':valid',
  ':visited',
  ':volume-locked',
  ':where',
  ':xr-overlay'
])

const VENDOR_PSEUDO_CLASS = /^:-(?:webkit|moz|ms)-/

/**
 * Whether a class may write the single-colon pseudo-class `name` (colon
 * included, as written): a builtin one, a vendor-prefixed one, or a selector
 * token of the instance, which covers builtin aliases such as `:even` and the
 * manifest's own tokens.
 */
export function isKnownPseudoClass(name: string, selectors: ReadonlyMap<string, unknown>) {
  return pseudoClasses.has(name) || VENDOR_PSEUDO_CLASS.test(name) || selectors.has(name)
}

export default pseudoClasses
