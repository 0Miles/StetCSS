import { ESLint, type Linter } from 'eslint'
import { expect, test } from 'vitest'
import plugin from '../src'
import { masterCSSSettingsSchema } from '../src/settings-schema'

const baseConfig: Linter.Config = {
  files: ['**/*.jsx'],
  plugins: {
    '@stet-css': plugin
  },
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true
      }
    }
  }
}

function createESLint(rules: Linter.RulesRecord) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      ...baseConfig,
      rules
    }]
  })
}

test('keeps Master CSS settings schema separate from rule option schemas', () => {
  expect(masterCSSSettingsSchema).toMatchObject({
    type: 'object',
    additionalProperties: false,
    properties: {
      classAttributes: expect.any(Object),
      classFunctions: expect.any(Object),
      classDeclarations: expect.any(Object),
      ignoredKeys: expect.any(Object)
    }
  })
})

test('accepts no-invalid-classes rule options explicitly', async () => {
  const [result] = await createESLint({
    '@stet-css/no-invalid-classes': ['error', { disallowUnknownClass: true }]
  }).lintText(`<div className="unknown-class" />`, { filePath: 'index.jsx' })

  expect(result.messages).toHaveLength(1)
  expect(result.messages[0].ruleId).toBe('@stet-css/no-invalid-classes')
})

test('rejects unknown no-invalid-classes rule options', async () => {
  await expect(createESLint({
    '@stet-css/no-invalid-classes': ['error', { classAttributes: ['className'] }]
  }).lintText(`<div className="block" />`, { filePath: 'index.jsx' }))
    .rejects.toThrow()
})

test('rejects rule options for rules configured through settings only', async () => {
  await expect(createESLint({
    '@stet-css/sort-classes': ['error', { classAttributes: ['className'] }]
  }).lintText(`<div className="block" />`, { filePath: 'index.jsx' }))
    .rejects.toThrow()

  await expect(createESLint({
    '@stet-css/no-conflicting-classes': ['error', { classFunctions: ['ctl'] }]
  }).lintText(`<div className="block" />`, { filePath: 'index.jsx' }))
    .rejects.toThrow()
})

test('provides an opt-in stylesheet config', async () => {
  const [diagnosticResult] = await new ESLint({
    overrideConfigFile: true,
    overrideConfig: [plugin.configs.stylesheet]
  }).lintText(`.btn { @compose contain:content; }`, { filePath: 'index.css' })
  const [fixResult] = await new ESLint({
    fix: true,
    overrideConfigFile: true,
    overrideConfig: [plugin.configs.stylesheet]
  }).lintText(`.btn { @compose contain:content; }`, { filePath: 'index.css' })

  expect(diagnosticResult.messages).toHaveLength(1)
  expect(diagnosticResult.messages[0].ruleId).toBe('@stet-css/prefer-canonical-classes')
  expect(fixResult.output).toBe('.btn { contain: content; }')
})

/**
 * Prevents: the recommended config enabling rules or registering the plugin under a namespace
 * other than `@stet-css`, so user configs that write `@stet-css/<rule>` (as the README does)
 * fail with "rule not found" or silently run nothing, and rule help naming another product.
 * Gate 4 trade-off: descriptions are only checked for the absence of the old product name, so
 * copy edits stay green.
 * Reverse check: the `sort-classes` description in `src/rules/sort-classes.ts` written as
 * `'Sort Master CSS classes'` turns only this test red; renaming a recommended rule id to
 * `@master-css/` also reds the two recommended-autofix tests, which load the same config.
 */
test('names StetCSS in the public rule ids, configs and rule descriptions', () => {
  expect(Object.keys(plugin.configs.recommended.rules ?? {}).every((ruleId) => ruleId.startsWith('@stet-css/'))).toBe(true)
  expect(Object.keys(plugin.configs.recommended.plugins ?? {})).toEqual(['@stet-css'])
  for (const rule of Object.values(plugin.rules ?? {})) {
    expect(rule.meta?.docs?.description).not.toMatch(/Master/)
  }
})
