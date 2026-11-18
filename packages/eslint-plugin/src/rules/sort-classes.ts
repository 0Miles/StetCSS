import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { createSortClassesReport } from '@stet-css/lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'

export default createRule({
  name: 'sort-classes',
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: {
      description: 'Sort StetCSS classes'
    },
    messages: {
      invalidClassOrder: '{{message}}',
    },
    schema: []
  },
  defaultOptions: [],
  create: function (context) {
    const { settings, css } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, settings, css, ruleId: 'sort-classes' })
    }
    return defineVisitors({ context, settings }, (node, resolved) => {
      if (resolved.nodes.length <= 1) return
      reportLintDiagnostics(
        context,
        node,
        resolved,
        createSortClassesReport(resolved.raw, css, resolved.options).diagnostics
      )
    })
  },
})
