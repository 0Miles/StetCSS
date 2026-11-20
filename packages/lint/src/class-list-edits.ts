import {
  decodeStetCSSClassListSource,
  parseStetCSSClassList,
  type StetCSSClassListItem,
  type StetCSSClassListParseOptions
} from '@stet-css/lexer'
import type { StetCSS } from '@stet-css/engine'
import sortClassNames from './sort-class-names'

export type StetCSSClassListEditOptions = Pick<StetCSSClassListParseOptions, 'unescape' | 'scriptString' | 'characterReferences'>

function parseClassList(classList: string, options: StetCSSClassListEditOptions = {}) {
  return parseStetCSSClassList(classList, {
    preserveSpaces: true,
    ...options
  })
}

function cloneClassListItems(items: StetCSSClassListItem[]) {
  return items.map((item) => ({ ...item }))
}

/**
 * The class list `items` spell, or undefined when no spelling reads as its items do. In a decoded
 * list, joining spellings that were not next to each other can change how they read: a space
 * spelled `&#x20`, without its `;`, reads on into a class that now starts with a hex digit
 * (`&#x20bg:black` is one reference). Such a space gets a `;` when that keeps its meaning, or is
 * written as the whitespace it decodes to. An item that does not decode on its own (a replacement
 * holding the string's quote) has no safe spelling. Each edit leaves a list it cannot spell as it
 * is, so it gets no fix.
 */
function buildClassList(items: StetCSSClassListItem[], options: StetCSSClassListEditOptions) {
  const spellings = items.map((item) => item.raw)
  if (!options.scriptString && !options.characterReferences) return spellings.join('')
  const decode = (spelling: string) => decodeStetCSSClassListSource(spelling, options)?.value
  const values = spellings.map(decode)
  if (values.some((value) => value === undefined)) return
  const value = values.join('')
  if (decode(spellings.join('')) === value) return spellings.join('')

  const respelled = spellings.map((spelling, index) => {
    if (items[index].type !== 'space' || index === items.length - 1) return spelling
    const keeps = (candidate: string) => decode(candidate) === values[index] &&
      decode(candidate + spellings[index + 1]) === values[index]! + values[index + 1]
    return [spelling, spelling + ';', values[index]!].find(keeps) ?? spelling
  })
  return decode(respelled.join('')) === value ? respelled.join('') : undefined
}

function removeClassListItemAt(items: StetCSSClassListItem[], index: number) {
  const previous = items[index - 1]
  const next = items[index + 1]
  if (previous?.type === 'space') {
    items.splice(index - 1, 2)
    return index - 1
  }
  if (next?.type === 'space') {
    items.splice(index, 2)
    return index
  }
  items.splice(index, 1)
  return index
}

function removeClassListToken(items: StetCSSClassListItem[], token: string) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (item.type !== 'class' || item.token !== token) continue
    removeClassListItemAt(items, index)
    return true
  }
  return false
}

function replaceClassListToken(items: StetCSSClassListItem[], token: string, replacement: string) {
  for (const item of items) {
    if (item.type !== 'class' || item.token !== token) continue
    item.raw = replacement
    item.token = replacement
    item.end = item.start + replacement.length
    return true
  }
  return false
}

function getRawQueuesByToken(items: StetCSSClassListItem[]) {
  const rawQueues = new Map<string, string[]>()
  for (const item of items) {
    if (item.type !== 'class') continue
    const queue = rawQueues.get(item.token)
    if (queue) {
      queue.push(item.raw)
    } else {
      rawQueues.set(item.token, [item.raw])
    }
  }
  return rawQueues
}

export function sortClassList(classList: string, css: StetCSS, options: StetCSSClassListEditOptions = {}) {
  const items = parseClassList(classList, options)
  const classItems = items.filter((item) => item.type === 'class' && item.token)
  if (classItems.length <= 1) return classList

  const sortedTokens = sortClassNames(classItems.map((item) => item.token), css)
  const rawQueues = getRawQueuesByToken(classItems)
  const fixedItems = cloneClassListItems(items)
  let sortedIndex = 0

  for (let index = 0; index < fixedItems.length; index++) {
    const item = fixedItems[index]
    if (item.type !== 'class') continue

    const token = sortedTokens[sortedIndex++]
    if (!token) {
      index = removeClassListItemAt(fixedItems, index) - 1
      continue
    }

    const raw = rawQueues.get(token)?.shift() || token
    item.raw = raw
    item.token = token
  }

  return buildClassList(fixedItems, options) ?? classList
}

export function removeClassNamesFromClassList(
  classList: string,
  classNames: string[],
  options: StetCSSClassListEditOptions = {}
) {
  const items = parseClassList(classList, options)
  for (const className of classNames) {
    removeClassListToken(items, className)
  }
  return buildClassList(items, options) ?? classList
}

export function replaceClassNameInClassList(
  classList: string,
  className: string,
  replacement: string,
  options: StetCSSClassListEditOptions = {}
) {
  const items = parseClassList(classList, options)
  replaceClassListToken(items, className, replacement)
  return buildClassList(items, options) ?? classList
}

export function replaceClassGroupInClassList(
  classList: string,
  classNames: string[],
  replacement: string,
  options: StetCSSClassListEditOptions = {}
) {
  const [firstClassName, ...classNamesToRemove] = classNames
  const items = parseClassList(classList, options)
  if (!firstClassName || !replaceClassListToken(items, firstClassName, replacement)) return classList
  for (const className of classNamesToRemove) {
    removeClassListToken(items, className)
  }
  return buildClassList(items, options) ?? classList
}
