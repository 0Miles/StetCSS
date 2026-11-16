import { type CompletionItem } from 'vscode-languageserver-protocol'
import { StetCSS, createDefaultCSS, generateCSS } from '@stet-css/language'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, type CompletionIndex } from './completion-index'

export default function getClassCompletionItems(css: StetCSS = createDefaultCSS(), completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
  return completionIndex.classEntries.map((entry) => {
    const { documentationClassName, ...completionItem } = entry
    return {
      ...completionItem,
      ...(documentationClassName
        ? { documentation: createCSSMarkdownDocumentation(generateCSS([documentationClassName], css, completionIndex.runtime)) }
        : {})
    }
  })
}
