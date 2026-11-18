export function splitSelectorList(selectorText: string) {
  const selectors: string[] = []
  let current = ''
  let depth = 0
  let quote = ''

  for (let index = 0; index < selectorText.length; index++) {
    const char = selectorText[index]
    if (quote) {
      current += char
      if (char === '\\') {
        current += selectorText[++index] || ''
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '\\') {
      current += char + (selectorText[++index] || '')
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      current += char
      continue
    }
    if (char === '(' || char === '[') {
      depth++
      current += char
      continue
    }
    if (char === ')' || char === ']') {
      depth--
      current += char
      continue
    }
    if (char === ',' && depth === 0) {
      selectors.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  if (current.trim()) selectors.push(current.trim())
  return selectors
}

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
    splitSelectorList(parentSelector),
    splitSelectorList(childSelector)
  ).join(',')
}

/**
 * `template` with each `&` replaced by `selector`, once per item when `selector` is a list:
 * `.dark &` over `.x,.y` is `.dark .x,.dark .y`, not `.dark .x,.y`, which left `.y` without the
 * condition. Unlike `combineStyleSelectors`, a template without `&` stays as written.
 */
export function replaceSelectorNesting(template: string, selector: string) {
  const items = splitSelectorList(selector)
  return items.length > 1
    ? items.map((item) => template.replace(/&/g, item)).join(',')
    : template.replace(/&/g, selector)
}
