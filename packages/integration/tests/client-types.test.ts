import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, it } from 'vitest'

const require = createRequire(import.meta.url)
const tscPath = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc')

describe('@stet-css/integration/client', () => {
  it('provides types for Master CSS integration virtual modules', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-integration-client-'))

    try {
      const cssPackageDir = path.join(root, 'node_modules', '@stet-css', 'core')
      const enginePackageDir = path.join(root, 'node_modules', '@stet-css', 'engine')
      const integrationPackageDir = path.join(root, 'node_modules', '@stet-css', 'integration')
      const sourceDir = path.join(root, 'src')

      mkdirSync(cssPackageDir, { recursive: true })
      mkdirSync(enginePackageDir, { recursive: true })
      mkdirSync(integrationPackageDir, { recursive: true })
      mkdirSync(sourceDir, { recursive: true })

      writeFileSync(
        path.join(cssPackageDir, 'package.json'),
        JSON.stringify({
          name: '@stet-css/core',
          types: './index.d.ts',
          exports: {
            '.': {
              types: './index.d.ts'
            },
            './emitted-globals': {
              types: './emitted-globals.d.ts'
            }
          }
        })
      )
      writeFileSync(
        path.join(cssPackageDir, 'index.d.ts'),
        'export type * from \'./emitted-globals\'\n'
      )
      writeFileSync(
        path.join(cssPackageDir, 'emitted-globals.d.ts'),
        'export interface MasterCSSEmittedGlobals { variables?: Record<string, number>; animations?: Record<string, number> }\n'
      )
      writeFileSync(
        path.join(enginePackageDir, 'package.json'),
        JSON.stringify({
          name: '@stet-css/engine',
          types: './index.d.ts',
          exports: {
            '.': {
              types: './index.d.ts'
            }
          }
        })
      )
      writeFileSync(
        path.join(enginePackageDir, 'index.d.ts'),
        [
          'export interface MasterCSSManifest { version: 1 }',
          'export interface MasterCSSEmittedGlobals { variables?: Record<string, number>; animations?: Record<string, number> }',
          ''
        ].join('\n')
      )
      writeFileSync(
        path.join(integrationPackageDir, 'package.json'),
        JSON.stringify({
          name: '@stet-css/integration',
          exports: {
            './client': {
              types: './client.d.ts'
            }
          }
        })
      )
      writeFileSync(
        path.join(integrationPackageDir, 'client.d.ts'),
        readFileSync(path.resolve(__dirname, '../client.d.ts'), 'utf8')
      )
      writeFileSync(
        path.join(sourceDir, 'main.ts'),
        `
/// <reference types="@stet-css/integration/client" />

import 'virtual:master-utilities.css'
import virtualManifest from 'virtual:master-css-manifest'
import virtualEmittedGlobals from 'virtual:master-css-emitted-globals'
import localManifest from './app.css?master-css-manifest'

virtualManifest satisfies import('@stet-css/engine').MasterCSSManifest
virtualEmittedGlobals satisfies import('@stet-css/core/emitted-globals').MasterCSSEmittedGlobals
localManifest satisfies import('@stet-css/engine').MasterCSSManifest
`.trimStart()
      )
      writeFileSync(
        path.join(root, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            noEmit: true
          },
          include: ['src']
        })
      )

      execFileSync(process.execPath, [tscPath, '-p', root, '--pretty', 'false'], {
        cwd: root,
        stdio: 'pipe'
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
