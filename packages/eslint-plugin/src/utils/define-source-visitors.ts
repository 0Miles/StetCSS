import {
  lintStetCSSContent,
  stetCSSLintRuleIds,
  type StetCSSLintContentRuleOptions,
  type StetCSSLintRuleId,
  type StetCSSLintSourceDiagnostic
} from '@stet-css/lint'
import type { StetCSS } from '@stet-css/core'
import type { RuleContext, RuleFixer, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { messageIdByCode, stringifyLintDiagnosticMessageData } from './report-lint-diagnostics'
import type { Settings } from '../settings'

type FixRange = [number, number]
type SourceRuleOptions = StetCSSLintContentRuleOptions[keyof StetCSSLintContentRuleOptions]

interface DefineSourceVisitorsOptions {
  context: RuleContext<any, any[]>
  settings: Settings
  css: StetCSS
  ruleId: StetCSSLintRuleId
  ruleOptions?: SourceRuleOptions
}

const SOURCE_LINT_FILE_RE = /\.mdx$/i

export function shouldUseSourceVisitors(context: RuleContext<any, any[]>) {
  const filename = context.physicalFilename || context.filename
  return typeof filename === 'string' && SOURCE_LINT_FILE_RE.test(filename)
}

function getFilename(context: RuleContext<any, any[]>) {
  return context.physicalFilename || context.filename || 'source.mdx'
}

function createSingleRuleSet(ruleId: StetCSSLintRuleId) {
  return Object.fromEntries(stetCSSLintRuleIds.map((eachRuleId) => [
    eachRuleId,
    eachRuleId === ruleId
  ])) as Record<StetCSSLintRuleId, boolean>
}

function createRuleOptions(ruleId: StetCSSLintRuleId, ruleOptions: DefineSourceVisitorsOptions['ruleOptions']) {
  return ruleOptions
    ? { [ruleId]: ruleOptions } as StetCSSLintContentRuleOptions
    : undefined
}

function reportSourceDiagnostic(
  context: RuleContext<any, any[]>,
  node: any,
  diagnostic: StetCSSLintSourceDiagnostic
) {
  const { sourceCode } = context
  const messageId = messageIdByCode[diagnostic.code]
  const fix = diagnostic.fixes?.[0]
  const descriptor: any = {
    node,
    loc: {
      start: sourceCode.getLocFromIndex(diagnostic.range.start),
      end: sourceCode.getLocFromIndex(diagnostic.range.end)
    },
    ...(messageId
      ? {
        messageId,
        data: stringifyLintDiagnosticMessageData(diagnostic)
      }
      : { message: diagnostic.message })
  }

  if (fix) {
    descriptor.fix = (fixer: RuleFixer) => fixer.replaceTextRange(
      [fix.range.start, fix.range.end] as FixRange,
      fix.text
    )
  }

  context.report(descriptor)
}

export default function defineSourceVisitors({
  context,
  settings,
  css,
  ruleId,
  ruleOptions
}: DefineSourceVisitorsOptions): RuleListener {
  return {
    Program(node) {
      const result = lintStetCSSContent({
        content: context.sourceCode.getText(),
        filePath: getFilename(context),
        css,
        rules: createSingleRuleSet(ruleId),
        ruleOptions: createRuleOptions(ruleId, ruleOptions),
        ignoredKeys: settings.ignoredKeys
      })
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.ruleId !== ruleId) continue
        reportSourceDiagnostic(context, node, diagnostic)
      }
    }
  }
}
