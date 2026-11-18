import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createFileStampCache } from '../src/file-stamps'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'stet-css-file-stamps-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

/** Writes `file` and dates its modification `msBeforeStart` before a read that starts in a minute. */
function writeModifiedBefore(file: string, msBeforeStart: number) {
  const startedAt = Date.now() + 60_000
  writeFileSync(file, 'a')
  const modifiedAt = new Date(startedAt - msBeforeStart)
  utimesSync(file, modifiedAt, modifiedAt)
  return startedAt
}

describe('file-stamp cache', () => {
  /**
   * Guards: trusting the stamp of a file modified shortly before it was read. On file systems with
   * one- or two-second timestamps a same-size edit in that window keeps the stamp, so the cached
   * value would never be recomputed.
   * Reverse check: dropping the settle window from `isSettledFileStamp` turns only this test red.
   */
  test('keeps a value only when its files were last modified two seconds before the read began', () => {
    const cache = createFileStampCache<string>(8)
    const recentPath = join(root, 'recent.css')
    const settledPath = join(root, 'settled.css')

    cache.set('recent', 'value', [recentPath], writeModifiedBefore(recentPath, 1000))
    cache.set('settled', 'value', [settledPath], writeModifiedBefore(settledPath, 3000))

    expect(cache.get('recent')).toBeUndefined()
    expect(cache.get('settled')).toBe('value')
  })

  /**
   * Guards: a busy cache dropping the value every caller reuses because it was stored first.
   * Reverse check: making `get` keep a hit in place (deleting only a changed entry) turns only this test red.
   */
  test('drops the least recently used value first', () => {
    const cache = createFileStampCache<string>(2)
    const file = join(root, 'a.css')
    const startedAt = writeModifiedBefore(file, 10_000)
    cache.set('a', 'A', [file], startedAt)
    cache.set('b', 'B', [file], startedAt)
    expect(cache.get('a')).toBe('A')

    cache.set('c', 'C', [file], startedAt)

    expect([cache.get('a'), cache.get('b'), cache.get('c')]).toStrictEqual(['A', undefined, 'C'])
  })
})
