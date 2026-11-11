import plugin from '../plugin'
import type { Linter } from 'eslint'

export default {
  plugins: {
    '@stet-css': plugin as any
  }
} as Linter.Config