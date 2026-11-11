import { defineConfig } from 'eslint/config'
import css from '@stet-css/eslint-config'
import htmlParser from '@angular-eslint/template-parser'
import tsParser from '@typescript-eslint/parser'
import { flat } from 'eslint-plugin-mdx'

export default defineConfig([
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser
    }
  },
  flat,
  ...css,
  {
    rules: {
      '@stet-css/no-invalid-classes': ['error', {
        disallowUnknownClass: true
      }]
    },
    settings: {
      'mdx/code-blocks': true
    }
  }
])
