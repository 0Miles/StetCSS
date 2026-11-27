// Which tags and GitHub releases a shared-version release is missing.
//
// release-please tags each package `<component>-v<version>` (config
// `include-component-in-tag`) and creates one GitHub release per tag. It has
// created only some of them before without failing (0.1.0 to 0.3.0), and a
// package without the previous tag makes the next release PR collect commits
// from `bootstrap-sha` again. check-release-tags.mjs reads the repo and calls
// this; it stays pure so the decision is tested without the GitHub API.

/** @param {string} component @param {string} version */
export const releaseTag = (component, version) => `${component}-v${version}`

/**
 * A release counts by its tag name, the way release-please finds the previous
 * release; its title is cosmetic.
 *
 * @param {{ version: string, components: string[], tags: Iterable<string>, releases: Iterable<string> }} input
 *   `tags` are the repo's tag names, `releases` the tag names of its published GitHub releases.
 * @returns {{ missingTags: string[], missingReleases: string[] }} expected tag names, in component order
 */
export function findMissingReleases({ version, components, tags, releases }) {
    const tagSet = new Set(tags)
    const releaseSet = new Set(releases)
    const expected = components.map((component) => releaseTag(component, version))
    return {
        missingTags: expected.filter((tag) => !tagSet.has(tag)),
        missingReleases: expected.filter((tag) => !releaseSet.has(tag)),
    }
}
