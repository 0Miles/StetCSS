import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import {
  decodeStetCSSScriptString,
  parseStetCSSClassList,
  type StetCSSScriptStringQuote
} from '@stet-css/lexer'
import type { StetCSSClassListEditOptions } from '@stet-css/lint'

export interface ResolvedClassListNode {
  type: 'class' | 'space'
  value: string
  raw: string
  range: [number, number]
  loc: any
}

export interface ResolvedClassNode {
  nodes: ResolvedClassListNode[]
  /** Source offsets of `raw`. */
  start: number
  end: number
  /**
   * The class list handed to `@stet-css/lint`: the source text between the quotes when it maps
   * back onto the source, otherwise the decoded value.
   */
  raw: string
  /** The decoded class list, as the parser cooked it. */
  value: string
  /** Class-list parse options that decode `raw` into `value`. */
  options: StetCSSClassListEditOptions
  /**
   * Whether ranges inside `raw` are source ranges. When false, diagnostics cover the whole class
   * list and carry no fix.
   */
  fixable: boolean
  classNodes: ResolvedClassListNode[]
  classValues: string[]
}

/** Which ends of a static text part touch a runtime expression, as `{color}` does in `bg:{color}-50`. */
export interface ExpressionNeighbours {
  before?: boolean
  after?: boolean
}

const QUOTED_RE = /^(['"`])([\s\S]*)\1$/
const WHITESPACE_RE = /\s/

/**
 * The `[start, end)` part of `text` that holds only whole classes. Text touching an expression
 * with no whitespace between them is a fragment of a class that only exists at runtime: sorting,
 * deduplicating or validating it would split or delete that class. Undefined when no whole class
 * remains.
 */
export function getWholeClassRange(text: string, neighbours: ExpressionNeighbours = {}): [number, number] | undefined {
  let start = 0
  let end = text.length
  if (neighbours.before) {
    while (start < end && !WHITESPACE_RE.test(text[start])) start++
  }
  if (neighbours.after) {
    while (end > start && !WHITESPACE_RE.test(text[end - 1])) end--
  }
  return /\S/.test(text.slice(start, end)) ? [start, end] : undefined
}

/**
 * Resolves a class-bearing node into a class list with source ranges. Pass `neighbours` for a
 * static part of a value that also holds expressions; fragments touching them are left out.
 */
export default function resolveClassNode(
  node: any,
  context: RuleContext<any, any[]>,
  neighbours?: ExpressionNeighbours
): ResolvedClassNode | undefined {
  const { sourceCode } = context
  let value: string = null
  let start: number = null
  let end: number = null
  let script = false
  switch (node.type) {
    case 'Literal':
      value = node.value
      start = node.range[0]
      end = node.range[1]
      // JSX attribute strings hold no escape sequences.
      script = node.parent?.type !== 'JSXAttribute'
      break
    case 'VLiteral':
    case 'SvelteLiteral':
      value = node.value
      start = node.range[0]
      end = node.range[1]
      break
    case 'TextAttribute':
      value = node.value
      start = node.valueSpan.fullStart.offset
      end = node.valueSpan.end.offset
      break
    case 'TemplateElement':
      if (node.parent.expressions.length) {
        return
      }
      value = node.value.cooked
      start = node.range[0]
      end = node.range[1]
      script = true
      break
    default:
      return
  }

  if (typeof value !== 'string') {
    return
  }

  // Read the source itself: parsers report raw text with CRLF normalized (template literals) or
  // with HTML entities already decoded (expressions in Vue templates).
  let raw = sourceCode.text.slice(start, end)
  let quote: string | undefined
  const quoted = QUOTED_RE.exec(raw)
  if (quoted) {
    quote = quoted[1]
    raw = quoted[2]
    start = start + 1
    end = end - 1
  }

  if (neighbours?.before || neighbours?.after) {
    // Trim the source and the parsed value alike; where they differ the list is not fixable anyway.
    const rawRange = getWholeClassRange(raw, neighbours)
    const valueRange = getWholeClassRange(value, neighbours)
    if (!rawRange || !valueRange) return
    start += rawRange[0]
    end = start + rawRange[1] - rawRange[0]
    raw = raw.slice(...rawRange)
    value = value.slice(...valueRange)
  }

  const options: StetCSSClassListEditOptions = script && quote
    ? { scriptString: quote as StetCSSScriptStringQuote }
    : {}
  const decoded = options.scriptString ? decodeStetCSSScriptString(raw, options.scriptString)?.value : raw
  const fixable = decoded === value

  const nodes: ResolvedClassListNode[] = parseStetCSSClassList(fixable ? raw : value, {
    preserveSpaces: true,
    ...(fixable ? options : {})
  }).map((item) => {
    const startOffset = fixable ? start + item.start : start
    const endOffset = fixable ? start + item.end : end
    return {
      type: item.type,
      value: item.token,
      raw: item.raw,
      range: [startOffset, endOffset],
      loc: {
        start: sourceCode.getLocFromIndex(startOffset),
        end: sourceCode.getLocFromIndex(endOffset),
      },
    }
  })

  const classNodes = nodes.filter((node) => node.type === 'class')

  return {
    nodes,
    start,
    end,
    raw: fixable ? raw : value,
    value,
    options: fixable ? options : {},
    fixable,
    classNodes,
    classValues: classNodes.map((node) => node.value),
  }
}
