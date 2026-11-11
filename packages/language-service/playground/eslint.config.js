import { defineConfig } from 'eslint/config'
import css from '@stet-css/eslint-config'
import htmlParser from '@angular-eslint/template-parser'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  ...css,
  {
    files: [
      '*.html'
    ],
    languageOptions: {
      parser: htmlParser
    }
  },
  {
    files: ['*.ts', '*.tsx', '*.js'],
    languageOptions: {
      parser: tsParser
    }
  }
])
