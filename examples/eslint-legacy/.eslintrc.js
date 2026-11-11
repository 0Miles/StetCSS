/** @type {import('eslint').Linter.LegacyConfig} */
module.exports = {
  extends: [
    'plugin:@stet-css/legacy',
  ],
  overrides: [
    {
      files: ['*.html'],
      parser: '@angular-eslint/template-parser'
    }
  ],
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  }
}