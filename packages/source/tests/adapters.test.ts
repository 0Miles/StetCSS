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
