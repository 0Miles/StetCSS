import { ESLintUtils } from '@typescript-eslint/utils'

/** StetCSS has no docs site, so rule docs live in this package's README on GitHub. */
const RULE_DOCS_URL = 'https://github.com/0Miles/StetCSS/blob/main/packages/eslint-plugin/README.md'

export default ESLintUtils.RuleCreator(
  // GitHub's anchor for the README heading "### `@stet-css/<name>`": the backticks, `@` and `/` are dropped.
  (name) => `${RULE_DOCS_URL}#stet-css${name}`
)
