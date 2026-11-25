import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { FileWatcher, readFileStamp } from '../src/file-watcher'

/** The file system the watcher sees: a stamp per path, or no entry for a missing file. */
const disk = vi.hoisted(() => new Map<string, { ino: number, mtimeMs: number, ctimeMs: number, size: number }>())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const statSync = (file: string) => {
    const stats = disk.get(file)
    if (!stats) throw Object.assign(new Error(`ENOENT: ${file}`), { code: 'ENOENT' })
    return stats
  }
  return { ...actual, statSync, default: { ...actual, statSync } }
})

let watcher: FileWatcher
let reports: [string, string[]][]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  reports = []
  watcher = new FileWatcher((key, files) => reports.push([key, files]))
})

afterEach(() => {
  watcher.dispose()
  disk.clear()
  vi.useRealTimers()
})

/** Runs the checks a change takes to be reported: one that finds it, one that finds nothing new. */
function settle() {
  vi.advanceTimersToNextTimer()
  vi.advanceTimersToNextTimer()
}

function watch(key: string, files: string[]) {
  watcher.watch(key, new Map(files.map((file) => [file, readFileStamp(file)])))
}

/**
 * Guards #248 (review F5): on a file system with one-second timestamps, a `git checkout` that
 * replaces a file with one of the same size within the same second leaves only the inode changed.
 * Catches: comparing stamps without the inode.
 */
test('reports a file replaced by one that differs only in its inode', () => {
  disk.set('/p/a.css', { ino: 1, mtimeMs: 1000, ctimeMs: 1000, size: 10 })
  watch('k', ['/p/a.css'])

  disk.set('/p/a.css', { ino: 2, mtimeMs: 1000, ctimeMs: 1000, size: 10 })
  settle()

  expect(reports).toEqual([['k', ['/p/a.css']]])
})

/**
 * Guards #248 (review F6): two workspaces can share a file, such as the preset. When one reloads
 * after a change the watcher has not checked yet, the other must still be told about it.
 * Catches: re-stamping a file that is already watched whenever a key watches it again.
 */
test('still reports a change to a shared file after another key watched it again', () => {
  disk.set('/p/preset.css', { ino: 1, mtimeMs: 1000, ctimeMs: 1000, size: 10 })
  watch('a', ['/p/preset.css'])
  watch('b', ['/p/preset.css'])

  disk.set('/p/preset.css', { ino: 1, mtimeMs: 2000, ctimeMs: 2000, size: 12 })
  watch('b', ['/p/preset.css'])
  settle()

  expect(reports).toContainEqual(['a', ['/p/preset.css']])
})

/**
 * Guards #248 (review F7): a removed file stays watched until it comes back, so it is missing at
 * every check after its removal was reported. That must not count as a new change, or the watcher
 * never finds a quiet check and reports nothing again.
 * Catches: treating two missing stamps as different.
 */
test('reports a later change while a removed file stays missing', () => {
  disk.set('/p/index.css', { ino: 1, mtimeMs: 1000, ctimeMs: 1000, size: 10 })
  disk.set('/p/gone.css', { ino: 2, mtimeMs: 1000, ctimeMs: 1000, size: 10 })
  watch('k', ['/p/index.css', '/p/gone.css'])

  disk.delete('/p/gone.css')
  settle()
  watch('k', ['/p/index.css'])
  disk.set('/p/index.css', { ino: 1, mtimeMs: 2000, ctimeMs: 2000, size: 11 })
  settle()

  expect(reports).toEqual([['k', ['/p/gone.css']], ['k', ['/p/index.css']]])
})
