// Fails when the current shared version is missing any package's tag or
// GitHub release on GitHub, and lists each one. The Release Please workflow
// runs it after release-please reports that it created releases, so a partial
// release turns the run red instead of passing silently. It does not stop the
// npm publish. The decision lives in release-tags.mjs.
//
// The version comes from .release-please-manifest.json and the components
// from release-please-config.json. Tags and releases are read with the gh CLI,
// which authenticates with GH_TOKEN (GITHUB_TOKEN in Actions) and targets
// GH_REPO, or the checkout's remote when that is unset.
//
//   node scripts/check-release-tags.mjs

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findMissingReleases } from './release-tags.mjs'

const root = join(import.meta.dirname, '..')
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))

const versions = [...new Set(Object.values(readJson('.release-please-manifest.json')))]
if (versions.length !== 1) {
    console.error(`error: .release-please-manifest.json should hold one shared version, found ${versions.join(', ') || 'none'}`)
    process.exit(1)
}
const [version] = versions
const components = Object.values(readJson('release-please-config.json').packages ?? {}).map((options) => options.component)

/** Every page of a list endpoint, one `jq` result per line. */
function ghList(endpoint, jq) {
    const output = execFileSync('gh', ['api', '--paginate', '--jq', jq, `repos/{owner}/{repo}/${endpoint}?per_page=100`], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
    })
    return output.split('\n').filter(Boolean)
}

const tags = ghList('tags', '.[].name')
// Drafts are not visible to developers, so they do not count.
const releases = ghList('releases', '.[] | select(.draft | not) | .tag_name')

const { missingTags, missingReleases } = findMissingReleases({ version, components, tags, releases })
for (const tag of missingTags) console.error(`error: missing tag ${tag}`)
for (const tag of missingReleases) console.error(`error: missing GitHub release for ${tag}`)

if (missingTags.length || missingReleases.length) {
    console.error(`${missingTags.length} tags and ${missingReleases.length} GitHub releases of ${components.length} packages at ${version} are missing; create them on the release commit (docs/agents/dev-workflow.md, "檢查 tag 與 GitHub release").`)
    process.exit(1)
}
console.log(`all ${components.length} packages at ${version} have their tag and GitHub release`)
