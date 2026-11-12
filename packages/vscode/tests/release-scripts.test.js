import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { createVSCEPublishArgs } from '../scripts/package-target-core.js'
import { parseCLIArgs } from '../scripts/package-targets.js'
import { newStatusLines, unexpectedReleaseStatusLines } from '../scripts/release.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const hidePackagesPreload = pathToFileURL(resolve(here, 'fixtures/hide-packages.js')).href

test('publish accepts Azure credential authentication', () => {
  const options = parseCLIArgs(['publish', '--azure-credential', '--target', 'linux-x64'])

  expect(options).toMatchObject({
    command: 'publish',
    azureCredential: true,
    packageArgs: [],
    targets: ['linux-x64']
  })
  expect(createVSCEPublishArgs('/tmp/master-css-vscode.vsix', options)).toEqual([
    'publish',
    '--packagePath',
    '/tmp/master-css-vscode.vsix',
    '--azure-credential'
  ])
})

test('package rejects Azure credential authentication', () => {
  expect(() => parseCLIArgs(['package', '--azure-credential']))
    .toThrow('--azure-credential is only supported for publish')
})

test('package accepts publisher override for staged VSIX manifests', () => {
  const options = parseCLIArgs(['package', '--publisher', 'master', '--out-dir', 'open-vsx', '--target', 'darwin-arm64'])

  expect(options).toMatchObject({
    command: 'package',
    publisher: 'master',
    packageArgs: [],
    targets: ['darwin-arm64']
  })
  expect(options.outDir).toBe(resolve(packageDir, 'open-vsx'))
})

test('release dry run reports Azure credential authentication', () => {
  const result = spawnSync(process.execPath, ['scripts/release.js', '--', '--dry-run', '--azure-credential'], {
    cwd: packageDir,
    encoding: 'utf8'
  })

  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
  expect(result.stdout).toContain('Authentication: Microsoft Entra ID')
})

test('release stops before running any command when a target lacks its native packages', () => {
  const hiddenPackages = ['lightningcss-win32-x64-msvc', '@oxc-parser/binding-win32-x64-msvc']
  const result = spawnSync(process.execPath, [
    '--import',
    hidePackagesPreload,
    'scripts/release.js',
    '--no-publish',
    '--target',
    'win32-x64'
  ], {
    cwd: packageDir,
    encoding: 'utf8',
    // An empty PATH means a regression cannot reach bun or git and change the repo.
    env: { ...process.env, PATH: '', HIDDEN_PACKAGES: hiddenPackages.join(',') }
  })

  expect(result.status).toBe(1)
  expect(result.stdout).not.toContain('$ ')
  for (const packageName of hiddenPackages) {
    expect(result.stderr).toContain(packageName)
  }
  expect(result.stderr).toContain(
    'bun install --os=win32 --os=darwin --os=linux --cpu=x64 --cpu=arm64 --cpu=arm --libc=glibc --libc=musl'
  )
})

test('packaging a target without its native packages names the Bun install command', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'master-css-vscode-out-'))
  try {
    const result = spawnSync(process.execPath, [
      '--import',
      hidePackagesPreload,
      'scripts/package-targets.js',
      'package',
      '--target',
      'win32-x64',
      '--out-dir',
      outDir
    ], {
      cwd: packageDir,
      encoding: 'utf8',
      env: { ...process.env, HIDDEN_PACKAGES: 'lightningcss-win32-x64-msvc' }
    })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Unable to resolve lightningcss-win32-x64-msvc')
    expect(result.stderr).toContain(
      'bun install --os=win32 --os=darwin --os=linux --cpu=x64 --cpu=arm64 --cpu=arm --libc=glibc --libc=musl'
    )
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})

test('release status guard ignores pre-existing dirty paths', () => {
  const baseline = [
    ' M packages/language/package.json',
    '?? local-notes.md'
  ]
  const current = [
    ...baseline,
    ' M packages/vscode/package.json',
    ' M bun.lock'
  ]

  expect(newStatusLines(current, baseline)).toEqual([
    ' M packages/vscode/package.json',
    ' M bun.lock'
  ])
  expect(unexpectedReleaseStatusLines(current, baseline)).toEqual([])
})

test('release status guard rejects newly dirty unexpected paths', () => {
  const baseline = [
    ' M packages/language/package.json'
  ]
  const current = [
    ...baseline,
    ' M packages/vscode/package.json',
    ' M bun.lock',
    ' M packages/vscode/data/generated.json'
  ]

  expect(unexpectedReleaseStatusLines(current, baseline)).toEqual([
    ' M packages/vscode/data/generated.json'
  ])
})
