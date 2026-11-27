// Which PR title and commit lines hold HTML-like tags that break release notes.
//
// release-please builds the release PR notes from commit subjects and
// BREAKING CHANGE texts and parses them as HTML (node-html-parser). A
// tag-like `<style>` there swallows the packages' sections after it, and
// release-please then releases only some packages without failing (#279).
// Backticks do not help: the parser does not read Markdown. Plain body text
// does not reach the notes, so it is not checked; scanner and language
// tooling commits discuss `<style>` and `<script>` there.
// check-commit-text.mjs reads the commits and the title and calls this; it
// stays pure so the decision is tested without git or the GitHub API.

// `<`, an optional `/`, a tag name, then whitespace, `/`, `>` or the end of
// the line (a newline is whitespace in the notes). Tag name characters follow
// node-html-parser's tag pattern. An email such as `<dev@example.com>` does
// not match because `@` follows the name.
const TAG = /<(\/?)([A-Za-z][-.:\w]*)(?=[\s/>]|$)/g

// A footer starts with a token followed by `: ` or ` #` (Conventional
// Commits); a BREAKING CHANGE text runs until the next footer.
const BREAKING = /^BREAKING[ -]CHANGE: /
const FOOTER = /^(?:BREAKING CHANGE|[A-Za-z][\w-]*)(?:: | #)/

/** @param {string} body */
function breakingChangeLines(body) {
    const found = []
    let inBreaking = false
    body.split('\n').forEach((text, index) => {
        if (BREAKING.test(text)) inBreaking = true
        else if (FOOTER.test(text)) inBreaking = false
        if (inBreaking) found.push({ text, index })
    })
    return found
}

/**
 * Describe each element in words, the way the notes can carry it.
 *
 * @param {RegExpExecArray[]} tags matches of TAG in `line`
 * @param {string} line
 */
function suggest(tags, line) {
    return tags
        .map(({ 0: tag, 1: closing, 2: name, index }) => {
            // Show the tag as written up to its `>`, or the bare `<name` when attributes follow.
            const shown = tag + (line.slice(index + tag.length).match(/^\/?>/)?.[0] ?? '')
            return `${shown} as "${closing ? `closing ${name} tag` : `${name} element`}"`
        })
        .join(', ')
}

/**
 * @typedef {{ sha: string, subject: string, body: string }} Commit
 *   `subject` is the message's first line, `body` the text after the blank
 *   line that follows it (git's `%b`).
 * @typedef {{ sha: string | null, subject: string | null, place: 'title' | 'subject' | 'breaking-change', line: string, message: string }} Violation
 *   `sha` and `subject` are null for the PR title; `message` names the
 *   commit (short sha and subject) or the title, the line and the rewrite.
 *
 * @param {{ title?: string | null, commits: Iterable<Commit> }} input
 * @returns {Violation[]} PR title first, then commits in the given order, lines in message order
 */
export function findTagLikeText({ title, commits }) {
    const violations = []
    const flag = (line, place, commit, lineNumber) => {
        const tags = [...line.matchAll(TAG)]
        if (!tags.length) return
        const where = commit
            ? `commit ${commit.sha.slice(0, 9)} "${commit.subject}", ${place === 'subject' ? 'subject' : 'BREAKING CHANGE text'}, message line ${lineNumber}`
            : 'PR title'
        violations.push({
            sha: commit?.sha ?? null,
            subject: commit?.subject ?? null,
            place,
            line,
            message: `${where}:\n    ${line}\n  rewrite ${suggest(tags, line)}`,
        })
    }
    if (title) flag(title, 'title', null)
    for (const commit of commits) {
        flag(commit.subject, 'subject', commit, 1)
        // Line 2 is the blank line between the subject and the body.
        for (const { text, index } of breakingChangeLines(commit.body)) flag(text, 'breaking-change', commit, index + 3)
    }
    return violations
}
