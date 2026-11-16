import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const configs = {
  jsx: {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        }
      }
    }
  }
} satisfies Record<string, RuleTesterConfig>

export const jsxTester = new RuleTester(configs.jsx)

export const createTester = (config: RuleTesterConfig, lang: keyof typeof configs = 'jsx') => {
  return new RuleTester({
    ...configs[lang],
    ...config
  })
}

const customManifestFilename = fileURLToPath(new URL('./fixtures/custom-manifest/index.tsx', import.meta.url))

/**
 * Lints each case's inline code as a file of the `fixtures/custom-manifest` project, so rules read
 * that project's CSS entry the way they do in a front-end developer's workspace.
 */
export const createCustomManifestTester = (config: RuleTesterConfig = {}) => {
  return createTester({
    ...config,
    defaultFilenames: { ts: customManifestFilename, tsx: customManifestFilename }
  })
}

const undeclaredModeFilename = fileURLToPath(new URL('./fixtures/undeclared-mode/index.tsx', import.meta.url))

/** Lints inline code as a file of `fixtures/undeclared-mode`, whose entry declares only `@theme sepia {}`. */
export const createUndeclaredModeTester = (config: RuleTesterConfig = {}) => {
  return createTester({
    ...config,
    defaultFilenames: { ts: undeclaredModeFilename, tsx: undeclaredModeFilename }
  })
}

export const source = (name: string, base: string) => {
  const filename = fileURLToPath(new URL(name, base))
  return {
    name: filename,
    filename,
    code: readFileSync(filename, 'utf-8'),
  }
}
