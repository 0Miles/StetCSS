import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { SemanticTokens } from 'vscode-languageserver-protocol'
import { encodeSemanticTokens } from './semantic/encode'
import { toSemanticTokenItems, type HighlightTokenItem } from './semantic/highlight'
import { collectCSSHighlightTokenItems, isCSSSemanticTokenDocument } from './semantic/tokenize-css'
import { tokenizeClassToken } from './semantic/tokenize-class'
import type { SemanticTokenItem } from './semantic/types'
import type { StetCSS } from './stet-css'
import type { ClassPosition } from './utils/get-class-positions'

export { encodeSemanticTokens }
export type { HighlightTokenItem, SemanticTokenItem }

export interface RenderSemanticTokenOptions {
  embeddedSyntaxHighlighting?: 'active' | 'always' | 'off'
}

function encodeHighlightTokens(document: TextDocument, highlightTokens: HighlightTokenItem[]): SemanticTokens | undefined {
  if (!highlightTokens.length) return
  return encodeSemanticTokens(document, toSemanticTokenItems(highlightTokens))
}

/**
 * Maps each offset in an unescaped class token to its offset in the raw source spelling, where
 * escape backslashes were removed. A character spelled with a backslash maps to the backslash, so
 * a token over `"` covers `\"`. Returns undefined when the raw text does not spell the token.
 */
function mapTokenOffsetsToRaw(raw: string, token: string) {
  const offsets: number[] = []
  let rawIndex = 0
  for (let tokenIndex = 0; tokenIndex < token.length; tokenIndex++) {
    const start = rawIndex
    while (rawIndex < raw.length && raw[rawIndex] !== token[tokenIndex]) rawIndex++
    if (rawIndex >= raw.length) return
    offsets.push(start)
    rawIndex++
  }
  offsets.push(raw.length)
  return offsets
}

function tokenizeClassPosition(css: StetCSS, classPosition: ClassPosition): HighlightTokenItem[] {
  const { raw, token, range } = classPosition
  const offsets = raw === token ? undefined : mapTokenOffsetsToRaw(raw, token)
  if (!offsets) return tokenizeClassToken(css, token, range.start)
  return tokenizeClassToken(css, token, 0).map((item) => ({
    ...item,
    start: range.start + offsets[item.start],
    end: range.start + offsets[item.end]
  }))
}

export function collectEmbeddedHighlightTokenItems(css: StetCSS, classPositions: ClassPosition[]): HighlightTokenItem[] {
  const semanticTokens: HighlightTokenItem[] = []
  for (const classPosition of classPositions) {
    if (!classPosition.raw) continue
    semanticTokens.push(...tokenizeClassPosition(css, classPosition))
  }
  return semanticTokens
}

export function collectCSSDocumentHighlightTokenItems(css: StetCSS, document: TextDocument, options: Parameters<typeof collectCSSHighlightTokenItems>[3] = {}): HighlightTokenItem[] {
  return collectCSSHighlightTokenItems(document.getText(), css, document.languageId, options)
}

export function collectHighlightTokenItems(css: StetCSS, document: TextDocument, classPositions: ClassPosition[]): HighlightTokenItem[] {
  if (isCSSSemanticTokenDocument(document.languageId)) {
    return collectCSSDocumentHighlightTokenItems(css, document)
  }

  return [
    ...collectEmbeddedHighlightTokenItems(css, classPositions),
    ...collectCSSDocumentHighlightTokenItems(css, document)
  ]
}

export function collectSemanticTokenItems(css: StetCSS, document: TextDocument, classPositions: ClassPosition[]): SemanticTokenItem[] {
  return toSemanticTokenItems(collectHighlightTokenItems(css, document, classPositions))
}

export function collectDocumentHighlightTokenItems(css: StetCSS, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): HighlightTokenItem[] {
  const semanticTokens = collectCSSDocumentHighlightTokenItems(css, document)
  if (options.embeddedSyntaxHighlighting === 'always' && !isCSSSemanticTokenDocument(document.languageId)) {
    semanticTokens.push(...collectEmbeddedHighlightTokenItems(css, classPositions))
  }
  return semanticTokens
}

export function collectDocumentSemanticTokenItems(css: StetCSS, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): SemanticTokenItem[] {
  return toSemanticTokenItems(collectDocumentHighlightTokenItems(css, document, classPositions, options))
}

export function collectActiveHighlightTokenItems(css: StetCSS, document: TextDocument, classPositions: ClassPosition[], position: Parameters<TextDocument['offsetAt']>[0], options: RenderSemanticTokenOptions = {}): HighlightTokenItem[] {
  if (options.embeddedSyntaxHighlighting !== 'off' && !isCSSSemanticTokenDocument(document.languageId) && classPositions.length) {
    return collectEmbeddedHighlightTokenItems(css, classPositions)
  }
  return collectCSSDocumentHighlightTokenItems(css, document, {
    positionOffset: document.offsetAt(position)
  })
}

export function renderSemanticTokensAtPosition(css: StetCSS, document: TextDocument, classPositions: ClassPosition[], position: Parameters<TextDocument['offsetAt']>[0], options: RenderSemanticTokenOptions = {}): SemanticTokens | undefined {
  return encodeHighlightTokens(document, collectActiveHighlightTokenItems(css, document, classPositions, position, options))
}

export default function renderSemanticTokens(css: StetCSS, document: TextDocument, classPositions: ClassPosition[], options: RenderSemanticTokenOptions = {}): SemanticTokens | undefined {
  return encodeHighlightTokens(document, collectDocumentHighlightTokenItems(css, document, classPositions, options))
}
