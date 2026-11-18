import { describe, expect, test } from 'vitest'
import CSSScanner from '../src'

describe('CSSScanner public API', () => {
  test('does not expose file lifecycle or export helpers', async () => {
    const scanner = await new CSSScanner({}).init()

    expect('prepare' in scanner).toBe(false)
    expect('scanFile' in scanner).toBe(false)
    expect('scanFiles' in scanner).toBe(false)
    expect('fixedSourcePaths' in scanner).toBe(false)
    expect('allowedSourcePaths' in scanner).toBe(false)
    expect('startWatch' in scanner).toBe(false)
    expect('closeWatch' in scanner).toBe(false)
    expect('watchSources' in scanner).toBe(false)
    expect('watch' in scanner).toBe(false)
    expect('export' in scanner).toBe(false)
  })

  test('can reset scanner state without source discovery', async () => {
    const scanner = await new CSSScanner({}).init()

    await scanner.scan('index.html', '<div class="block"></div>')
    expect(scanner.validClasses.has('block')).toBe(true)

    await scanner.reset()

    expect(scanner.validClasses.has('block')).toBe(false)
  })

  /**
   * Guards that `scanSource` reports every class a source contains, so a caller can tell which
   * classes each file uses (#193): classes another source already brought, and an unchanged
   * re-read, still come back as candidates while `changed` follows `scan`.
   * Reverse check: returning only the candidates new to the scanner turns only this test red.
   */
  test('scanSource returns each source\'s own candidates, including ones already seen', async () => {
    const scanner = await new CSSScanner({}).init()

    expect(await scanner.scanSource('a.html', '<div class="block"></div>')).toEqual({ changed: true, candidates: ['block'] })
    expect(await scanner.scanSource('b.html', '<div class="hidden block block"></div>')).toEqual({ changed: true, candidates: ['hidden', 'block'] })
    expect(await scanner.scanSource('c.html', '<div class="block"></div>')).toEqual({ changed: false, candidates: ['block'] })
    expect(await scanner.scanSource('a.html', '<div class="block"></div>')).toEqual({ changed: false, candidates: ['block'] })
  })

  test('names the build placeholder rule #stet-css-slot', () => {
    expect(new CSSScanner({}).slotCSSRule).toBe('#stet-css-slot{--slot:0}')
  })
})
