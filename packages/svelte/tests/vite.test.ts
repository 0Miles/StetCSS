import { describe, expect, test } from 'vitest'
import masterCSS from '../src/lib/vite.js'

describe('Svelte Vite integration', () => {
  test('includes the emittedGlobals virtual module from the wrapped Vite plugin', () => {
    expect(masterCSS().map((plugin) => plugin.name)).toContain('master-css:virtual-module:emitted-globals')
  })
})
