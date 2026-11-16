import type { MasterCSSManifestConditionIdentifier } from '@stet-css/schema/manifest'
import type { ConditionNode } from './parse-condition'

const AND: ConditionNode = { type: 'logical', value: 'and' }

/** Nodes as they render: a defined condition's ungrouped children sit inline. */
function inline(nodes: ConditionNode[]): ConditionNode[] {
  return nodes.flatMap((node) => 'children' in node && node.type !== 'group' ? inline(node.children) : [node])
}

function isBare(node: ConditionNode | undefined) {
  return node?.type === 'string' && !node.name
}

function isLogical(node: ConditionNode | undefined, value: string) {
  return node?.type === 'logical' && node.value === value
}

/**
 * Splits off what has to lead the query: a media type (`print`, `not print`, `only screen`) or a
 * container name, followed by the conditions after it.
 */
function splitLead(id: MasterCSSManifestConditionIdentifier, nodes: ConditionNode[]) {
  const flat = inline(nodes)
  const prefixed = id === 'media' && (isLogical(flat[0], 'not') || isLogical(flat[0], 'only')) && isBare(flat[1])
  const leadEnd = prefixed ? 2 : isBare(flat[0]) ? 1 : 0
  if (!leadEnd) return { lead: [], rest: nodes }
  return {
    lead: flat.slice(0, leadEnd),
    rest: flat.slice(isLogical(flat[leadEnd], 'and') ? leadEnd + 1 : leadEnd)
  }
}

/** An operand of `and`: an `or` list or a negation is grouped so it keeps its meaning. */
function asOperand(nodes: ConditionNode[]): ConditionNode[] {
  return inline(nodes).some((node) => isLogical(node, 'or')) || isLogical(nodes[0], 'not')
    ? [{ type: 'group', children: nodes }]
    : nodes
}

function leadText(nodes: ConditionNode[]) {
  return nodes.map((node) => 'value' in node ? node.value : '').join(' ')
}

/**
 * Joins the nodes of two stacked conditions of one at-rule (`@sm@dark`, `@sm@md`, a variant
 * stacked on another) into one query: `@media`, `@container` and `@supports` need `and` between
 * them. `undefined` when no single query means both: two media types, a negated media type (`not`
 * negates the whole query), or two container names that may name different containers.
 */
export default function joinConditionNodes(
  id: MasterCSSManifestConditionIdentifier,
  current: ConditionNode[] | undefined,
  next: ConditionNode[]
): ConditionNode[] | undefined {
  if (!current?.length) return [...next]
  if (!next.length) return [...current]
  if (id !== 'media' && id !== 'container' && id !== 'supports') return [...current, ...next]

  const a = splitLead(id, current)
  const b = splitLead(id, next)
  const lead = a.lead.length ? a.lead : b.lead
  if (a.lead.length || b.lead.length) {
    if (id === 'media' && (a.lead.length && b.lead.length || isLogical(lead[0], 'not'))) return
    if (id === 'container' && leadText(a.lead) !== leadText(b.lead)) return
  }

  const operands = [a.rest, b.rest].filter((nodes) => nodes.length).map(asOperand)
  const joined: ConditionNode[] = []
  for (const operand of operands) {
    if (joined.length) joined.push(AND)
    joined.push(...operand)
  }
  // A media type leads with `and` (`print and (…)`); a container name leads bare (`sidebar (…)`).
  return id === 'media' && lead.length && joined.length ? [...lead, AND, ...joined] : [...lead, ...joined]
}
