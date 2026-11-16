import type { MasterCSSManifestConditionIdentifier } from '@stet-css/schema/manifest'
import type { ConditionNode } from './parse-condition'

const AND: ConditionNode = { type: 'logical', value: 'and' }

/** Nodes as they render: a defined condition's ungrouped children sit inline. */
function flattenUngrouped(nodes: ConditionNode[]): ConditionNode[] {
  return nodes.flatMap((node) => 'children' in node && node.type !== 'group' ? flattenUngrouped(node.children) : [node])
}

/** An unnamed string node: a media type (`print`) or a container name (`sidebar`). */
function isMediaTypeOrName(node: ConditionNode | undefined) {
  return node?.type === 'string' && !node.name
}

function isLogical(node: ConditionNode | undefined, value: string) {
  return node?.type === 'logical' && node.value === value
}

/**
 * Splits off what has to lead the query: a media type (`print`, `not print`, `only screen`) or a
 * container name, followed by the conditions after it. `undefined` when a type or name sits
 * anywhere but the lead (`(…) or print`) or the lead is not followed the way one query allows
 * (`print or screen`, `sidebar or (…)`), so nothing can join it.
 */
function splitLead(id: MasterCSSManifestConditionIdentifier, nodes: ConditionNode[]) {
  if (id === 'supports') return { lead: [], rest: nodes }
  const flat = flattenUngrouped(nodes)
  const prefixed = id === 'media' && (isLogical(flat[0], 'not') || isLogical(flat[0], 'only')) && isMediaTypeOrName(flat[1])
  const leadEnd = prefixed ? 2 : isMediaTypeOrName(flat[0]) ? 1 : 0
  if (flat.slice(leadEnd).some(isMediaTypeOrName)) return
  if (!leadEnd) return { lead: [], rest: nodes }
  const after = flat[leadEnd]
  if (after && (id === 'media' ? !isLogical(after, 'and') : isLogical(after, 'and') || isLogical(after, 'or'))) return
  return {
    lead: flat.slice(0, leadEnd),
    rest: flat.slice(id === 'media' && after ? leadEnd + 1 : leadEnd)
  }
}

/**
 * One condition's nodes with its media type moved to the lead, as one query needs it:
 * `sm&print` is `print and (…)`. `undefined` when no move makes it valid: a type or name in an
 * `or` list, negated, or more than one of them; a container name after a condition.
 */
function leadFirst(id: MasterCSSManifestConditionIdentifier, nodes: ConditionNode[]) {
  if (id !== 'media' && id !== 'container') return nodes
  const flat = flattenUngrouped(nodes)
  const positions = flat.flatMap((node, index) => isMediaTypeOrName(node) ? [index] : [])
  const position = positions[0]
  const leadEnd = id === 'media' && (isLogical(flat[0], 'not') || isLogical(flat[0], 'only')) ? 1 : 0
  if (positions.length > 1) return
  if (position === undefined || position === leadEnd) return nodes
  if (id !== 'media' || !isLogical(flat[position - 1], 'and')
    || flat.some((node) => node.type === 'logical' && node.value !== 'and')) return
  const rest = [...flat.slice(0, position - 1), ...flat.slice(position + 1)]
  return [flat[position], AND, ...rest]
}

/** An operand of `and`: an `or` list or a negation is grouped so it keeps its meaning. */
function asOperand(nodes: ConditionNode[]): ConditionNode[] {
  return flattenUngrouped(nodes).some((node) => isLogical(node, 'or')) || isLogical(nodes[0], 'not')
    ? [{ type: 'group', children: nodes }]
    : nodes
}

function leadText(nodes: ConditionNode[]) {
  return nodes.map((node) => 'value' in node ? node.value : '').join(' ')
}

/**
 * Joins the nodes of two stacked conditions of one at-rule (`@sm@dark`, `@sm@md`, a variant
 * stacked on another) into one query; with no `current`, it puts `next`'s media type first.
 * `@media`, `@container` and `@supports` need `and` between them. `undefined` when no single query means both: two media types, a negated media type (`not`
 * negates the whole query), a media type or container name in an `or` list or after a
 * condition it cannot move ahead of, or two container names that may name different containers.
 */
export default function joinConditionNodes(
  id: MasterCSSManifestConditionIdentifier,
  current: ConditionNode[] | undefined,
  next: ConditionNode[]
): ConditionNode[] | undefined {
  if (id !== 'media' && id !== 'container' && id !== 'supports') return [...(current || []), ...next]
  const leading = leadFirst(id, next)
  if (!leading) return
  if (!current?.length) return [...leading]
  if (!leading.length) return [...current]

  const currentSplit = splitLead(id, current)
  const nextSplit = splitLead(id, leading)
  if (!currentSplit || !nextSplit) return
  const lead = currentSplit.lead.length ? currentSplit.lead : nextSplit.lead
  if (currentSplit.lead.length || nextSplit.lead.length) {
    if (id === 'media' && (currentSplit.lead.length && nextSplit.lead.length || isLogical(lead[0], 'not'))) return
    if (id === 'container' && leadText(currentSplit.lead) !== leadText(nextSplit.lead)) return
  }

  const operands = [currentSplit.rest, nextSplit.rest].filter((nodes) => nodes.length).map(asOperand)
  const joined: ConditionNode[] = []
  for (const operand of operands) {
    if (joined.length) joined.push(AND)
    joined.push(...operand)
  }
  // A media type leads with `and` (`print and (…)`); a container name leads bare (`sidebar (…)`).
  return id === 'media' && lead.length && joined.length ? [...lead, AND, ...joined] : [...lead, ...joined]
}
