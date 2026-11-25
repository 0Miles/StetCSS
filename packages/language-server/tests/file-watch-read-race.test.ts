import * as fs from 'node:fs'
import { afterEach, expect, test, vi } from 'vitest'
import { components, disposeProjects, ENTRY_CSS, openProject, until } from './watch-project'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const readFileSync = vi.fn(actual.readFileSync)
  return { ...actual, readFileSync, default: { ...actual, readFileSync } }
})

afterEach(() => {
  vi.mocked(fs.readFileSync).mockReset()
  disposeProjects()
})

/**
 * Guards #248 (review F4): a `git checkout` that lands while the first load is reading the project
 * leaves the load with the old file, and the server must still report the new one. A file stamped
 * only once the load has finished takes the new file as its baseline and never reports it.
 * Trade-off (testing.md 6): mocks `readFileSync` to place the write right after the compile reads
 * the file, since a real race cannot be timed.
 * Catches: stamping a newly watched file in `FileWatcher.watch` instead of before the load reads it.
 */
test('reports a change that lands right after the first load read the file', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  const project = await openProject({
    'index.css': ENTRY_CSS,
    'components.css': components('watch-card', 'block')
  })
  let replaced = false
  vi.mocked(fs.readFileSync).mockImplementation(((file: fs.PathOrFileDescriptor, options?: unknown) => {
    const text = actual.readFileSync(file, options as BufferEncoding)
    if (!replaced && file === project.path('components.css')) {
      replaced = true
      actual.unlinkSync(file)
      actual.writeFileSync(file, components('watch-chip', 'flex'))
    }
    return text
  }) as typeof fs.readFileSync)

  const document = await project.open('<div class="watch-chip"></div>')
  expect(replaced).toBe(true)

  await until(async () => (await document.hover('watch-chip'))?.includes('display:flex') ?? false, 'hover to show watch-chip')
})
