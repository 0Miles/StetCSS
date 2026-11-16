import path from 'node:path'

export function normalizePath(filePath: string) {
  return path.resolve(filePath).replace(/\\/g, '/')
}

/** Whether `child` sits strictly inside `parent`. */
export function isInsidePath(child: string, parent: string) {
  const relativePath = path.relative(parent, child)
  return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}
