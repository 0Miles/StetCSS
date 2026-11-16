import { describe, expect, test } from 'vitest'
import masterCSS from '../src/lib/vite.js'

describe('Svelte Vite integration', () => {
  test('includes the emittedGlobals virtual module from the wrapped Vite plugin', () => {
    expect(masterCSS().map((plugin) => plugin.name)).toContain('master-css:virtual-module:emitted-globals')
  })

  /**
   * Guards: `masterCSS()` with no options registers neither HTML pre-rendering nor runtime
   * injection, so a SvelteKit project gets static CSS only. If the wrapper set a default mode
   * again, SvelteKit pages would carry a runtime script the project never asked for.
   *
   * Reverse check: passing `mode: 'progressive'` from `src/lib/vite.ts` fails this test.
   */
  test('registers no pre-render or runtime injection plugin by default', () => {
    const names = masterCSS().map((plugin) => plugin.name)

    expect(names).not.toContain('master-css:pre-render')
    expect(names.filter((name) => name.startsWith('master-css:inject-runtime'))).toEqual([])
  })
})
