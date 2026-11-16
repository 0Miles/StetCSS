// Fails when the release-please config or manifest drifts from the packages
// that get published, so a new, renamed, or removed package cannot silently
// fall out of (or linger in) the shared-version release.
//
// A published package is any workspace package named `@stet-css/*` that is
// not `private`. The VS Code extension, examples, benchmarks, and shared fall
// outside that set by name or by `private`.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const SCOPE = '@stet-css/'
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))

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

const published = new Map()
for (const dir of workspaceDirs()) {
    const pkg = readJson(`${dir}/package.json`)
    if (pkg.name?.startsWith(SCOPE) && !pkg.private) published.set(dir, pkg)
}

const config = readJson('release-please-config.json')
const manifest = readJson('.release-please-manifest.json')
const packages = config.packages ?? {}
const errors = []

function compareSets(label, actual) {
    const missing = [...published.keys()].filter((dir) => !actual.includes(dir))
    const extra = actual.filter((dir) => !published.has(dir))
    if (missing.length) errors.push(`${label} is missing published packages: ${missing.join(', ')}`)
    if (extra.length) errors.push(`${label} lists paths that are not published packages: ${extra.join(', ')}`)
}

compareSets('.release-please-manifest.json', Object.keys(manifest))
compareSets('release-please-config.json "packages"', Object.keys(packages))

const linked = (config.plugins ?? []).filter((plugin) => plugin?.type === 'linked-versions')
if (linked.length !== 1) {
    errors.push(`release-please-config.json needs exactly one linked-versions plugin, found ${linked.length}`)
} else {
    const components = Object.values(packages).map((options) => options.component)
    const grouped = linked[0].components ?? []
    const ungrouped = components.filter((component) => !grouped.includes(component))
    const unknown = grouped.filter((component) => !components.includes(component))
    if (ungrouped.length) errors.push(`linked-versions does not group these components: ${ungrouped.join(', ')}`)
    if (unknown.length) errors.push(`linked-versions groups components no package declares: ${unknown.join(', ')}`)
}

for (const [dir, pkg] of published) {
    // Tags are `<component>-v<version>`; the component must be the package's
    // unscoped name so tags stay readable and never reuse upstream's `v2.0.0-rc.88`.
    if (dir in packages && `${SCOPE}${packages[dir].component}` !== pkg.name) {
        errors.push(`${dir}: component "${packages[dir].component}" does not match package name ${pkg.name}`)
    }
    if (dir in manifest && pkg.version !== manifest[dir]) {
        errors.push(`${dir}: package.json version ${pkg.version} differs from manifest version ${manifest[dir]}`)
    }
}

const versions = new Set(Object.values(manifest))
if (versions.size > 1) {
    errors.push(`manifest versions differ, but every package shares one version: ${[...versions].join(', ')}`)
}

if (errors.length) {
    for (const error of errors) console.error(`error: ${error}`)
    process.exit(1)
}
console.log(`release manifest covers ${published.size} published packages at version ${[...versions][0]}`)
