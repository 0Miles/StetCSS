import { splitCSSSelectorList } from '@stet-css/lexer'

export function combineSelectorLists(parentSelectors: string[], childSelectors: string[]) {
  const selectors: string[] = []

  for (const child of childSelectors) {
    for (const parent of parentSelectors) {
      selectors.push(combineSelector(parent, child))
    }
  }

  return selectors
}

function combineSelector(parent: string, child: string) {
  const trimmedChild = child.trim()
  if (trimmedChild.includes('&')) return trimmedChild.replace(/&/g, parent)
  return `${parent} ${child}`
}

export function combineStyleSelectors(parentSelector: string, childSelector: string) {
  return combineSelectorLists(
    splitCSSSelectorList(parentSelector),
    splitCSSSelectorList(childSelector)
  ).join(',')
}

/**
 * `template` with each `&` replaced by `selector`, once per item when `selector` is a list:
 * `.dark &` over `.x,.y` is `.dark .x,.dark .y`, not `.dark .x,.y`, which left `.y` without the
 * condition. Unlike `combineStyleSelectors`, a template without `&` stays as written.
 */
export function replaceSelectorNesting(template: string, selector: string) {
  const items = splitCSSSelectorList(selector)
  return items.length > 1
    ? items.map((item) => template.replace(/&/g, item)).join(',')
    : template.replace(/&/g, selector)
}
