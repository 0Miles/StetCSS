/**
 * Guards the commit text check: release-please parses the release PR notes
 * as HTML, so a tag-like `<style>` in a PR title, a commit subject or a
 * BREAKING CHANGE text swallows the packages' sections after it and
 * release-please releases only some packages (#279). If findTagLikeText
 * stops flagging one of those places, such text reaches main and the next
 * release goes partial again; if it starts flagging plain body text or
 * emails, ordinary commits about the scanner or Co-Authored-By lines fail CI.
 *
 * Reverse check (docs/agents/testing.md, rule 5), one defect at a time in
 * commit-text.mjs, against `node --test scripts/*.test.mjs`:
 * - subject not flagged: the subject, details, unknown tag and closing tag
 *   tests go red (all four carry their tag in a subject);
 * - BREAKING regex never matching: both BREAKING CHANGE tests and the
 *   commit message test go red;
 * - every line ending the footer (`else inBreaking = false`): only the
 *   continuation line test goes red;
 * - BREAKING regex without `-`: only the BREAKING CHANGE footer test;
 * - TAG without the optional `/`: the closing tag and title message tests;
 * - TAG names limited to script, noscript, style, pre and details: only the
 *   unknown tag test;
 * - `@` added to the lookahead's characters: only the email test;
 * - every body line pushed as BREAKING CHANGE text: only the plain body test;
 * - title never flagged: the PR title and title message tests;
 * - the full sha in the message: only the commit message test;
 * - `${name}` instead of `${name} element`: both message tests.
 * The release-tags tests stayed green throughout.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findTagLikeText } from './commit-text.mjs'

const sha = '5ec801255f8916c155ab32da7c7a7915afbcc393'
const check = (commit, title = 'ci: check commit text') => findTagLikeText({ title, commits: [{ sha, ...commit }] })
const lines = (violations) => violations.map((violation) => violation.line)

test('rejects a tag in a commit subject', () => {
    assert.deepEqual(lines(check({ subject: 'fix(scanner): read classes inside <style> blocks', body: '' })), [
        'fix(scanner): read classes inside <style> blocks',
    ])
})

test('rejects a tag in a BREAKING CHANGE footer', () => {
    const body = 'Body.\n\nBREAKING CHANGE: the runtime\'s own <style> element id changes.\n\nRefs #92'
    assert.deepEqual(lines(check({ subject: 'feat(runtime)!: rename the id', body })), [
        'BREAKING CHANGE: the runtime\'s own <style> element id changes.',
    ])
    const hyphenated = 'BREAKING-CHANGE: drops <style> injection.'
    assert.deepEqual(lines(check({ subject: 'feat!: drop it', body: hyphenated })), [hyphenated])
})

test('rejects a tag on a continuation line of a BREAKING CHANGE footer', () => {
    const body = 'BREAKING CHANGE: the runtime no longer injects its own\nstyle element; add a <style> yourself.\n\nRefs #92'
    assert.deepEqual(lines(check({ subject: 'feat!: drop it', body })), ['style element; add a <style> yourself.'])
})

test('rejects a details tag', () => {
    assert.deepEqual(lines(check({ subject: 'docs: wrap the notes in <details>', body: '' })), [
        'docs: wrap the notes in <details>',
    ])
})

test('rejects an unknown tag such as a type argument', () => {
    assert.deepEqual(lines(check({ subject: 'fix(engine): accept Array<string> values', body: '' })), [
        'fix(engine): accept Array<string> values',
    ])
})

test('rejects a closing tag', () => {
    assert.deepEqual(lines(check({ subject: 'fix(scanner): stop at </style>', body: '' })), [
        'fix(scanner): stop at </style>',
    ])
})

test('rejects a tag in the PR title', () => {
    assert.deepEqual(lines(check({ subject: 'fix: fine', body: '' }, 'fix(scanner): read <script> blocks')), [
        'fix(scanner): read <script> blocks',
    ])
})

test('passes emails in the subject and footers', () => {
    const body = 'BREAKING CHANGE: report to <maintainer@example.com> now.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
    assert.deepEqual(check({ subject: 'fix: credit <dev.name@example.com>', body }), [])
})

test('passes tags in plain body text', () => {
    const body = 'The scanner now reads <style> and <script> blocks.\n\nBREAKING CHANGE: the runtime element id changes.\n\nRefs #92'
    assert.deepEqual(check({ subject: 'feat(scanner)!: read embedded blocks', body }), [])
})

test('names the commit, the line and the rewrite in the message', () => {
    const body = 'BREAKING CHANGE: the runtime\'s own <style> element id and its two\nglobal names change.'
    const [violation] = check({ subject: 'feat(runtime)!: rename the style element id', body })
    assert.equal(
        violation.message,
        'commit 5ec801255 "feat(runtime)!: rename the style element id", BREAKING CHANGE text, message line 3:\n'
            + '    BREAKING CHANGE: the runtime\'s own <style> element id and its two\n'
            + '  rewrite <style> as "style element"',
    )
})

test('labels the PR title and suggests a rewrite for every tag on the line', () => {
    const [violation] = check({ subject: 'fix: fine', body: '' }, 'fix(scanner): read <style> up to </style>')
    assert.equal(
        violation.message,
        'PR title:\n'
            + '    fix(scanner): read <style> up to </style>\n'
            + '  rewrite <style> as "style element", </style> as "closing style tag"',
    )
})
