// Fails when a file path or file text in the repo still uses the upstream product name
// "Master" (any case). StetCSS was renamed from Master CSS in #18; nothing has been published
// under the old names, so there are no compatibility aliases to keep.
//
// What may still say "master" is listed in ALLOWED below, each entry with the reason it stays.
// A hit passes only when an allowed span on the same line covers it, so an allowed word does
// not excuse the rest of its line. Add an entry only for an upstream reference, a third-party
// name, or a test that proves an old name is gone; rename everything else.
//
// Scans tracked files plus untracked files that are not ignored, so it also catches new files
// before they are committed. Run with `bun run check:naming`.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { root } from './published-packages.mjs'

const NAME = /master/gi

/** Files read as a whole by name, never scanned. */
const SKIPPED = [
  // Release history that release-please writes per package: entries quote commit subjects as
  // they were made, and history is not rewritten.
  /^packages\/[^/]+\/CHANGELOG\.md$/,
  // This check, which has to spell the name it looks for.
  /^scripts\/check-naming\.mjs$/,
]

/**
 * `pattern` is a span that may contain the name; `paths` (optional) limits the entry to files
 * whose path matches one of the expressions.
 */
const ALLOWED = [
  // --- Upstream references (#18 keeps them) ---
  {
    reason: 'links to the upstream repository and `master-co/css#<n>` issue references',
    // Stops at URL delimiters, so text glued to a link is still checked.
    pattern: /master-co\/css(?![\w-])(?:[/#][^\s)\]>"'`,]*)?/,
  },
  {
    reason: 'the fork note and licence attribution, and prose about the upstream project',
    pattern: /\[Master CSS\]\(https:\/\/github\.com\/master-co\/css\)|fork of Master CSS|code from Master CSS|upstream Master CSS\b/,
  },
  {
    reason: 'the docs-page CSS size suite measures the upstream Master CSS docs site: its page name, URLs and the measured style tag are data',
    paths: [/^benchmarks\/docs-page-css-size\//],
    pattern: /(["'])Master CSS\1|https:\/\/rc\.css\.master\.co[^\s"'`)]*|id=\\"master-css\\"/,
  },
  {
    reason: 'the runtime README names the `style#master-css` element that upstream builds render, as the stale element to remove (#92)',
    paths: [/^packages\/runtime\/README\.md$/],
    pattern: /`style#master-css`/,
  },

  // --- The removed `@master` at-rule (upstream syntax users migrate from; #63, #64) ---
  {
    reason: '`@master entry;` and `@master { … }` are rejected with a migration error, so tests, docs and messages name them',
    pattern: /@master(?![\w/-])/,
  },
  {
    reason: 'names of the helpers and the error code that reject the removed `@master` at-rule (#94 kept them)',
    pattern: /\b(?:findMasterAtRule|assertNoMasterAtRules|removedMasterAtRuleMessage|isRemovedMasterAtRuleError|REMOVED_MASTER_AT_RULE_ERROR_CODE)\b|'removed-master-at-rule'/,
  },
  {
    reason: 'the lexer locates `master` as a directive name so the compiler, stylesheet pipeline, Next loader, formatter and grammar tests can reject it',
    paths: [
      /^packages\/lexer\/src\/directive-ranges\.ts$/,
      /^packages\/lexer\/tests\/directive-ranges\.test\.ts$/,
      /^packages\/language\/src\/format-directives\.ts$/,
      /^packages\/next\/src\/index\.ts$/,
      /^packages\/next\/tests\/next-config\.test\.ts$/,
      /^packages\/next\/tests\/static\.test\.ts$/,
      /^packages\/stylesheet\/src\/index\.ts$/,
      /^packages\/stylesheet\/tests\/style\.test\.ts$/,
      /^packages\/vscode\/tests\/textmate-grammar\.test\.js$/,
    ],
    pattern: /(?<![\w.-])master(?![\w.-])/,
  },
  {
    reason: 'compiler test locals that hold the rejected `@master entry;` input (#94 kept them)',
    paths: [/^packages\/compiler\/tests\/entry\.test\.ts$/],
    pattern: /\bmaster(Source|Error)\b/,
  },

  // --- Tests that prove an old name is gone (each pattern only in its own test file) ---
  {
    reason: 'the language server ignores settings under the pre-rename `masterCSS` section and `masterCSS/*` methods',
    paths: [/^packages\/language-server\/tests\/settings-section\.test\.ts$/],
    pattern: /\bmasterCSS\b/,
  },
  {
    reason: 'the VS Code server bundle must not contain the pre-rename `masterCSS` settings key',
    paths: [/^packages\/vscode\/tests\/server-bundle\.test\.js$/],
    pattern: /'masterCSS'/,
  },
  {
    reason: 'the compiler must not name the pre-rename `master.css` placeholder file in diagnostics',
    paths: [/^packages\/compiler\/tests\/entry\.test\.ts$/],
    pattern: /'master\.css'|`master\.css`/,
  },
  {
    reason: 'the old `master-css` Shiki language id is no longer a class-list language',
    paths: [/^packages\/language\/tests\/shiki\.test\.ts$/],
    pattern: /'master-css'/,
  },
  {
    reason: 'ESLint rule ids and descriptions must not use the pre-rename `@master-css/` namespace or the old product name',
    paths: [/^packages\/eslint-plugin\/tests\/schema\.test\.ts$/],
    pattern: /`@master-css\/`|\/Master\/|'Sort Master CSS classes'/,
  },

  // --- Names this repo does not own ---
  {
    reason: 'the VS Code extension still uses the upstream Marketplace publisher `masterco`; it changes once a StetCSS publisher exists (human work, #93)',
    paths: [/^packages\/vscode\//],
    pattern: /\bmasterco\b/,
  },
  {
    reason: '`@master/styled.react` is a published third-party package that the ESLint example, the ESLint plugin tests and the language-service playground lint against',
    paths: [/^bun\.lock$/, /^examples\/eslint\//, /^packages\/eslint-plugin\/tests\//, /^packages\/language-service\/playground\//],
    pattern: /@master\/styled\.react/,
  },
  {
    reason: 'Composer metadata of third-party PHP packages (`dev-master` branch aliases, maintainer e-mail addresses)',
    paths: [/^examples\/laravel\/composer\.lock$/],
    pattern: /\bdev-master\b|\bwebmaster@[\w.-]+/,
  },
]

// Paths and allowlist expressions are relative to the repository root, wherever this runs from.
process.chdir(root)

function listFiles() {
  const output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  return [...new Set(output.split('\0').filter(Boolean))].sort()
}

/** Reads a text file, or returns undefined for a binary file or a tracked file deleted from the working tree. */
function readText(path) {
  let buffer
  try {
    buffer = readFileSync(path)
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  if (!buffer.subarray(0, 8000).includes(0)) return buffer.toString('utf8')
}

const allowed = ALLOWED.map(({ paths, pattern }) => ({ paths, pattern: new RegExp(pattern.source, `${pattern.flags}g`) }))

const problems = []
for (const path of listFiles()) {
  if (/master/i.test(path)) problems.push(`${path}: file path uses the old name`)
  if (SKIPPED.some((expression) => expression.test(path))) continue
  const text = readText(path)
  if (!text || !/master/i.test(text)) continue
  const rules = allowed.filter(({ paths }) => !paths || paths.some((expression) => expression.test(path)))
  const isCovered = (line, { index, 0: hit }) => rules.some(({ pattern }) =>
    [...line.matchAll(pattern)].some((span) => span.index <= index && index + hit.length <= span.index + span[0].length))
  text.split('\n').forEach((line, index) => {
    const hit = [...line.matchAll(NAME)].find((match) => !isCovered(line, match))
    if (hit) problems.push(`${path}:${index + 1}:${hit.index + 1}: ${line.trim().slice(0, 160)}`)
  })
}

if (problems.length) {
  console.error(`Found ${problems.length} use(s) of the old Master name. Rename them to Stet, or add a reasoned entry to ALLOWED in scripts/check-naming.mjs:\n`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
console.log('No Master naming outside the allowlist.')
