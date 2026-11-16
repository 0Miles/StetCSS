import CSSScanner from '../src'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect } from 'vitest'

test('uses default manifest settings without implicit manifest entry discovery', async () => {
  const scanner = await new CSSScanner({}, __dirname).init()
  expect(scanner.css.settings).toBeDefined()
})

test('reject string scanner options', async () => {
  await expect(new CSSScanner('options' as any, __dirname).init())
    .rejects
    .toThrow('CSSScanner options must be an object.')
})

test('ignores native CSS classes from unmanaged CSS files', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-scanner-'))
  try {
    writeFileSync(join(cwd, 'theme.css'), `
      .native-card {
        color: red;
      }

      @layer components {
        .btn {
          display: inline-flex;
        }
      }
    `)

    const scanner = await new CSSScanner({}, cwd).init()
    let changes = 0
    scanner.on('change', () => {
      changes++
    })

    await scanner.scan('src/index.html', '<div class="native-card btn"></div>')

    expect(scanner.validClasses.has('btn')).toBe(false)
    expect(changes).toBe(0)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
