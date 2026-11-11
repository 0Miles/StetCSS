import type { Linter } from 'eslint'
import base from './base'

export default {
  ...base,
  rules: {
    '@stet-css/sort-classes': 'warn',
    '@stet-css/no-invalid-classes': 'error',
    '@stet-css/no-conflicting-classes': 'warn',
    '@stet-css/prefer-canonical-classes': 'warn'
  },
} as Linter.Config
