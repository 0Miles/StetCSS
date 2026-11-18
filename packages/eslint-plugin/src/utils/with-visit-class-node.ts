import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import resolveClassNode, { type ExpressionNeighbours } from './resolve-class-node'
import { TSESTree } from '@typescript-eslint/utils'

export default function withVisitClassNode(
  visit: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void,
  context: RuleContext<any, any[]>,
  ignoredKeys?: RegExp
) {
  const visitNode = (node, neighbours?: ExpressionNeighbours) => {
    if (!node) return
    switch (node.type) {
      case 'BinaryExpression':
      case 'Identifier':
        return
      case 'TemplateLiteral':
        node.expressions?.forEach((expression) => visitNode(expression))
        node.quasis.forEach((quasi) => visitNode(quasi))
        return
      case 'JSXExpressionContainer':
        visitNode(node.expression)
        return
      case 'ConditionalExpression':
        visitNode(node.consequent)
        visitNode(node.alternate)
        return
      case 'ArrayExpression':
        node.elements.forEach((el) => {
          visitNode(el)
        })
        return
      case 'LogicalExpression':
        visitNode(node.right)
        return
      case 'ObjectExpression':
        node.properties.forEach((prop) => {
          visitNode(prop)
        })
        return
      case 'Property': {
        if (node.shorthand) return
        // Keys such as cva's compoundVariants and defaultVariants hold variant names, not classes;
        // the whole value is skipped, `class` entries inside compoundVariants included.
        // `key`, `'key'` and `['key']` name the same property; `[key]` reads a variable.
        const key = node.key?.type === 'Identifier'
          ? node.computed ? undefined : node.key.name
          : node.key?.type === 'Literal' ? node.key.value : undefined
        if (ignoredKeys && typeof key === 'string' && ignoredKeys.test(key)) return
        if (node.value && ['Literal', 'ArrayExpression', 'ObjectExpression'].includes(node.value.type) && typeof node.value?.value !== 'boolean') {
          visitNode(node.value)
        } else if (node.key.type === 'Literal') {
          visitNode(node.key)
        }
        return
      }
      default:
        const resolved = resolveClassNode(node, context, neighbours)
        if (!resolved) return
        visit(node, resolved)
    }
  }
  return visitNode
}
