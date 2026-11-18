import {
  formatStetCSSDirectives,
  type StetCSSDirectiveFormatEdit
} from '@stet-css/language'
import type { Range, TextEdit } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { collectSFCStyleBlocks, CSS_STYLE_LANGUAGE_IDS, SFC_LANGUAGE_IDS } from '../utils/sfc-style-blocks'

function toOffsetRange(document: TextDocument, range?: Range) {
  if (!range) return
  return {
    start: document.offsetAt(range.start),
    end: document.offsetAt(range.end)
  }
}

function intersects(a: { start: number, end: number }, b: { start: number, end: number }) {
  return a.start < b.end && b.start < a.end
}

function toTextEdit(document: TextDocument, edit: StetCSSDirectiveFormatEdit): TextEdit {
  return {
    range: {
      start: document.positionAt(edit.start),
      end: document.positionAt(edit.end)
    },
    newText: edit.newText
  }
}

function collectCSSDocumentFormatEdits(document: TextDocument, range?: Range) {
  const source = document.getText()
  const offsetRange = toOffsetRange(document, range)
  return formatStetCSSDirectives(source, { range: offsetRange }).map(toTextEdit.bind(undefined, document))
}

function collectSFCFormatEdits(document: TextDocument, range?: Range) {
  const source = document.getText()
  const offsetRange = toOffsetRange(document, range)
  const edits: StetCSSDirectiveFormatEdit[] = []
  for (const { content: styleText, start: styleStart } of collectSFCStyleBlocks(source)) {
    const styleEnd = styleStart + styleText.length
    const styleRange = { start: styleStart, end: styleEnd }
    if (offsetRange && !intersects(offsetRange, styleRange)) continue
    const relativeRange = offsetRange
      ? {
        start: Math.max(offsetRange.start, styleStart) - styleStart,
        end: Math.min(offsetRange.end, styleEnd) - styleStart
      }
      : undefined
    for (const edit of formatStetCSSDirectives(styleText, { range: relativeRange })) {
      edits.push({
        start: styleStart + edit.start,
        end: styleStart + edit.end,
        newText: edit.newText
      })
    }
  }
  return edits.map(toTextEdit.bind(undefined, document))
}

export default function formatDirectives(document: TextDocument, range?: Range): TextEdit[] | undefined {
  if (CSS_STYLE_LANGUAGE_IDS.has(document.languageId)) {
    return collectCSSDocumentFormatEdits(document, range)
  }
  if (SFC_LANGUAGE_IDS.has(document.languageId)) {
    return collectSFCFormatEdits(document, range)
  }
}
