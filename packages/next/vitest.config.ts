import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig(({ mode }) => ({
  ...config,
  test: mode === 'e2e'
    ? config.test
    : {
      ...config.test,
      exclude: [
        ...(config.test?.exclude ?? []),
        'tests/*-e2e.test.ts'
      ]
    }
}))
