// `bun run check`: the root scripts' node:test tests, then every package's
// test, lint, and type-check through turbo. Arguments go to turbo, so
// `bun run check -- --continue` still runs every package task. Both parts
// always run and the exit code is non-zero when either fails, so a failing
// root-script test does not hide package failures, or the other way round.

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const run = (args) => spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' }).status ?? 1

const scripts = run(['--test', 'scripts/*.test.mjs'])
const packages = run([
    'scripts/with-typescript-tooling-compat.mjs',
    'turbo', 'run', 'test', 'lint', 'type-check', '--filter=./packages/*',
    ...process.argv.slice(2),
])

if (scripts !== 0) console.error('error: root script tests (node --test scripts/*.test.mjs) failed; see above')
process.exit(scripts || packages)
