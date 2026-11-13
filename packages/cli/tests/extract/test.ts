import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs, { readFileSync } from 'fs'
import os from 'node:os'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { it, expect } from 'vitest'

const cliFilepath = resolve(__dirname, '../../src/bin/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

it('basic extract', async () => {
  const cwd = fs.mkdtempSync(join(os.tmpdir(), 'master-css-cli-extract-'))
  try {
    fs.writeFileSync(join(cwd, 'a.html'), '<h1 class="bg:primary fg:primary">Hello World</h1>', { flag: 'w' })
    fs.writeFileSync(join(cwd, 'b.html'), '<h1 class="m:12x text-center font:sans font:heavy font:48px">Hello World</h1>', { flag: 'w' })
    fs.writeFileSync(join(cwd, 'main.css'), `
      @import "@stet-css/core";
      @theme {
        --color-primary: var(--blue);
      }
    `, { flag: 'w' })
    execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath], { cwd })
    expect(readFileSync(join(cwd, 'master.css')).toString()).toMatch(/(fg\\:primary|m\\:12x|text-center|font\\:sans|font\\:heavy|font\\:48px)/)
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
})

/**
 * Guards that the CLI writes the stylesheet's class set: project files outside build
 * output, minus the entry's `@source not` files. A CLI that read its own glob would ship
 * classes from a stale `build/`; one that scanned files itself would also ship the classes
 * the entry excluded.
 * Reverse check: having the CLI pass its old default glob as `sources` turns only this test red.
 */
it('writes the class set of the project files and the entry directives', async () => {
  const cwd = fs.mkdtempSync(join(os.tmpdir(), 'master-css-cli-class-set-'))
  try {
    fs.mkdirSync(join(cwd, 'src/legacy'), { recursive: true })
    fs.mkdirSync(join(cwd, 'build'), { recursive: true })
    fs.writeFileSync(join(cwd, 'src/page.astro'), '<h1 class="font:heavy">Hello</h1>')
    fs.writeFileSync(join(cwd, 'src/legacy/page.html'), '<h1 class="m:4x">Hello</h1>')
    fs.writeFileSync(join(cwd, 'build/index.html'), '<h1 class="p:2x">Hello</h1>')
    fs.writeFileSync(join(cwd, 'src/main.css'), `
      @import "@stet-css/core";
      @source not './legacy';
    `)
    execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath], { cwd })
    const css = readFileSync(join(cwd, 'master.css')).toString()
    expect(css).toContain('.font\\:heavy{')
    expect(css).not.toContain('.m\\:4x{')
    expect(css).not.toContain('.p\\:2x{')
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
})

/**
 * Guards that source path arguments replace the project files instead of adding to them,
 * so `cli index.html` emits CSS for that page only.
 * Reverse check: having the CLI ignore its source path arguments turns only this test red.
 */
it('reads only the files named by source path arguments', async () => {
  const cwd = fs.mkdtempSync(join(os.tmpdir(), 'master-css-cli-sources-'))
  try {
    fs.writeFileSync(join(cwd, 'a.html'), '<h1 class="font:heavy">Hello</h1>')
    fs.writeFileSync(join(cwd, 'b.html'), '<h1 class="m:4x">Hello</h1>')
    const output = execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, 'a.html', '--no-export'], {
      cwd,
      encoding: 'utf8'
    })
    expect(output).toContain('.font\\:heavy{')
    expect(output).not.toContain('.m\\:4x{')
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
})

it('prints CSS without exporting', async () => {
  const cwd = fs.mkdtempSync(join(os.tmpdir(), 'master-css-cli-no-export-'))
  try {
    fs.writeFileSync(join(cwd, 'index.html'), '<h1 class="text-center">Hello World</h1>', { flag: 'w' })
    const output = execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, '--no-export'], {
      cwd,
      encoding: 'utf8'
    })
    expect(output).toContain('text-center')
    expect(fs.existsSync(join(cwd, 'master.css'))).toBe(false)
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
})
