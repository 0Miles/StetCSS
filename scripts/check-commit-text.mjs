// Fails when a PR title, a commit subject or a BREAKING CHANGE text in a
// commit range holds HTML-like tags such as `<style>`, and names each commit,
// line and rewrite. The release PR notes are parsed as HTML, so such text
// makes release-please release only some packages (#279). CI's `commit-text`
// job runs it on every PR (title and base..head) and on pushes to main (the
// pushed commits). The decision lives in commit-text.mjs.
//
//   node scripts/check-commit-text.mjs <revision range> [--title <PR title>]
//   node scripts/check-commit-text.mjs origin/main..HEAD

import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { findTagLikeText } from './commit-text.mjs'

const root = join(import.meta.dirname, '..')

let values, positionals
try {
    ({ values, positionals } = parseArgs({ options: { title: { type: 'string' } }, allowPositionals: true }))
} catch (error) {
    console.error(`error: ${error.message}`)
    process.exit(2)
}
if (positionals.length !== 1) {
    console.error('usage: node scripts/check-commit-text.mjs <revision range> [--title <PR title>]')
    process.exit(2)
}
const [range] = positionals

// Unit separator between hash and message, record separator between commits.
const log = execFileSync('git', ['log', '--format=%H%x1f%B%x1e', range, '--'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
})
const commits = log
    .split('\x1e')
    .map((record) => record.replace(/^\n/, ''))
    .filter(Boolean)
    .map((record) => {
        const [sha, message] = record.split('\x1f')
        const newline = message.indexOf('\n')
        const subject = newline === -1 ? message : message.slice(0, newline)
        // Drop the blank line after the subject, so the body starts at message line 3.
        const body = newline === -1 ? '' : message.slice(newline + 1).replace(/^\n/, '')
        return { sha, subject, body }
    })

const violations = findTagLikeText({ title: values.title, commits })
for (const { message } of violations) console.error(`error: ${message}`)

const checked = `${values.title === undefined ? '' : 'the PR title and '}${commits.length} commits in ${range}`
if (violations.length) {
    console.error(`
HTML-like tags on ${violations.length} line${violations.length === 1 ? '' : 's'} of ${checked}. Release notes are parsed as HTML, so a
tag such as <style> swallows the packages' sections after it (#279); backticks do not help. Describe the
element in words, then edit the PR title or reword the commits (git rebase -i) and push again. A commit
already merged to main is fixed in the release notes instead: docs/agents/dev-workflow.md, "commit".`)
    process.exit(1)
}
console.log(`no HTML-like tags in ${checked}`)
