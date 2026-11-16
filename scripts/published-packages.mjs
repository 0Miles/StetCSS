// The set of packages that release-please versions and npm receives.
//
// A published package is any workspace package named `@stet-css/*` that is
// not `private`. Examples, benchmarks, and shared fall outside that set by
// name or by `private`. The VS Code extension ships to the Marketplace through
// `release:vscode`, so it stays out even if a rename puts it in the scope.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const root = join(import.meta.dirname, '..')
export const SCOPE = '@stet-css/'
const NOT_PUBLISHED_TO_NPM = new Set(['packages/vscode'])

export const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))

function workspaceDirs() {
    const dirs = []
    for (const pattern of readJson('package.json').workspaces) {
        if (pattern.endsWith('/*')) {
            const parent = pattern.slice(0, -2)
            for (const entry of readdirSync(join(root, parent), { withFileTypes: true })) {
                if (entry.isDirectory()) dirs.push(`${parent}/${entry.name}`)
            }
        } else {
            dirs.push(pattern)
        }
    }
    return dirs.filter((dir) => existsSync(join(root, dir, 'package.json')))
}

/** @returns {Map<string, any>} repo-relative package dir -> its package.json */
export function publishedPackages() {
    const published = new Map()
    for (const dir of workspaceDirs()) {
        if (NOT_PUBLISHED_TO_NPM.has(dir)) continue
        const pkg = readJson(`${dir}/package.json`)
        if (pkg.name?.startsWith(SCOPE) && !pkg.private) published.set(dir, pkg)
    }
    return published
}
