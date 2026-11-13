import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { findCSSManifestEntryFiles } from '../src/entries'
import { findProjectSourceFiles, isProjectSourceFile } from '../src/sources'

const roots: string[] = []

function createProject(files: string[]) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-project-sources-'))
  roots.push(root)
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), file.endsWith('.css') ? '@import "@stet-css/core";' : '<div class="block"></div>')
  }
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

const sourceFiles = [
  'index.html',
  'src/pages/index.astro',
  'src/components/Card.svelte',
  'src/components/Panel.vue',
  'src/app.tsx',
  'docs/guide.md',
  'public/pages/about.html',
  '.vitepress/theme/Layout.vue'
]

const nonSourceFiles = [
  'node_modules/ui-kit/index.js',
  'packages/app/node_modules/ui-kit/index.js',
  'dist/index.html',
  'build/index.html',
  'out/index.html',
  'vendor/laravel/framework/welcome.php',
  '.git/hooks/post-merge.js',
  '.next/server/page.js',
  '.nuxt/app.js',
  '.output/public/index.html',
  '.svelte-kit/generated/root.js',
  '.astro/content.d.ts',
  '.vitepress/cache/deps/vue.js',
  'src/app.test.tsx',
  'src/env.d.ts',
  'README.md',
  'src/styles.css',
  'src/data.json'
]

/**
 * Guards which files count as the user's own sources, the base of the static class set.
 * Breaks when a build output, dependency or cache directory is scanned (stale or foreign
 * classes reach the CSS) or when a real template is skipped (its classes lose their rules).
 * Lists and the single-path check are asserted on the same tree so a watcher and a full
 * build cannot disagree about one file.
 * Reverse check: dropping the `.d.ts` file rule in `src/sources.ts` turns only this test red.
 */
test('lists project source files outside dependency, build output and cache directories', async () => {
  const root = createProject([...sourceFiles, ...nonSourceFiles])

  await expect(findProjectSourceFiles(root)).resolves.toStrictEqual(
    sourceFiles.map((file) => join(root, file)).sort()
  )
  for (const file of sourceFiles) {
    expect(isProjectSourceFile(join(root, file), root), file).toBe(true)
  }
  for (const file of nonSourceFiles) {
    expect(isProjectSourceFile(join(root, file), root), file).toBe(false)
  }
  expect(isProjectSourceFile(join(dirname(root), 'outside.html'), root)).toBe(false)
})

/**
 * Guards that symlinked source files and directories are read like regular ones, as the
 * CLI's glob read them before: a component shared into the project through a symlink must
 * keep its classes, and the single-path check must agree with the listing. A symlink back to
 * an ancestor must not make the walk loop.
 * Reverse check: treating every symlink as neither file nor directory turns only this test red.
 */
test('follows symlinked source files and directories without looping', async () => {
  const root = createProject(['src/app.tsx'])
  const outside = createProject(['Shared.vue', 'kit/Inner.vue'])
  symlinkSync(join(outside, 'Shared.vue'), join(root, 'src/Shared.vue'))
  symlinkSync(join(outside, 'kit'), join(root, 'src/kit'), 'dir')
  symlinkSync(root, join(root, 'src/loop'), 'dir')

  const files = await findProjectSourceFiles(root)

  expect(files).toStrictEqual([
    join(root, 'src/Shared.vue'),
    join(root, 'src/app.tsx'),
    join(root, 'src/kit/Inner.vue')
  ])
  expect(isProjectSourceFile(join(root, 'src/Shared.vue'), root)).toBe(true)
  expect(isProjectSourceFile(join(root, 'src/kit/Inner.vue'), root)).toBe(true)
})

/**
 * Guards that entry discovery skips the same directories as source discovery, so a CSS file
 * copied into a build output is never registered as a second entry.
 * Reverse check: making entry discovery skip only `node_modules` turns only this test red.
 */
test('finds CSS entries outside the same ignored directories', async () => {
  const root = createProject([
    'src/index.css',
    'build/assets/index.css',
    '.output/public/index.css',
    '.astro/index.css',
    'public/index.css'
  ])

  await expect(findCSSManifestEntryFiles(root)).resolves.toStrictEqual([
    join(root, 'public/index.css'),
    join(root, 'src/index.css')
  ])
})
