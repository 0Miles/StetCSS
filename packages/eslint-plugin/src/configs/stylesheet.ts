import plugin from '../plugin'
import stylesheetParser from '../stylesheet-parser'
import type { Linter } from 'eslint'

export default {
  files: ['**/*.{css,scss,less}'],
  plugins: {
    '@stet-css': plugin as any
  },
  languageOptions: {
    parser: stylesheetParser
  },
  rules: {
    '@stet-css/prefer-canonical-classes': 'warn'
  }
} as Linter.Config
