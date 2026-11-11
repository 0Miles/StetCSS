import type { Linter } from 'eslint'
import recommended from './recommended'

export default {
  plugins: ['@stet-css'],
  rules: recommended.rules,
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  }
} as Linter.LegacyConfig