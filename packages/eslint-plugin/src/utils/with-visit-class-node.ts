import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import resolveClassNode from './resolve-class-node'
import { getStetCSSTemplateExpressionNeighbours, type StetCSSExpressionNeighbours } from '@stet-css/lexer'
import { TSESTree } from '@typescript-eslint/utils'

export default function withVisitClassNode(
  visit: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void,
  context: RuleContext<any, any[]>,
  ignoredKeys?: RegExp
) {
  /**
   * `neighbours` says which ends of the expression's string value touch text around it, as in
   * Svelte's `x{on ? 'a b' : ''}` or `` `x${on ? 'a b' : ''}` ``. Only branches that yield the
   * string itself carry them; arrays and objects in such a place are skipped.
   */
  const visitNode = (node, neighbours?: StetCSSExpressionNeighbours) => {
    if (!node) return
    const touches = !!(neighbours?.before || neighbours?.after)
    switch (node.type) {
      case 'BinaryExpression':
      case 'Identifier':
        return
      case 'TemplateLiteral': {
        const { quasis, expressions = [] } = node
        if (!expressions.length) {
          visitNode(quasis[0], neighbours)
          return
        }
        const expressionNeighbours = getStetCSSTemplateExpressionNeighbours(quasis.map((quasi) => quasi.value.cooked), neighbours)
        expressions.forEach((expression, index) => visitNode(expression, expressionNeighbours[index]))
        quasis.forEach((quasi) => visitNode(quasi))
        return
      }
      case 'JSXExpressionContainer':
        visitNode(node.expression)
        return
      case 'ConditionalExpression':
        visitNode(node.consequent, neighbours)
        visitNode(node.alternate, neighbours)
        return
      case 'ArrayExpression':
        if (touches) return
        node.elements.forEach((el) => {
          visitNode(el)
        })
        return
      case 'LogicalExpression':
        visitNode(node.right, neighbours)
        return
      case 'ObjectExpression':
        if (touches) return
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
