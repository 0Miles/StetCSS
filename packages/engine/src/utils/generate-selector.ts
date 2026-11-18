import { SELECTOR_COMBINATORS } from '../common'
import { SelectorNode } from './parse-selector'

const prefixMap: Record<string, string> = {
  'class': '.',
  'pseudo-class': ':',
  'pseudo-element': '::',
  'attribute': '',
  'combinator': '',
  'id': '#',
}

export default function generateSelector(nodes: SelectorNode[], body = ''): string {
  const generate = (node: SelectorNode): string => {
    if (node.type === 'attribute') return `[${node.value}]`
    if (node.type === 'combinator') return node.value

    const prefix = node.type && prefixMap[node.type] || ''
    const base = node.value ? prefix + node.value : ''

    if ('children' in node && node.children?.length) {
      const childrenText = node.children.map(generate).join('')
      return node.value ? base + `(${childrenText})` : base + childrenText
    }
    return base
  }

  const flatten = (selectorNodes: SelectorNode[]) => selectorNodes.flatMap(node => (!('value' in node) && 'children' in node && node.children?.length) ? node.children : node)
  /** Splits nodes at their top-level `,` into the generated text of each list item. */
  const splitList = (selectorNodes: SelectorNode[]) => {
    const items: string[] = []
    let current = ''
    for (const node of selectorNodes) {
      if (node.value === ',') {
        items.push(current)
        current = ''
      } else {
        current += generate(node)
      }
    }
    if (current) items.push(current)
    return items
  }

  /**
   * Each `:of()` list item is an ancestor condition of its own, so the selector expands per item
   * as plain CSS writes it: `:of(.a,.b)` is `.a &,.b &`, not `.a,.b &`. Consecutive `:of()`s
   * join their items into one compound (`:of(.a,.b):of(.c)` is `.a.c &,.b.c &`).
   */
  let ancestors = ['']
  const flatNodes = flatten(nodes)
  const ownNodes: SelectorNode[] = []
  for (const node of flatNodes) {
    if (node.value === 'of' && 'children' in node) {
      const items = splitList(flatten(node.children!))
      if (items.length) ancestors = ancestors.flatMap(ancestor => items.map(item => ancestor + item))
    } else {
      ownNodes.push(node)
    }
  }
  const groups = splitList(ownNodes)

  const result = ancestors
    .flatMap(ancestor => {
      const lastChar = ancestor.charAt(ancestor.length - 1)
      const pre = ancestor && !SELECTOR_COMBINATORS.includes(lastChar) && lastChar !== ' ' ? ancestor + ' ' : ancestor
      return groups.length ? groups.map(text => pre + body + text) : pre + body
    })
    .join(',')

  if (process.env.NODE_ENV === 'development') {
    /** Warning: Nodes before `:of()` cannot contain combinators or other ::pseudo-element nodes */
    const ofIndex = flatNodes.findIndex(node => node.type === 'pseudo-class' && node.value === 'of')
    if (ofIndex > 0) {
      const hasCombinator = flatNodes.slice(0, ofIndex).some(node => node.type === 'combinator')
      const hasPseudoElement = flatNodes.slice(0, ofIndex).some(node => node.type === 'pseudo-element')
      if (hasCombinator || hasPseudoElement) {
        console.warn(`Cannot use combinators or pseudo-elements before ':of()' selector: '${result}'`)
      }
    }
  }

  return result
}
