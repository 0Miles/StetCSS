// The two halves of the npm publish job in .github/workflows/release-please.yml.
//
//   node scripts/publish-packages.mjs pack --tag <release tag> --out <dir>
//   node scripts/publish-packages.mjs publish --dir <dir>
//
// `pack` writes one tarball per published package with `bun pm pack`, the tool
// `check:packages` inspects: it rewrites `workspace:^` to the shared version.
// It refuses unless every package is at the version the release tag names, so
// the never-released 0.0.0 or a commit other than the release cannot be packed.
//
// `publish` uploads those tarballs with `npm publish`, because `bun publish`
// (1.4.4) cannot use npm trusted publishing or write provenance. npm has no
// multi-package transaction, so it publishes in dependency order, skips
// versions the registry already has, and stops at the first failure: a rerun
// publishes only what is missing, and no published package ever depends on a
// version that is not there yet. It imports nothing from the repo, so the job
// holding the npm identity runs no dependency code.
//
// NPM_BIN replaces the `npm` executable; the reverse checks point it at a fake.

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const NPM = process.env.NPM_BIN || 'npm'
// The workflow passes the optional NPM_TOKEN secret, which is an empty string
// when the secret is not set. npm reads its token from NODE_AUTH_TOKEN (the
// .npmrc setup-node writes), and an empty one must not replace the value
// setup-node exported: hand npm the token only when there is one.
const { NPM_TOKEN, ...npmEnv } = process.env
if (NPM_TOKEN) npmEnv.NODE_AUTH_TOKEN = NPM_TOKEN
else if (!npmEnv.NODE_AUTH_TOKEN) delete npmEnv.NODE_AUTH_TOKEN
// Trusted publishing (OIDC) arrived in npm 11.5.1; older versions fall back
// to a token without saying so.
const MIN_NPM = [11, 5, 1]
const INSTALLED_DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']

function fail(message) {
    console.error(`error: ${message}`)
    process.exit(1)
}

async function pack({ tag, out }) {
    if (!tag || !out) fail('usage: publish-packages.mjs pack --tag <release tag> --out <dir>')
    const { publishedPackages, root } = await import('./published-packages.mjs')
    // Tags are `<component>-v<version>`; every published package shares the version.
    const version = /-v(\d+\.\d+\.\d+(?:-[\w.-]+)?)$/.exec(tag)?.[1]
    if (!version) fail(`"${tag}" is not a release tag such as core-v0.1.0`)

    const published = publishedPackages()
    const mismatched = [...published.values()].filter((pkg) => pkg.version !== version)
    if (mismatched.length) {
        fail(`${tag} releases ${version}, but this checkout has ${mismatched.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')}`)
    }

    const destination = resolve(out)
    mkdirSync(destination, { recursive: true })
    if (readdirSync(destination).length) fail(`${destination} is not empty`)
    for (const dir of published.keys()) {
        execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--quiet', '--destination', destination], { cwd: join(root, dir), stdio: ['ignore', 'ignore', 'inherit'] })
    }
    const tarballs = readdirSync(destination).filter((name) => name.endsWith('.tgz'))
    if (tarballs.length !== published.size) fail(`expected ${published.size} tarballs in ${destination}, found ${tarballs.length}`)
    console.log(`packed ${tarballs.length} packages at ${version} into ${destination}`)
}

function readTarballs(dir) {
    return readdirSync(dir)
        .filter((name) => name.endsWith('.tgz'))
        .map((name) => {
            const path = join(dir, name)
            return { path, pkg: JSON.parse(execFileSync('tar', ['-xzOf', path, 'package/package.json'], { encoding: 'utf8' })) }
        })
}

/** Dependencies before dependents, so a stopped run leaves nothing depending on an unpublished version. */
function dependencyOrder(tarballs) {
    const byName = new Map(tarballs.map((tarball) => [tarball.pkg.name, tarball]))
    const ordered = new Set()
    const visit = (tarball, path) => {
        if (ordered.has(tarball)) return
        if (path.includes(tarball)) fail(`dependency cycle: ${[...path, tarball].map(({ pkg }) => pkg.name).join(' -> ')}`)
        for (const field of INSTALLED_DEPENDENCY_FIELDS) {
            for (const name of Object.keys(tarball.pkg[field] ?? {})) {
                if (byName.has(name)) visit(byName.get(name), [...path, tarball])
            }
        }
        ordered.add(tarball)
    }
    for (const name of [...byName.keys()].sort()) visit(byName.get(name), [])
    return [...ordered]
}

/** Whether the registry already has this exact version. Anything but a clear yes or "not found" aborts. */
function isPublished({ name, version }) {
    const result = spawnSync(NPM, ['view', `${name}@${version}`, 'version', '--json'], { encoding: 'utf8', env: npmEnv })
    if (result.error) fail(`cannot run ${NPM}: ${result.error.message}`)
    // An unknown version of a known package prints nothing and exits 0; an unknown package is E404.
    if (result.status === 0) return result.stdout.trim() !== ''
    if (/\bE404\b/.test(result.stdout + result.stderr)) return false
    fail(`cannot tell whether ${name}@${version} is published:\n${(result.stderr || result.stdout).trim()}`)
}

function publish({ dir }) {
    if (!dir) fail('usage: publish-packages.mjs publish --dir <dir>')
    const tarballs = dependencyOrder(readTarballs(resolve(dir)))
    if (!tarballs.length) fail(`no tarballs in ${resolve(dir)}`)

    const versions = new Set(tarballs.map(({ pkg }) => pkg.version))
    if (versions.size !== 1) fail(`tarballs carry more than one version: ${[...versions].join(', ')}`)

    const npmVersion = execFileSync(NPM, ['--version'], { encoding: 'utf8', env: npmEnv }).trim()
    const parts = npmVersion.split('.').map((part) => Number.parseInt(part, 10))
    const differs = MIN_NPM.findIndex((min, index) => parts[index] !== min)
    if (differs !== -1 && !(parts[differs] > MIN_NPM[differs])) fail(`npm ${npmVersion} is older than ${MIN_NPM.join('.')}, the first with trusted publishing`)

    // Ask about every package before uploading any, so a registry outage stops the run with nothing published.
    const missing = tarballs.filter(({ pkg }) => {
        const published = isPublished(pkg)
        if (published) console.log(`skip ${pkg.name}@${pkg.version}: already on the registry`)
        return !published
    })

    for (const [index, { path, pkg }] of missing.entries()) {
        console.log(`publish ${pkg.name}@${pkg.version}`)
        // The tarball is final: no lifecycle script may rebuild or alter it.
        const result = spawnSync(NPM, ['publish', path, '--access', 'public', '--provenance', '--ignore-scripts'], { stdio: 'inherit', env: npmEnv })
        if (result.status !== 0) {
            const left = missing.slice(index).map((tarball) => tarball.pkg.name)
            console.error(`error: publishing ${pkg.name}@${pkg.version} failed${result.error ? `: ${result.error.message}` : ''}`)
            console.error(`${index} published in this run, ${left.length} still missing: ${left.join(', ')}`)
            console.error('Rerun the failed job, or start the workflow by hand with the release tag: versions already on the registry are skipped.')
            process.exit(1)
        }
    }
    console.log(`${missing.length} published, ${tarballs.length - missing.length} already on the registry, version ${[...versions][0]}`)
}

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { tag: { type: 'string' }, out: { type: 'string' }, dir: { type: 'string' } }
})
if (positionals[0] === 'pack') await pack(values)
else if (positionals[0] === 'publish') publish(values)
else fail('usage: publish-packages.mjs <pack --tag <release tag> --out <dir> | publish --dir <dir>>')
