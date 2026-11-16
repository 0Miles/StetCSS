/** The placeholder rule's selector, `#master-css-slot`. */
export function getSlotSelector(slotCSSRule: string) {
  return slotCSSRule.slice(0, slotCSSRule.indexOf('{'))
}

/**
 * The build placeholder for the generated CSS. Vite names the CSS asset after its content
 * before `generateBundle` splices the generated CSS in, so the placeholder carries the
 * build's digest (`createBuildDigest`): the file name then changes when the spliced CSS does.
 */
export function createSlotCSSRule(slotCSSRule: string, digest: string) {
  return `${getSlotSelector(slotCSSRule)}{--slot:${digest}}`
}

/**
 * Matches every build placeholder, minified or as an unminified build prints it
 * (`#master-css-slot {\n  --slot: h…;\n}`); the first group is the digest it carries.
 */
export function createSlotCSSRulePattern(slotCSSRule: string) {
  const selector = getSlotSelector(slotCSSRule).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${selector}\\s*\\{\\s*--slot\\s*:\\s*([\\w-]+)\\s*;?\\s*\\}`, 'g')
}
