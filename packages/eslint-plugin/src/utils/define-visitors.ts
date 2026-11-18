import { TSESTree } from '@typescript-eslint/utils'
import type { RuleContext, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { Settings } from '../settings'
import withVisitClassNode from './with-visit-class-node'
import resolveClassNode from './resolve-class-node'
import { isASCIIWhitespace } from '@stet-css/lexer'

export default function defineVisitors({ context, settings }: { context: RuleContext<any, any[]>, settings: Settings }, visitNode: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void): RuleListener {
  const classAttributeRegex = new RegExp(`^(?:${settings.classAttributes.join('|')})$`)
  const classFunctionsRegex = new RegExp(`^(?:${settings.classFunctions.join('|')})$`)
  const classDeclarationsRegex = new RegExp(`^(?:${settings.classDeclarations.join('|')})$`)
  const ignoredKeysRegex = settings.ignoredKeys?.length ? new RegExp(`^(?:${settings.ignoredKeys.join('|')})$`) : undefined
  const visitClassNode = withVisitClassNode(visitNode, context, ignoredKeysRegex)
  // Astro's `class:list` is a namespaced JSX attribute that lists classes like `class`.
  const isClassAttribute = (name: any) => {
    if (typeof name?.name === 'string') return classAttributeRegex.test(name.name)
    return name?.type === 'JSXNamespacedName' && name.namespace?.name === 'class' && name.name?.name === 'list'
      && classAttributeRegex.test('class')
  }

  const getStaticName = (node: any): string | undefined => {
    if (!node) return
    if (node.type === 'Identifier') return node.name
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  }

  /**
   * The static names a callee ends with: `document.body.classList?.add` gives
   * `['document', 'body', 'classList', 'add']` and `getElement().classList.add` gives
   * `['classList', 'add']`. Keep in step with `getCalleeNames` in @stet-css/language's
   * get-class-positions.ts, which reads oxc trees for `stetcss lint` and editors.
   */
  const getCalleeNames = (node: any): string[] => {
    if (node?.type === 'TSNonNullExpression') return getCalleeNames(node.expression)
    if (node?.type === 'Identifier') return [node.name]
    if (node?.type !== 'MemberExpression') return []
    const property = node.computed
      ? node.property?.type === 'Literal' && typeof node.property.value === 'string' ? node.property.value : undefined
      : node.property?.type === 'Identifier' ? node.property.name : undefined
    return property === undefined ? [] : [...getCalleeNames(node.object), property]
  }

  /**
   * A callee is a class function when a dotted suffix of its names matches, as the markup scan's
   * `(?:\s|\.)` boundary does: `element.classList.add` matches `classList.add` and `utils.clsx`
   * matches `clsx`.
   */
  const allowCalleeNode = (node: any) => {
    const names = getCalleeNames(node.callee || node.tag)
    return names.some((_, index) => classFunctionsRegex.test(names.slice(index).join('.')))
  }

  const getPropertyName = (prop: any) => getStaticName(prop.key)

  const visitUtilityDefinitions = (node) => {
    if (!node) return
    if (node.type === 'ArrayExpression') {
      node.elements.forEach((element) => {
        if (!element || element.type === 'ObjectExpression') return
        visitClassNode(element)
      })
      return
    }
    if (node.type !== 'ObjectExpression') {
      visitClassNode(node)
      return
    }
  }
  const visitClassDeclarationNode = (name, node) => {
    if (name !== 'utilities') {
      visitClassNode(node)
      return
    }
    visitUtilityDefinitions(node)
  }
  const CallExpression = function (node) {
    if (!allowCalleeNode(node)) return
    node.arguments.forEach((node) => {
      visitClassNode(node)
    })
  }
  const scriptVisitor: RuleListener = {
    CallExpression,
    JSXAttribute: function (node: any) {
      if (!node.name || !isClassAttribute(node.name)) return
      if (node.value) {
        visitClassNode(node.value)
      }
    },
    SvelteAttribute: function (node: any) {
      if (!node.key?.name || !classAttributeRegex.test(node.key.name)) return
      node.value.forEach((eachValue: any, index: number) => {
        const previous = node.value[index - 1]
        const next = node.value[index + 1]
        if (eachValue.type === 'SvelteMustacheTag') {
          // The expression's string joins the text around it at runtime: an end that touches
          // static text or another expression is a fragment of a class.
          visitClassNode(eachValue.expression, {
            before: !!previous && !(previous.type === 'SvelteLiteral' && isASCIIWhitespace(previous.value.at(-1))),
            after: !!next && !(next.type === 'SvelteLiteral' && isASCIIWhitespace(next.value[0]))
          })
          return
        }
        visitClassNode(eachValue, {
          before: !!previous && previous.type !== 'SvelteLiteral',
          after: !!next && next.type !== 'SvelteLiteral'
        })
      })
    },
    TextAttribute: function (node: any) {
      if (!node.name || !classAttributeRegex.test(node.name)) return
      visitClassNode(node)
    },
    TaggedTemplateExpression: function (node) {
      if (allowCalleeNode(node)) {
        visitClassNode(node.quasi)
        return
      }
    },
    VariableDeclaration: function (node) {
      node.declarations.forEach((decl) => {
        if (decl.id.type === 'Identifier' && classDeclarationsRegex.test(decl.id.name)) {
          visitClassDeclarationNode(decl.id.name, decl.init)
        }
      })
    },
    ObjectExpression: function (node) {
      node.properties.forEach((prop) => {
        if (prop.type === 'Property') {
          const propName = getPropertyName(prop)
          if (typeof propName === 'string' && classDeclarationsRegex.test(propName)) {
            visitClassDeclarationNode(propName, prop.value)
          }
        }
      })
    }
  }
  const templateBodyVisitor: RuleListener = {
    CallExpression,
    VAttribute: function (node: any) {
      // `:class` and `v-bind:class` bind classes; other directives such as `@class` (v-on) do not.
      if (node.directive && node.key?.name?.name !== 'bind') return
      const name = node.key?.argument?.name || node.key?.name
      if (!name || !classAttributeRegex.test(name)) return
      if (node.value?.type === 'VLiteral') {
        visitClassNode(node.value)
      } else if (node.value?.type === 'VExpressionContainer') {
        visitClassNode(node.value.expression)
      }
    }
  }

  // @ts-expect-error defineTemplateBodyVisitor
  if (context.sourceCode.parserServices == null || context.sourceCode.parserServices.defineTemplateBodyVisitor == null) {
    return scriptVisitor
  } else {
    // @ts-expect-error defineTemplateBodyVisitor
    return context.sourceCode.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
  }
}
