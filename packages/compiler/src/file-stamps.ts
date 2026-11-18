import { statSync } from 'node:fs'

/** What tells a file changed without reading it: its modification and change times and its size. */
export interface FileStamp {
  mtimeMs: number
  ctimeMs: number
  size: number
}

/** The stamp of `file`, or `undefined` when it cannot be read (missing, removed, no access). */
export function readFileStamp(file: string): FileStamp | undefined {
  try {
    const stats = statSync(file)
    return { mtimeMs: stats.mtimeMs, ctimeMs: stats.ctimeMs, size: stats.size }
  } catch {
    return undefined
  }
}

function isSameFileStamp(a: FileStamp | undefined, b: FileStamp | undefined) {
  if (!a || !b) return a === b
  return a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs && a.size === b.size
}

/**
 * A result computed from files, kept while every one of those files keeps its stamp. Values are
 * shared between callers, so treat them as read-only.
 */
export interface FileStampCache<V> {
  /** The value stored under `key`, or `undefined` when there is none or one of its files changed. */
  get(key: string): V | undefined
  /**
   * Stores `value`, computed from `files`. `startedAt` is `Date.now()` taken before the value read
   * its first file: a file changed since then may have been read half-written, so the value is
   * not stored and the next `get` computes it again.
   */
  set(key: string, value: V, files: Iterable<string>, startedAt: number): void
  clear(): void
}

/** How many values one cache keeps; the oldest goes first, so a long session never grows without bound. */
const DEFAULT_MAX_FILE_STAMP_CACHE_ENTRIES = 64

export function createFileStampCache<V>(maxEntries = DEFAULT_MAX_FILE_STAMP_CACHE_ENTRIES): FileStampCache<V> {
  const entries = new Map<string, { value: V, stamps: [string, FileStamp | undefined][] }>()
  return {
    get(key) {
      const entry = entries.get(key)
      if (!entry) return
      if (entry.stamps.every(([file, stamp]) => isSameFileStamp(readFileStamp(file), stamp))) {
        return entry.value
      }
      entries.delete(key)
    },
    set(key, value, files, startedAt) {
      const stamps: [string, FileStamp | undefined][] = []
      for (const file of new Set(files)) {
        const stamp = readFileStamp(file)
        if (stamp && Math.max(stamp.mtimeMs, stamp.ctimeMs) >= startedAt) {
          entries.delete(key)
          return
        }
        stamps.push([file, stamp])
      }
      entries.delete(key)
      entries.set(key, { value, stamps })
      if (entries.size > maxEntries) {
        entries.delete(entries.keys().next().value!)
      }
    },
    clear() {
      entries.clear()
    }
  }
}
