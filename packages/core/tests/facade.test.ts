import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { layerOrder } from '@stet-css/engine'
import { expect, it } from 'vitest'
import { MasterCSS } from '../src'

it('@stet-css/core re-exports the manifest-driven engine facade', () => {
  const manifest = { version: 1 } as const
  const css = MasterCSS.create({ manifest })
  expect(css.manifest).toBe(manifest)
  expect(css.text).toBe('')
})

it('engine layerOrder matches the @layer statement base.css declares', () => {
  // The runtime orders its layer blocks by `layerOrder`; base.css is where AGENTS.md declares the order.
  const baseCSS = readFileSync(createRequire(import.meta.url).resolve('@stet-css/preset/base.css'), 'utf8')
  const statement = /@layer\s+([^;{]+);/.exec(baseCSS)?.[1]
  expect(statement?.split(',').map((name) => name.trim())).toEqual(layerOrder)
})
