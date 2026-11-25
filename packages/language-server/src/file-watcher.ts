import { statSync } from 'node:fs'

/**
 * How often watched files are checked. A change is reported at the first check that finds nothing
 * new after it, so it reaches the server between one and two intervals after the last write.
 */
const FILE_WATCH_INTERVAL = 500

/**
 * What tells a file changed without reading it. The inode catches a file replaced at the same
 * path (`git checkout`, a package reinstall), even when its times and size happen to match.
 */
export interface FileStamp {
  ino: number
  mtimeMs: number
  ctimeMs: number
  size: number
}

/** The stamp of `file`, or `undefined` when it is missing or cannot be read. */
export function readFileStamp(file: string): FileStamp | undefined {
  try {
    const { ino, mtimeMs, ctimeMs, size } = statSync(file)
    return { ino, mtimeMs, ctimeMs, size }
  } catch {
    return undefined
  }
}

function isSameFileStamp(a: FileStamp | undefined, b: FileStamp | undefined) {
  if (!a || !b) return a === b
  return a.ino === b.ino && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs && a.size === b.size
}

/**
 * Watches files by polling their stamps, so it sees every way a file can change outside the
 * editor, with no watch handle to lose when a directory is deleted: written in place, replaced,
 * removed, or created again (a missing file is watched like any other). Each key (a workspace) watches its own files; a file shared by several
 * keys is checked once.
 *
 * Changes are batched: while any check still finds a new change, nothing is reported, so a branch
 * switch or a package install that writes many files reports each key once, after the writes stop.
 */
export class FileWatcher {
  private readonly watched = new Map<string, Set<string>>()
  private readonly stamps = new Map<string, FileStamp | undefined>()
  private pending = new Map<string, Set<string>>()
  private timer?: ReturnType<typeof setInterval>
  private disposed = false

  constructor(private readonly onChange: (key: string, files: string[]) => void) { }

  /**
   * Watches `files` for `key`, each with the stamp the caller read before reading the file, so a
   * change made after that read is reported. It replaces what `key` watched before, except files
   * that are missing now: they stay watched until they come back, since a branch switch or an
   * install that removed them may restore them. A file already watched keeps the stamp last seen,
   * so a change another key has not been told about yet is not lost. No files stops watching `key`.
   */
  watch(key: string, files: ReadonlyMap<string, FileStamp | undefined>) {
    if (this.disposed) return
    const keyFiles = new Set(files.keys())
    for (const file of this.watched.get(key) ?? []) {
      if (!readFileStamp(file)) keyFiles.add(file)
    }
    if (!keyFiles.size) {
      this.unwatch(key)
      return
    }
    this.watched.set(key, keyFiles)
    for (const file of keyFiles) {
      if (!this.stamps.has(file)) this.stamps.set(file, files.get(file))
    }
    this.forgetUnwatchedFiles()
    if (!this.timer) {
      this.timer = setInterval(() => this.check(), FILE_WATCH_INTERVAL)
      this.timer.unref?.()
    }
  }

  unwatch(key: string) {
    if (!this.watched.delete(key)) return
    this.pending.delete(key)
    this.forgetUnwatchedFiles()
    if (!this.watched.size) this.stopTimer()
  }

  /** Stops watching for good: a reload still running when the server stops watches nothing. */
  dispose() {
    this.disposed = true
    this.watched.clear()
    this.stamps.clear()
    this.pending.clear()
    this.stopTimer()
  }

  private check() {
    let changed = false
    for (const [file, stamp] of this.stamps) {
      const nextStamp = readFileStamp(file)
      if (isSameFileStamp(nextStamp, stamp)) continue
      this.stamps.set(file, nextStamp)
      changed = true
      for (const [key, keyFiles] of this.watched) {
        if (!keyFiles.has(file)) continue
        let pendingFiles = this.pending.get(key)
        if (!pendingFiles) this.pending.set(key, pendingFiles = new Set())
        pendingFiles.add(file)
      }
    }
    if (changed || !this.pending.size) return
    const pending = this.pending
    this.pending = new Map()
    for (const [key, files] of pending) this.onChange(key, [...files])
  }

  private forgetUnwatchedFiles() {
    const files = new Set<string>()
    for (const keyFiles of this.watched.values()) {
      for (const file of keyFiles) files.add(file)
    }
    for (const file of this.stamps.keys()) {
      if (!files.has(file)) this.stamps.delete(file)
    }
  }

  private stopTimer() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }
}
