// Packs every published package the way the publish step will (`bun pm pack`,
// which rewrites `workspace:^` to the shared version) and fails when a tarball
// would install broken or point npm at the wrong repository:
//
// - a dependency still uses a local protocol such as `workspace:`;
// - an entry point (`exports`, `main`, `types`, `bin`, ...) is missing;
// - a shipped .js or .d.ts imports a relative path that is not in the tarball,
//   or the repo-internal `~/` alias, which never resolves for users;
// - `files` is missing, so the whole package directory (tests, tsconfigs,
//   build logs) would ship;
// - `repository`, `bugs`, or `homepage` points anywhere but this repo. npm
//   provenance compares `repository` with the repo that ran the publish.
//
// Run after `bun run build`: entry points live in each package's dist.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix } from 'node:path'
import { publishedPackages, root } from './published-packages.mjs'

const REPO = 'https://github.com/0Miles/StetCSS'
const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']
const LOCAL_PROTOCOL = /^(workspace|catalog|link|file|portal):/
const ENTRY_FIELDS = ['main', 'module', 'types', 'typings', 'style', 'jsnext:main', 'esnext']
const CODE_FILE = /\.(?:[mc]?js|d\.[mc]?ts)$/
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)(['"])([^'"\n]+)\1/gm

function listFiles(dir, prefix = '') {
    const files = []
    for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
        const path = posix.join(prefix, entry.name)
        if (entry.isDirectory()) files.push(...listFiles(dir, path))
        else files.push(path)
    }
    return files
}

function pack(dir) {
    const out = mkdtempSync(join(tmpdir(), 'stet-css-pack-'))
    execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--quiet', '--destination', out], { cwd: join(root, dir), stdio: ['ignore', 'ignore', 'pipe'] })
    const tarball = readdirSync(out).find((name) => name.endsWith('.tgz'))
    execFileSync('tar', ['-xzf', join(out, tarball), '-C', out])
    return { out, packageRoot: join(out, 'package') }
}

function entryTargets(pkg) {
    const targets = []
    const collect = (value, field) => {
        if (typeof value === 'string') targets.push([field, value])
        else if (value && typeof value === 'object') {
            for (const [key, nested] of Object.entries(value)) collect(nested, `${field}[${JSON.stringify(key)}]`)
        }
    }
    collect(pkg.exports, 'exports')
    for (const field of ENTRY_FIELDS) collect(pkg[field], field)
    collect(pkg.bin, 'bin')
    return targets
}

function matchesTarget(target, files) {
    const path = posix.normalize(target)
    if (!path.includes('*')) return files.has(path)
    const pattern = new RegExp(`^${path.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`)
    return [...files].some((file) => pattern.test(file))
}

function resolvesRelative(file, specifier, files) {
    const base = posix.normalize(posix.join(posix.dirname(file), specifier.replace(/[?#].*$/, '')))
    if (base.startsWith('../')) return false
    const candidates = [base, `${base}.js`, `${base}.d.ts`, `${base}.mjs`, `${base}.json`, `${base}/index.js`, `${base}/index.d.ts`]
    if (/\.d\.[mc]?ts$/.test(file)) candidates.push(base.replace(/\.([mc]?)js$/, '.d.$1ts'))
    return candidates.some((candidate) => files.has(candidate))
}

function checkPackage(dir, sourcePkg) {
    const errors = []
    if (!Array.isArray(sourcePkg.files)) errors.push('package.json has no "files" allowlist, so the whole directory would ship')

    const { out, packageRoot } = pack(dir)
    try {
        const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
        const files = new Set(listFiles(packageRoot))

        for (const field of DEPENDENCY_FIELDS) {
            for (const [name, range] of Object.entries(pkg[field] ?? {})) {
                if (LOCAL_PROTOCOL.test(range)) errors.push(`packed ${field}.${name} is still "${range}"`)
            }
        }

        for (const [field, target] of entryTargets(pkg)) {
            if (!matchesTarget(target, files)) errors.push(`${field} points at ${target}, which is not in the tarball`)
        }

        for (const file of [...files].filter((path) => CODE_FILE.test(path))) {
            const code = readFileSync(join(packageRoot, file), 'utf8')
            for (const [, , specifier] of code.matchAll(SPECIFIER)) {
                if (specifier.startsWith('~/')) errors.push(`${file} imports the repo-internal path "${specifier}"`)
                else if (specifier.startsWith('.') && !resolvesRelative(file, specifier, files)) {
                    errors.push(`${file} imports "${specifier}", which is not in the tarball`)
                }
            }
        }

        const expected = {
            'repository.type': [pkg.repository?.type, 'git'],
            'repository.url': [pkg.repository?.url, `git+${REPO}.git`],
            'repository.directory': [pkg.repository?.directory, dir],
            'bugs.url': [pkg.bugs?.url, `${REPO}/issues`],
            homepage: [pkg.homepage, `${REPO}/tree/main/${dir}#readme`]
        }
        for (const [field, [actual, wanted]] of Object.entries(expected)) {
            if (actual !== wanted) errors.push(`${field} is ${JSON.stringify(actual)}, expected "${wanted}"`)
        }
        return { errors, fileCount: files.size }
    } finally {
        rmSync(out, { recursive: true, force: true })
    }
}

let failed = 0
const published = publishedPackages()
for (const [dir, pkg] of published) {
    let result
    try {
        result = checkPackage(dir, pkg)
    } catch (error) {
        result = { errors: [`packing failed: ${error.stderr?.toString().trim() || error.message}`] }
    }
    if (result.errors.length) {
        failed++
        for (const error of result.errors) console.error(`error: ${pkg.name} (${dir}): ${error}`)
    }
}

if (failed) {
    console.error(`${failed} of ${published.size} published packages would ship broken or mislabelled tarballs`)
    process.exit(1)
}
console.log(`packed ${published.size} published packages: entry points present, no local dependency protocols, metadata points at ${REPO}`)
