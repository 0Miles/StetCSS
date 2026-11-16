import path from 'node:path'

export function normalizePath(filePath: string) {
  return path.resolve(filePath).replace(/\\/g, '/')
}

export function hasModifiedFile(modifiedFiles: ReadonlySet<string> | undefined, filePath: string) {
  if (!modifiedFiles) return false
  const normalizedFilePath = normalizePath(filePath)
  for (const eachModifiedFile of modifiedFiles) {
    if (normalizePath(eachModifiedFile) === normalizedFilePath) return true
  }
  return false
}

/** Whether `child` sits strictly inside `parent`. */
export function isInsidePath(child: string, parent: string) {
  const relativePath = path.relative(parent, child)
  return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}
