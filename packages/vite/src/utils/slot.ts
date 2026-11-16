import { createHash } from 'node:crypto'

/**
 * A digest of the generated CSS, written as an identifier so CSS minifiers keep it as is: a
 * leading digit would read as a number or a dimension.
 */
export function digestCSS(css: string) {
  return 'h' + createHash('sha256').update(css).digest('hex').slice(0, 16)
}

/** The placeholder rule's selector, `#master-css-slot`. */
export function getSlotSelector(slotCSSRule: string) {
  return slotCSSRule.slice(0, slotCSSRule.indexOf('{'))
}

/**
 * The build placeholder for the generated CSS. Vite names the CSS asset after its content
 * before `generateBundle` splices the generated CSS in, so the placeholder carries that CSS's
 * digest: the asset's file name then changes exactly when the spliced CSS does.
 */
export function createSlotCSSRule(slotCSSRule: string, css: string) {
  return `${getSlotSelector(slotCSSRule)}{--slot:${digestCSS(css)}}`
}

/** Matches every build placeholder; the first group is the digest it carries. */
export function createSlotCSSRulePattern(slotCSSRule: string) {
  const selector = getSlotSelector(slotCSSRule).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${selector}\\{--slot:([\\w-]+)\\}`, 'g')
}
