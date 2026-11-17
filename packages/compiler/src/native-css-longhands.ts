/**
 * Every longhand each native CSS shorthand sets, transitively (`border` includes `border-top-width`).
 * Derived from mdn-data 2.28.1 `css/properties.json` (the `computed` lists of unprefixed shorthands),
 * plus `font-synthesis`, `font-variant` and `white-space`, whose longhands mdn-data does not list.
 * Vendor prefixes are left out: callers compare unprefixed property names.
 */
const NATIVE_CSS_LONGHANDS: Record<string, readonly string[]> = {
  animation: ['animation-delay', 'animation-direction', 'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name', 'animation-play-state', 'animation-timeline', 'animation-timing-function'],
  'animation-range': ['animation-range-end', 'animation-range-start'],
  background: ['background-attachment', 'background-clip', 'background-color', 'background-image', 'background-origin', 'background-position', 'background-position-x', 'background-position-y', 'background-repeat', 'background-size'],
  'background-position': ['background-position-x', 'background-position-y'],
  border: ['border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-color', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right-color', 'border-right-style', 'border-right-width', 'border-style', 'border-top-color', 'border-top-style', 'border-top-width', 'border-width'],
  'border-block': ['border-block-color', 'border-block-end-color', 'border-block-end-style', 'border-block-end-width', 'border-block-start-color', 'border-block-start-style', 'border-block-start-width', 'border-block-style', 'border-block-width'],
  'border-block-color': ['border-block-end-color', 'border-block-start-color'],
  'border-block-end': ['border-block-end-color', 'border-block-end-style', 'border-block-end-width'],
  'border-block-start': ['border-block-start-color', 'border-block-start-style', 'border-block-start-width'],
  'border-block-style': ['border-block-end-style', 'border-block-start-style'],
  'border-block-width': ['border-block-end-width', 'border-block-start-width'],
  'border-bottom': ['border-bottom-color', 'border-bottom-style', 'border-bottom-width'],
  'border-color': ['border-bottom-color', 'border-left-color', 'border-right-color', 'border-top-color'],
  'border-image': ['border-image-outset', 'border-image-repeat', 'border-image-slice', 'border-image-source', 'border-image-width'],
  'border-inline': ['border-inline-color', 'border-inline-end-color', 'border-inline-end-style', 'border-inline-end-width', 'border-inline-start-color', 'border-inline-start-style', 'border-inline-start-width', 'border-inline-style', 'border-inline-width'],
  'border-inline-color': ['border-inline-end-color', 'border-inline-start-color'],
  'border-inline-end': ['border-inline-end-color', 'border-inline-end-style', 'border-inline-end-width'],
  'border-inline-start': ['border-inline-start-color', 'border-inline-start-style', 'border-inline-start-width'],
  'border-inline-style': ['border-inline-end-style', 'border-inline-start-style'],
  'border-inline-width': ['border-inline-end-width', 'border-inline-start-width'],
  'border-left': ['border-left-color', 'border-left-style', 'border-left-width'],
  'border-radius': ['border-bottom-left-radius', 'border-bottom-right-radius', 'border-top-left-radius', 'border-top-right-radius'],
  'border-right': ['border-right-color', 'border-right-style', 'border-right-width'],
  'border-style': ['border-bottom-style', 'border-left-style', 'border-right-style', 'border-top-style'],
  'border-top': ['border-top-color', 'border-top-style', 'border-top-width'],
  'border-width': ['border-bottom-width', 'border-left-width', 'border-right-width', 'border-top-width'],
  caret: ['caret-animation', 'caret-color', 'caret-shape'],
  'column-rule': ['column-rule-color', 'column-rule-style', 'column-rule-width'],
  columns: ['column-count', 'column-height', 'column-width'],
  'contain-intrinsic-size': ['contain-intrinsic-height', 'contain-intrinsic-width'],
  container: ['container-name', 'container-type'],
  'corner-block-end-shape': ['corner-end-end-shape', 'corner-end-start-shape'],
  'corner-block-start-shape': ['corner-start-end-shape', 'corner-start-start-shape'],
  'corner-bottom-shape': ['corner-bottom-left-shape', 'corner-bottom-right-shape'],
  'corner-inline-end-shape': ['corner-end-end-shape', 'corner-start-end-shape'],
  'corner-inline-start-shape': ['corner-start-end-shape', 'corner-start-start-shape'],
  'corner-left-shape': ['corner-bottom-left-shape', 'corner-top-left-shape'],
  'corner-right-shape': ['corner-bottom-right-shape', 'corner-top-right-shape'],
  'corner-shape': ['corner-bottom-left-shape', 'corner-bottom-right-shape', 'corner-top-left-shape', 'corner-top-right-shape'],
  'corner-top-shape': ['corner-top-left-shape', 'corner-top-right-shape'],
  flex: ['flex-basis', 'flex-grow', 'flex-shrink'],
  'flex-flow': ['flex-direction', 'flex-wrap'],
  font: ['font-family', 'font-size', 'font-stretch', 'font-style', 'font-variant', 'font-variant-alternates', 'font-variant-caps', 'font-variant-east-asian', 'font-variant-emoji', 'font-variant-ligatures', 'font-variant-numeric', 'font-variant-position', 'font-weight', 'line-height'],
  'font-synthesis': ['font-synthesis-position', 'font-synthesis-small-caps', 'font-synthesis-style', 'font-synthesis-weight'],
  'font-variant': ['font-variant-alternates', 'font-variant-caps', 'font-variant-east-asian', 'font-variant-emoji', 'font-variant-ligatures', 'font-variant-numeric', 'font-variant-position'],
  gap: ['column-gap', 'row-gap'],
  grid: ['column-gap', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows', 'grid-column-gap', 'grid-row-gap', 'grid-template-areas', 'grid-template-columns', 'grid-template-rows', 'row-gap'],
  'grid-area': ['grid-column-end', 'grid-column-start', 'grid-row-end', 'grid-row-start'],
  'grid-column': ['grid-column-end', 'grid-column-start'],
  'grid-gap': ['grid-column-gap', 'grid-row-gap'],
  'grid-row': ['grid-row-end', 'grid-row-start'],
  'grid-template': ['grid-template-areas', 'grid-template-columns', 'grid-template-rows'],
  inset: ['bottom', 'left', 'right', 'top'],
  'inset-block': ['inset-block-end', 'inset-block-start'],
  'inset-inline': ['inset-inline-end', 'inset-inline-start'],
  'interest-delay': ['interest-delay-end', 'interest-delay-start'],
  'list-style': ['list-style-image', 'list-style-position', 'list-style-type'],
  margin: ['margin-bottom', 'margin-left', 'margin-right', 'margin-top'],
  'margin-block': ['margin-block-end', 'margin-block-start'],
  'margin-inline': ['margin-inline-end', 'margin-inline-start'],
  mask: ['mask-clip', 'mask-composite', 'mask-image', 'mask-mode', 'mask-origin', 'mask-position', 'mask-repeat', 'mask-size'],
  'mask-border': ['mask-border-mode', 'mask-border-outset', 'mask-border-repeat', 'mask-border-slice', 'mask-border-source', 'mask-border-width'],
  offset: ['offset-anchor', 'offset-distance', 'offset-path', 'offset-position', 'offset-rotate'],
  outline: ['outline-color', 'outline-style', 'outline-width'],
  overflow: ['overflow-x', 'overflow-y'],
  'overscroll-behavior': ['overscroll-behavior-x', 'overscroll-behavior-y'],
  padding: ['padding-bottom', 'padding-left', 'padding-right', 'padding-top'],
  'padding-block': ['padding-block-end', 'padding-block-start'],
  'padding-inline': ['padding-inline-end', 'padding-inline-start'],
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'place-self': ['align-self', 'justify-self'],
  'position-try': ['position-try-fallbacks', 'position-try-order'],
  'scroll-margin': ['scroll-margin-bottom', 'scroll-margin-left', 'scroll-margin-right', 'scroll-margin-top'],
  'scroll-margin-block': ['scroll-margin-block-end', 'scroll-margin-block-start'],
  'scroll-margin-inline': ['scroll-margin-inline-end', 'scroll-margin-inline-start'],
  'scroll-padding': ['scroll-padding-bottom', 'scroll-padding-left', 'scroll-padding-right', 'scroll-padding-top'],
  'scroll-padding-block': ['scroll-padding-block-end', 'scroll-padding-block-start'],
  'scroll-padding-inline': ['scroll-padding-inline-end', 'scroll-padding-inline-start'],
  'scroll-timeline': ['scroll-timeline-axis', 'scroll-timeline-name'],
  'text-decoration': ['text-decoration-color', 'text-decoration-line', 'text-decoration-style', 'text-decoration-thickness'],
  'text-emphasis': ['text-emphasis-color', 'text-emphasis-style'],
  'text-wrap': ['text-wrap-mode', 'text-wrap-style'],
  'timeline-trigger': ['timeline-trigger-activation-range', 'timeline-trigger-activation-range-end', 'timeline-trigger-activation-range-start', 'timeline-trigger-active-range', 'timeline-trigger-active-range-end', 'timeline-trigger-active-range-start', 'timeline-trigger-name', 'timeline-trigger-source'],
  'timeline-trigger-activation-range': ['timeline-trigger-activation-range-end', 'timeline-trigger-activation-range-start'],
  'timeline-trigger-active-range': ['timeline-trigger-active-range-end', 'timeline-trigger-active-range-start'],
  transition: ['transition-behavior', 'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function'],
  'view-timeline': ['view-timeline-axis', 'view-timeline-name'],
  'white-space': ['text-wrap-mode', 'white-space-collapse']
}

function expandNativeCSSProperty(property: string) {
  return [property, ...(NATIVE_CSS_LONGHANDS[property] || [])]
}

/**
 * Whether declaring `later` after `earlier` overrides at least part of it: the same property, a
 * shorthand and one of its longhands, or two shorthands that share a longhand.
 */
export function overridesNativeCSSProperty(later: string, earlier: string) {
  if (later === earlier) return true
  const earlierProperties = expandNativeCSSProperty(earlier)
  return expandNativeCSSProperty(later).some((property) => earlierProperties.includes(property))
}
