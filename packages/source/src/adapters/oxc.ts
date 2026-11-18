import { decodeStetCSSJSXAttributeString } from '@stet-css/lexer'
import { visitorKeys, type ParserOptions } from 'oxc-parser'
import { addClassString } from './class-string'
import { parseOxcOnSourceStack, type OxcErrorFilter } from './oxc-stack'
import { extractClassCandidates } from '../extract-class-candidates'
import type { SourceAdapter } from './types'

export const OXC_SOURCE_EXT = /\.(?:(?:[cm]?[jt]s)|(?:[jt]sx))(?:\?|$)/

interface OxcNode {
  type: string
  value?: unknown
  raw?: unknown
  directive?: unknown
  expressions?: unknown[]
  quasis?: {
    value?: {
      cooked?: string | null
      raw?: string | null
    }
  }[]
  [key: string]: unknown
}

// JavaScript files commonly hold JSX, which OXC parses only in `jsx` mode, and
// that mode still accepts plain JavaScript.
const JSX_JAVASCRIPT_EXT = /\.[cm]?js$/

function normalizeSource(source: string) {
  return source.split('?')[0] || source
}

function getParserLang(filename: string) {
  return JSX_JAVASCRIPT_EXT.test(filename) ? 'jsx' as const : undefined
}

function isOxcNode(value: unknown): value is OxcNode {
  return !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string'
}

function isIdentifierNamed(value: unknown, name: string) {
  return isOxcNode(value) && value.type === 'Identifier' && value.name === name
}

function isStaticImportOrReexport(node: OxcNode) {
  return node.type === 'ImportDeclaration' ||
    node.type === 'ExportAllDeclaration' ||
    node.type === 'ExportNamedDeclaration' && isOxcNode(node.source)
}

function isRequireCall(node: OxcNode) {
  return node.type === 'CallExpression' && isIdentifierNamed(node.callee, 'require')
}

function isKnownDirective(node: OxcNode) {
  return node.type === 'ExpressionStatement' && (
    node.directive === 'use strict' ||
    node.directive === 'use client' ||
    node.directive === 'use server'
  )
}

function shouldSkipNode(node: OxcNode) {
  return isKnownDirective(node) ||
    isStaticImportOrReexport(node) ||
    node.type === 'ImportExpression' ||
    isRequireCall(node)
}

/**
 * The value a JSX attribute string compiles to. Oxc keeps its character references as written,
 * so they are decoded from the source spelling between the quotes.
 */
function getJSXAttributeStringValue(node: OxcNode) {
  const value = node.value
  if (!isOxcNode(value) || value.type !== 'Literal' || typeof value.raw !== 'string') return
  return decodeStetCSSJSXAttributeString(value.raw.slice(1, -1)).value
}

function getTemplateLiteralValue(node: OxcNode) {
  if (node.expressions?.length) return
  const quasis = node.quasis || []
  if (quasis.length !== 1) return
  return quasis[0]?.value?.cooked ?? quasis[0]?.value?.raw
}

export interface OxcParse {
  sourceType?: ParserOptions['sourceType']
  allowsError?: OxcErrorFilter
}

export function extractOxcClasses(source: string, content: string): string[] {
  return extractParsedOxcClasses(source, content, {})
}

/**
 * `extractOxcClasses` for adapters that know how their host compiles the
 * script: `sourceType` replaces `unambiguous`, and `allowsError` accepts the
 * parse errors that still leave a program the host compiles.
 */
export function extractParsedOxcClasses(source: string, content: string, parse: OxcParse): string[] {
  const filename = normalizeSource(source)
  const lang = getParserLang(filename)
  const program = parseOxcOnSourceStack(filename, content, {
    range: false,
    sourceType: parse.sourceType ?? 'unambiguous',
    ...lang && { lang }
  }, parse.allowsError)
  if (!program) return extractClassCandidates(content)

  const classes = new Set<string>()
  const classStringCache = new Map<string, string[]>()
  const stack: unknown[] = [program]
  while (stack.length) {
    const node = stack.pop()
    if (!isOxcNode(node)) continue
    if (shouldSkipNode(node)) continue

    if (node.type === 'JSXAttribute') {
      const value = getJSXAttributeStringValue(node)
      if (value !== undefined) {
        addClassString(classes, value, classStringCache)
        continue
      }
    }

    if (node.type === 'Literal' && typeof node.value === 'string') {
      addClassString(classes, node.value, classStringCache)
    } else if (node.type === 'TemplateLiteral') {
      addClassString(classes, getTemplateLiteralValue(node), classStringCache)
    }

    const keys = visitorKeys[node.type] || []
    for (let keyIndex = keys.length - 1; keyIndex >= 0; keyIndex--) {
      const key = keys[keyIndex]
      const value = node[key]
      if (Array.isArray(value)) {
        for (let index = value.length - 1; index >= 0; index--) {
          stack.push(value[index])
        }
      } else {
        stack.push(value)
      }
    }
  }
  return [...classes]
}

export function oxcAdapter(): SourceAdapter {
  return {
    name: 'oxc',
    test: OXC_SOURCE_EXT,
    async extract({ source, content }) {
      return extractOxcClasses(source, content)
    }
  }
}
