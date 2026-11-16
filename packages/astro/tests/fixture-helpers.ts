import { readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/** The contents of every file under `dir` with `extension`. */
export function readFiles(dir: string, extension: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'))
}

/** Removes what an Astro build leaves in a fixture: its output, cache and dependency links. */
export function cleanFixture(root: string, outDir = join(root, 'dist')) {
  rmSync(outDir, { recursive: true, force: true })
  rmSync(join(root, '.astro'), { recursive: true, force: true })
  rmSync(join(root, 'node_modules'), { recursive: true, force: true })
}
