import { describe, expect, test } from 'vitest'
import { getClassPositions, languageSettings, type LanguageSettings } from '../../src'
import createDoc, { languageIdOfExt } from '../helpers/create-doc'

/**
 * Fault: cva variant names under `compoundVariants` and `defaultVariants` were read as class
 * positions, so `stetcss lint --fix` and ESLint's MDX path sorted `'primary danger'` into
 * `'danger primary'`, changing which variant applies. Both scans, oxc for script documents and the
 * regex fallback for markup, must read nothing inside an ignored key.
 *
 * Reverse check: dropping the ignored-key skip from collectOxcClassStrings turns the oxc cases red;
 * dropping the isIgnored skip from the regex scan turns the regex cases red.
 */
const settings: LanguageSettings = { ...languageSettings, ignoredKeys: ['compoundVariants', 'defaultVariants'] }

// The regex scan finds a class function only after whitespace or `.`.
const wrap = (ext: keyof typeof languageIdOfExt, code: string) => ext === 'html'
  ? `<script>\nconst button = ${code}\n</script>`
  : `const button = ${code}`

const tokensOf = (ext: keyof typeof languageIdOfExt, code: string, provider: 'oxc' | 'regex', positionSettings: LanguageSettings = settings) =>
  getClassPositions(createDoc(ext, wrap(ext, code)), positionSettings, { provider }).map((position) => position.token)

const cases: [string, string][] = [
  ['identifier keys', `cva('inline-flex', { variants: { intent: { primary: 'bg:blue' } }, compoundVariants: [{ intent: 'primary danger', class: 'uppercase' }], defaultVariants: { intent: 'primary danger' } })`],
  ['quoted keys', `cva('inline-flex', { 'defaultVariants': { intent: 'primary danger' }, "compoundVariants": [{ intent: 'primary' }], variants: { intent: { primary: 'bg:blue' } } })`],
  ['computed string keys', `cva('inline-flex', { ['defaultVariants']: { intent: 'primary danger' }, variants: { intent: { primary: 'bg:blue' } } })`]
]

describe.each([['oxc', 'tsx'], ['regex', 'html']] as const)('%s scan', (provider, ext) => {
  test.each(cases)('skips %s', (_, code) => {
    expect(tokensOf(ext, code, provider)).toEqual(['inline-flex', 'bg:blue'])
  })

  test('reads every key without ignoredKeys', () => {
    const code = `cva('inline-flex', { defaultVariants: { intent: 'primary' } })`
    expect(tokensOf(ext, code, provider, languageSettings)).toEqual(['inline-flex', 'primary'])
  })
})
