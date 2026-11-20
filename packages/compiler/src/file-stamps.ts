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
 * How long before a read a file must have last been modified for its stamp to tell every later
 * edit apart. File systems with one- or two-second timestamps (FAT, HFS+, some network mounts)
 * give a same-size edit within that window the same stamp, so such a file is read again next time.
 */
const FILE_STAMP_SETTLE_MS = 2000

/**
 * Whether a value read from a file whose stamp is now `stamp`, by a read that began at `startedAt`,
 * can be reused while the stamp stays: the file changed neither during the read (its change time
 * would be later) nor so shortly before it that a coarse timestamp could hide the next edit.
 * Change times come from the file system's clock, which can trail `Date.now()` by a tick (Linux
 * stamps files from its coarse clock), so a change within that tick after `startedAt` is caught
 * only by its modification time, which every ordinary write moves into the settle window.
 */
function isSettledFileStamp(stamp: FileStamp, startedAt: number) {
  return stamp.ctimeMs < startedAt && stamp.mtimeMs < startedAt - FILE_STAMP_SETTLE_MS
}

/**
 * A result computed from files, kept while every one of those files keeps its stamp. Values are
 * shared between callers, so treat them as read-only. Entries belong to an optional `owner` object,
 * such as the base manifest a result was compiled on, and go away with it.
 */
export interface FileStampCache<V> {
  /** The value stored under `key`, or `undefined` when there is none or one of its files changed. */
  get(key: string, owner?: object): V | undefined
  /**
   * Stores `value`, computed from `files`. `startedAt` is `Date.now()` taken before the value read
   * its first file. A file changed since, or too shortly before to trust its stamp, keeps the value
   * out of the cache, so the next `get` computes it again.
   */
  set(key: string, value: V, files: Iterable<string>, startedAt: number, owner?: object): void
}

interface FileStampCacheEntry<V> {
  value: V
  stamps: [string, FileStamp | undefined][]
}

const NO_OWNER = {}

/**
 * Creates a file-stamp cache that keeps at most `maxEntries` values per owner, dropping the least
 * recently used one first, so a long session never grows without bound.
 */
export function createFileStampCache<V>(maxEntries: number): FileStampCache<V> {
  const owners = new WeakMap<object, Map<string, FileStampCacheEntry<V>>>()
  const getEntries = (owner: object = NO_OWNER) => {
    let entries = owners.get(owner)
    if (!entries) {
      entries = new Map()
      owners.set(owner, entries)
    }
    return entries
  }
  return {
    get(key, owner) {
      const entries = getEntries(owner)
      const entry = entries.get(key)
      if (!entry) return
      entries.delete(key)
      if (!entry.stamps.every(([file, stamp]) => isSameFileStamp(readFileStamp(file), stamp))) return
      entries.set(key, entry)
      return entry.value
    },
    set(key, value, files, startedAt, owner) {
      const entries = getEntries(owner)
      entries.delete(key)
      const stamps: [string, FileStamp | undefined][] = []
      for (const file of new Set(files)) {
        const stamp = readFileStamp(file)
        if (stamp && !isSettledFileStamp(stamp, startedAt)) return
        stamps.push([file, stamp])
      }
      entries.set(key, { value, stamps })
      if (entries.size > maxEntries) {
        entries.delete(entries.keys().next().value!)
      }
    }
  }
}
