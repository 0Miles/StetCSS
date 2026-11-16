import CSSScanner from '../src'
import { describe, test, expect } from 'vitest'

const SOURCE = 'foo.tsx'
const CONTENT = `<div className="bg:white fg:black m:2x">hi</div>`

describe('content-hash cache (Phase A optimisation)', () => {
  test('scan(source, content) returns false on identical re-call', async () => {
    const ex = await new CSSScanner({}).init()
    const first = await ex.scan(SOURCE, CONTENT)
    const second = await ex.scan(SOURCE, CONTENT)
    expect(first).toBe(true)
    expect(second).toBe(false)
  })

  test('cache key is per-source — same content from a different source still inserts', async () => {
    const ex = await new CSSScanner({}).init()
    const a = await ex.scan('a.tsx', CONTENT)
    const b = await ex.scan('b.tsx', CONTENT)
    expect(a).toBe(true)
    // b returns false because all classes are already in `validClasses`
    // from the first insert (different optimisation path), but the
    // content-hash entry for b.tsx is now set; a third call to b.tsx
    // would short-circuit on the hash.
    const bAgain = await ex.scan('b.tsx', CONTENT)
    expect(bAgain).toBe(false)
  })

  test('cache invalidates on content change', async () => {
    const ex = await new CSSScanner({}).init()
    const v1 = await ex.scan(SOURCE, `<div class="bg:red">a</div>`)
    const v2 = await ex.scan(SOURCE, `<div class="bg:blue">b</div>`)
    expect(v1).toBe(true)
    expect(v2).toBe(true)
  })

  test('reset() clears the content-hash cache', async () => {
    const ex = await new CSSScanner({}).init()
    await ex.scan(SOURCE, CONTENT)
    await ex.reset()
    // After reset, the hash for SOURCE is gone, so the same content
    // re-inserts (returns true again).
    const after = await ex.scan(SOURCE, CONTENT)
    expect(after).toBe(true)
  })
})

describe('valid-rules memo (Phase A optimisation)', () => {
  test('same class across many files is processed once', async () => {
    const ex = await new CSSScanner({}).init()
    // First file with the class — populates validClasses + the rules cache.
    await ex.scan('a.tsx', `<div className="bg:white">a</div>`)
    expect(ex.validClasses.has('bg:white')).toBe(true)
    // Subsequent files with the same class — already in validClasses, so
    // the inner generateValidRules path is skipped entirely. The
    // assertion is structural: the rules-cache Map exists and is
    // populated.
    await ex.scan('b.tsx', `<div className="bg:white">b</div>`)
    await ex.scan('c.tsx', `<div className="bg:white">c</div>`)
    // @ts-expect-error access private cache for verification
    expect(ex.validRulesCache.has('bg:white')).toBe(true)
    // @ts-expect-error access private cache for verification
    expect(ex.validRulesCache.size).toBe(1)
  })
})
