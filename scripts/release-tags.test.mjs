/**
 * Guards the fail-closed release check: a release-please run that tags or
 * releases only some packages must turn the Release Please run red and name
 * what is missing, instead of passing silently as 0.1.0 to 0.3.0 did. If
 * findMissingReleases stops reporting a missing tag or release, maintainers
 * learn about it only when the next release PR re-collects old commits.
 *
 * Reverse check (docs/agents/testing.md, rule 5): in release-tags.mjs, the
 * `missingTags` filter replaced with `() => false` turns "names the missing
 * tag" and "names the first component" red; the `missingReleases` filter
 * replaced with `() => false` turns "names the missing release" and "names
 * the first component" red; `components.slice(1).map` turns only "names the
 * first component" red.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findMissingReleases } from './release-tags.mjs'

const components = ['core', 'vite', 'webpack']
const all = ['core-v0.3.0', 'vite-v0.3.0', 'webpack-v0.3.0']

test('passes when every component has its tag and release', () => {
    assert.deepEqual(
        findMissingReleases({ version: '0.3.0', components, tags: all, releases: all }),
        { missingTags: [], missingReleases: [] },
    )
})

test('names the missing tag', () => {
    const tags = ['core-v0.3.0', 'webpack-v0.3.0', 'vite-v0.2.0']
    assert.deepEqual(
        findMissingReleases({ version: '0.3.0', components, tags, releases: all }),
        { missingTags: ['vite-v0.3.0'], missingReleases: [] },
    )
})

test('names the first component when its tag and release are missing', () => {
    const rest = ['vite-v0.3.0', 'webpack-v0.3.0']
    assert.deepEqual(
        findMissingReleases({ version: '0.3.0', components, tags: rest, releases: all }),
        { missingTags: ['core-v0.3.0'], missingReleases: [] },
    )
    assert.deepEqual(
        findMissingReleases({ version: '0.3.0', components, tags: all, releases: rest }),
        { missingTags: [], missingReleases: ['core-v0.3.0'] },
    )
})

test('names the missing release', () => {
    const releases = ['core-v0.3.0', 'vite-v0.3.0', 'webpack-v0.2.0']
    assert.deepEqual(
        findMissingReleases({ version: '0.3.0', components, tags: all, releases }),
        { missingTags: [], missingReleases: ['webpack-v0.3.0'] },
    )
})
