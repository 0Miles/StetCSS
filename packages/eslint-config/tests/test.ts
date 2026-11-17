import { test, expect } from 'vitest'
import { ESLint } from 'eslint'
import css from '../src/index'

test('ESLint Configuration is valid', async () => {
  const eslint = new ESLint({ cwd: __dirname })
  const result = await eslint.lintFiles('./index.html')
  expect(result[0].errorCount).toBe(0)
  expect(result[0].warningCount).toBe(9)
  expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
    [
      'Sort classes into the expected order: "m:0.625rem m:1.25rem m:1.875rem m:2.5rem@sm m:3.125rem@sm".',
      'Remove classes "m:0.625rem m:1.875rem m:3.125rem@sm"; they are overridden by later classes "m:1.25rem m:2.5rem@sm".',
      'Sort classes into the expected order: "block m:2rem mb:3rem font:.75rem font:1.5rem@sm font:2rem@md".',
      'Use canonical class "font:xs" instead of "font:.75rem".',
      'Use canonical class "font:2xl@sm" instead of "font:1.5rem@sm".',
      'Replace "m:2rem" with "mx:2rem mt:2rem"; later class "mb:3rem" overrides part of "m:2rem".',
      'Use canonical class "m:xl" instead of "m:2rem".',
      'Use canonical class "font:3xl@md" instead of "font:2rem@md".',
      'Use canonical class "mb:2xl" instead of "mb:3rem".',
    ]
  )
})

test('Default ESLint configuration lints standalone stylesheets', async () => {
  const diagnosticESLint = new ESLint({
    cwd: __dirname,
    overrideConfigFile: true,
    overrideConfig: css
  })
  const fixESLint = new ESLint({
    cwd: __dirname,
    fix: true,
    overrideConfigFile: true,
    overrideConfig: css
  })
  const [diagnosticResult] = await diagnosticESLint.lintText('.btn { @compose contain:content; }', { filePath: 'index.css' })
  const [fixResult] = await fixESLint.lintText('.btn { @compose contain:content; }', { filePath: 'index.css' })

  expect(diagnosticResult.errorCount).toBe(0)
  expect(diagnosticResult.warningCount).toBe(1)
  expect(fixResult.output).toBe('.btn { contain: content; }')
})
