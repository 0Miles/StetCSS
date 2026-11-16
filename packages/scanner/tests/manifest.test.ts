import CSSScanner from '../src'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect } from 'vitest'
import { compileCSSManifest } from '@stet-css/compiler'

test('uses default manifest settings without implicit manifest entry discovery', async () => {
  const scanner = await new CSSScanner({}, __dirname).init()
  expect(scanner.css.settings).toBeDefined()
})

test('reject string scanner options', async () => {
  await expect(new CSSScanner('options' as any, __dirname).init())
    .rejects
    .toThrow('CSSScanner options must be an object.')
})

/**
 * Guards the internal validation manifest `stet-css inspect` passes: classes an entry declares
 * must validate the way the build renders them, also after `reset()`, while the user options
 * still reject `manifest`.
 * Reverse check: validating against the preset manifest only turns only this test red.
 */
test('validates against the internal manifest a first-party caller passes', async () => {
  const { manifest } = compileCSSManifest(`
    @components {
      blue-btn {
        background-color: oklch(63.7% 0.237 25.331);
      }
    }
  `)
  const scanner = await new CSSScanner({}, __dirname, { manifest }).init()

  await scanner.scan('index.html', '<button class="blue-btn"></button>')
  expect(scanner.validClasses.has('blue-btn')).toBe(true)
  await scanner.reset()
  await scanner.scan('index.html', '<button class="blue-btn"></button>')
  expect(scanner.validClasses.has('blue-btn')).toBe(true)

  const presetScanner = await new CSSScanner({}, __dirname).init()
  await presetScanner.scan('index.html', '<button class="blue-btn"></button>')
  expect(presetScanner.invalidClasses.has('blue-btn')).toBe(true)
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
