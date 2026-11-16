import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import execBunSync from './bun-command'

/**
 * Runs a fixture's package script from a clean `.next` and `.master`, surfacing the build log
 * on failure. A `.master/next.css` left by a webpack build holds real CSS, so a Turbopack
 * build could otherwise pass without its generated CSS loader running.
 */
export function runFixtureScript(fixtureDir: string, script = 'build') {
  rmSync(join(fixtureDir, '.next'), { recursive: true, force: true })
  rmSync(join(fixtureDir, '.master'), { recursive: true, force: true })
  try {
    execBunSync(['run', script], {
      cwd: fixtureDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1'
      },
      stdio: 'pipe',
      timeout: 180000
    })
  } catch (error) {
    const buildError = error as Error & { stdout?: string | Buffer, stderr?: string | Buffer }
    throw new Error([
      buildError.message,
      buildError.stdout?.toString(),
      buildError.stderr?.toString()
    ].filter(Boolean).join('\n'))
  }
}

export function collectFiles(dir: string, matches: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(file, matches)
    return entry.isFile() && matches(file) ? [file] : []
  })
}

/** Every CSS asset the build emitted under `dir`, joined. */
export function readBuiltCSS(dir: string) {
  return collectFiles(dir, (file) => file.endsWith('.css'))
    .map((file) => readFileSync(file, 'utf-8'))
    .join('\n')
}

export function readBuiltJavaScript(dir: string) {
  return collectFiles(dir, (file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf-8'))
    .join('\n')
}
