import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  extractAstroClasses,
  extractHTMLClasses,
  extractClassCandidates,
  extractOxcClasses,
  extractSvelteClasses,
  extractVueClasses,
  matchesSourceAdapter,
  type SourceAdapter
} from '../src'
import {
  resetOptionalPeerStateForTest,
  setOptionalPeerImporterForTest
} from '../src/adapters/optional-peer'

afterEach(() => {
  resetOptionalPeerStateForTest()
  vi.restoreAllMocks()
})

describe('source adapters', () => {
  test('exports class candidate extraction', () => {
    expect(extractClassCandidates('<div class="block mx:auto"></div>')).toEqual(['block', 'mx:auto'])
  })

  test('extracts static classes from JavaScript and TypeScript syntax with Oxc', () => {
    expect(extractOxcClasses('component.tsx', `
      const classes = 'block mx:auto'
      const active = clsx('fg:red', { 'p:1rem': ok })
      element.classList.add('flex')
      export function App() {
        return <div className="hidden m:0.5rem" />
      }
    `)).toEqual([
      'block',
      'mx:auto',
      'fg:red',
      'p:1rem',
      'flex',
      'hidden',
      'm:0.5rem'
    ])
  })

  test('ignores module specifiers, require calls, dynamic imports, and common directives with Oxc', () => {
    expect(extractOxcClasses('component.tsx', `
      'use client'
      import React from 'react'
      export { helper } from 'pkg'
      await import('lazy-module')
      const fs = require('fs')
      const classes = 'block fg:red'
    `)).toEqual([
      'block',
      'fg:red'
    ])
  })

  /**
   * Guards: `.js`, `.mjs` and `.cjs` files often hold JSX. Parsed as plain JS,
   * the JSX fails, extraction falls back to text, and the identifier `hidden`
   * becomes a class that emits `.hidden{display:none}`. Reverse check: dropping
   * the `jsx` language for these extensions in `src/adapters/oxc.ts` turns
   * this test red.
   */
  test.each(['component.js', 'component.mjs', 'component.cjs', 'component.js?v=1'])('parses JSX in %s instead of falling back to text extraction', (source) => {
    expect(extractOxcClasses(source, `
      const hidden = isHidden()
      export const App = () => <div className="block fg:red" hidden={hidden} />
    `)).toEqual([
      'block',
      'fg:red'
    ])
  })

  /**
   * Locks: HTML `<script>` blocks parse under a synthetic `.js` name, which
   * enables JSX, so an in-browser Babel script holding JSX parses instead of
   * leaking `hidden` as a class, and plain scripts with comparisons and
   * HTML-like comments still parse. Reverse check: limiting JSX to real file
   * names in `src/adapters/oxc.ts` turns this test red.
   */
  test('parses HTML scripts as JavaScript with JSX', () => {
    expect(extractHTMLClasses('index.html', `
      <script type="text/babel">
        const hidden = isHidden()
        ReactDOM.render(<div className="block" hidden={hidden} />, root)
      </script>
      <script>
        <!--
        if (a < b && c > d) element.classList.add('fg:red')
        //-->
      </script>
    `)).toEqual([
      'block',
      'fg:red'
    ])
  })

  test('extracts class attributes and script strings from HTML', () => {
    expect(extractHTMLClasses('index.html', `
      <div class="block mx:auto"></div>
      <script>
        element.classList.add('fg:red', 'p:1rem')
        const classes = 'flex hidden'
      </script>
    `)).toEqual([
      'block',
      'mx:auto',
      'fg:red',
      'p:1rem',
      'flex',
      'hidden'
    ])
  })

  test('does not load optional framework parsers for barrel-only helpers', () => {
    const importer = vi.fn(async () => ({}))
    setOptionalPeerImporterForTest(importer)

    expect(extractClassCandidates('<div class="block"></div>')).toEqual(['block'])
    expect(importer).not.toHaveBeenCalled()
  })

  test('extracts template, script, and script setup classes from Vue SFCs', async () => {
    await expect(extractVueClasses('App.vue', `
      <template>
        <button class="block mx:auto">Save</button>
      </template>
      <script>
        const rootClasses = 'fg:red'
      </script>
      <script setup lang="ts">
        const setupClasses = 'p:1rem'
      </script>
    `)).resolves.toEqual([
      'block',
      'mx:auto',
      'fg:red',
      'p:1rem'
    ])
  })

  test('extracts markup, module script, instance script, and class directive classes from Svelte files', async () => {
    await expect(extractSvelteClasses('Component.svelte', `
      <script context="module">
        const moduleClasses = 'fg:red'
      </script>
      <script>
        const instanceClasses = 'p:1rem'
        let enabled = true
      </script>
      <button class="block mx:auto" class:active={enabled}>Save</button>
    `)).resolves.toEqual([
      'fg:red',
      'p:1rem',
      'block',
      'mx:auto',
      'active'
    ])
  })

  /**
   * Guards: the Svelte AST keeps `{:else}`, `{:else if}`, each-block `{:else}`
   * and the `{#await}` pending, `{:then}` and `{:catch}` branches outside
   * `children`, so a walk over `children` alone drops every class in them and
   * those elements render unstyled. Reverse check: dropping any one of
   * `else`, `pending`, `then` or `catch` from the branch walk in
   * `src/adapters/svelte.ts` turns only this test red.
   */
  test('extracts classes from every Svelte block branch, not only the first', async () => {
    await expect(extractSvelteClasses('Component.svelte', `
      {#if a}<div class="p:1px"></div>{:else if b}<div class="p:2px"></div>{:else}<div class="p:3px"></div>{/if}
      {#each items as item}<i class="p:4px"></i>{:else}<i class="p:5px"></i>{/each}
      {#await p}<i class="p:6px"></i>{:then v}<i class="p:7px"></i>{:catch e}<i class="p:8px"></i>{/await}
    `)).resolves.toEqual([
      'p:1px',
      'p:2px',
      'p:3px',
      'p:4px',
      'p:5px',
      'p:6px',
      'p:7px',
      'p:8px'
    ])
  })

  /**
   * Guards: a `<script lang="ts">` with type annotations does not parse as JS,
   * so extraction fell back to text and the identifier `hidden` emitted
   * `.hidden{display:none}`. Reverse check: parsing Svelte scripts as `.js`
   * again in `src/adapters/svelte.ts` turns this test red.
   */
  test('parses Svelte scripts and markup expressions in the language their lang attribute names', async () => {
    await expect(extractSvelteClasses('Component.svelte', `
      <script context="module" lang="ts">
        export const size: string = 'p:1rem'
      </script>
      <script lang="ts">
        let hidden: boolean = false
        const classes: string = 'fg:red'
      </script>
      <div class="block {hidden as boolean ? 'm:0' : 'm:1'}">Save</div>
    `)).resolves.toEqual([
      'p:1rem',
      'fg:red',
      'block',
      'm:0',
      'm:1'
    ])
  })

  /**
   * Guards: Svelte treats the whole component as TypeScript when any of its
   * scripts has `lang="ts"`, so an untyped script beside a typed one may hold
   * type annotations too. Deciding per script parses that script as JS, which
   * fails and leaks `const`, `hidden` and `boolean` as classes. Reverse check:
   * choosing the language per script in `src/adapters/svelte.ts` turns this
   * test red.
   */
  test.each([
    ['module', '<script context="module" lang="ts">', '<script>'],
    ['instance', '<script context="module">', '<script lang="ts">']
  ])('parses every Svelte script as TypeScript when the %s script names lang="ts"', async (_, moduleTag, instanceTag) => {
    await expect(extractSvelteClasses('Component.svelte', `
      ${moduleTag}
        export const size: string = 'p:1rem'
      </script>
      ${instanceTag}
        const hidden: boolean = isHidden()
        const classes = 'fg:red'
      </script>
      <div class="block">Save</div>
    `)).resolves.toEqual([
      'p:1rem',
      'fg:red',
      'block'
    ])
  })

  /**
   * Guards: Astro processes every `<script>` but `is:inline` ones as
   * TypeScript, so a `<HTMLElement>` cast is valid there; parsed as JS it
   * failed, extraction fell back to text, and the identifier `block` emitted
   * `.block{display:block}`. Reverse check: parsing Astro scripts as `.js`
   * again in `src/adapters/astro.ts` turns this test red.
   */
  test('parses Astro scripts as TypeScript', () => {
    expect(extractAstroClasses('Page.astro', `<main class="mx:auto"></main>
<script>
  const block = <HTMLElement>document.body.firstElementChild
  block.classList.add('fg:red')
</script>
    `)).toEqual([
      'fg:red',
      'mx:auto'
    ])
  })

  /**
   * Guards: the Astro compiler opens the frontmatter after a BOM or blank
   * lines, allows spaces after either fence, closes it at a `---` that starts
   * a line outside strings, template literals and comments, and lets that fence
   * end the file or run into markup. Splitting anywhere else turned the script
   * into markup, so identifiers such as `flex` and `block` emitted
   * `.flex{display:flex}` and `.block{display:block}`. Reverse check: requiring
   * an exact `\n---\n` closing fence again in `src/adapters/astro.ts` turns
   * every case but CRLF red; CRLF locks the line ending the old split already
   * accepted.
   */
  test.each([
    ['follows a BOM', `\uFEFF---\nconst { flex } = Astro.props\nconst size = 'p:1px'\n---\n<div class="p:2px"></div>`, ['p:1px', 'p:2px']],
    ['follows blank lines', `\n\n---\nconst { flex } = Astro.props\nconst size = 'p:1px'\n---\n<div class="p:2px"></div>`, ['p:1px', 'p:2px']],
    ['has trailing spaces on its fences', `--- \nconst { flex } = Astro.props\nconst size = 'p:1px'\n---\t \n<div class="p:2px"></div>`, ['p:1px', 'p:2px']],
    ['uses CRLF line endings', `---\r\nconst { flex } = Astro.props\r\nconst size = 'p:1px'\r\n---\r\n<div class="p:2px"></div>`, ['p:1px', 'p:2px']],
    ['closes on markup on the same line', `---\nconst { flex } = Astro.props\nconst size = 'p:1px'\n---<div class="p:2px"></div>`, ['p:1px', 'p:2px']],
    ['holds --- in a template literal', `---\nconst { flex } = Astro.props\nconst size = \`p:1px\n---\n\`\n---\n<div class="p:2px"></div>`, ['p:1px', '---', 'p:2px']],
    ['holds --- in a block comment', `---\nconst { flex } = Astro.props\n/*\n---\n*/\nconst size = 'p:1px'\n---\n<div class="p:2px"></div>`, ['p:1px', 'p:2px']]
  ])('splits Astro frontmatter that %s as the Astro compiler does', (_, content, expected) => {
    expect(extractAstroClasses('Page.astro', content)).toEqual(expected)
  })

  /**
   * Guards: a closing fence with no line break after it, at the end of the
   * file, was taken as unclosed, so the whole script became markup. Reverse
   * check: requiring a line break after the closing fence turns this red.
   */
  test('closes Astro frontmatter on a fence that ends the file', () => {
    expect(extractAstroClasses('Page.astro', `---\nconst { flex } = Astro.props\nconst size = 'p:1px'\n---`)).toEqual(['p:1px'])
    expect(extractAstroClasses('Empty.astro', '---\n---')).toEqual([])
  })

  test('extracts frontmatter, script, and markup classes from Astro files while ignoring styles', () => {
    expect(extractAstroClasses('Page.astro', `---
const frontmatterClasses = 'fg:red'
---
<script>
  const scriptClasses = 'p:1rem'
</script>
<style>
  .ignored { color: red; }
</style>
<main class="block mx:auto">Hello</main>
    `)).toEqual([
      'fg:red',
      'p:1rem',
      'block',
      'mx:auto'
    ])
  })

  test('warns once per peer and falls back to text extraction when an optional framework parser is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setOptionalPeerImporterForTest(async () => {
      throw new Error('missing peer')
    })

    await expect(extractVueClasses('App.vue', '<template><div class="block"></div></template>'))
      .resolves
      .toEqual(['block'])
    await expect(extractVueClasses('Other.vue', '<template><div class="fg:red"></div></template>'))
      .resolves
      .toEqual(['fg:red'])
    await expect(extractSvelteClasses('Component.svelte', '<div class="p:1rem"></div>'))
      .resolves
      .toEqual(['p:1rem'])
    await expect(extractSvelteClasses('Other.svelte', '<div class="mx:auto"></div>'))
      .resolves
      .toEqual(['mx:auto'])

    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0]?.[0]).toContain('Optional Vue SFC parser "vue/compiler-sfc" could not be loaded')
    expect(warn.mock.calls[1]?.[0]).toContain('Optional Svelte parser "svelte/compiler" could not be loaded')
  })

  test('matches adapters with global regular expressions consistently', () => {
    const adapter: SourceAdapter = {
      name: 'global-regexp',
      test: /\.txt$/g,
      extract: async () => []
    }

    expect(matchesSourceAdapter(adapter, 'a.txt')).toBe(true)
    expect(matchesSourceAdapter(adapter, 'b.txt')).toBe(true)
  })
})
