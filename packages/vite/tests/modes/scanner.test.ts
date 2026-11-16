import { beforeEach, describe, expect, test, vi } from 'vitest'
import ScannerPlugin from '../../src/plugins/scanner'

vi.mock('@stet-css/scanner', () => {
  return {
    default: class {
      options: any = {}
      constructor(opts: any, _root?: string) {
        if (typeof opts === 'object' && opts !== null) {
          this.options = { ...opts }
        }
      }
      async init() { return this }
    },
  }
})

function findPlugin(plugins: any[], name: string) {
  const p = plugins.find((x) => x?.name === name)
  if (!p) throw new Error(`plugin "${name}" not registered`)
  return p
}

const fakeViteConfig = { root: '/proj' } as any

describe('shared scanner plugins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('does not mutate source discovery options', async () => {
    const ctx: any = {}
    const pluginOptions = { scanner: { exclude: ['src/generated/**'] } } as any
    const plugins = [ScannerPlugin(pluginOptions, ctx)]

    await findPlugin(plugins, 'master-css:scanner').configResolved.call({}, fakeViteConfig)

    expect(ctx.scanner.options).toEqual({
      exclude: ['src/generated/**'],
      verbose: 0
    })
  })
})
