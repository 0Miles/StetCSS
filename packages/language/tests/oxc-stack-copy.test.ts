import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const PACKAGE_NAME_LINE = /^const PACKAGE_NAME = .*$/m

function readCopy(path: string) {
  return readFileSync(resolve(__dirname, path), 'utf8').replace(PACKAGE_NAME_LINE, 'const PACKAGE_NAME')
}

/**
 * Guards: language may not import source, so both keep a copy of the module
 * that parses oxc on a sized stack. A fix made to one copy only leaves the
 * other package's host process crashing on deep nesting. Reverse check:
 * changing `IDLE_MS` in source's copy alone turns this test red.
 */
test('the oxc stack modules in source and language differ only in the package name', () => {
  expect(readCopy('../src/utils/oxc-stack.ts')).toBe(readCopy('../../source/src/adapters/oxc-stack.ts'))
})
