// Preload with `node --import` to simulate an install that lacks some packages:
// every package named in HIDDEN_PACKAGES (comma separated) fails to resolve through require.
import Module from 'node:module'

const hiddenPackages = (process.env.HIDDEN_PACKAGES ?? '').split(',').filter(Boolean)
const resolveFilename = Module._resolveFilename

Module._resolveFilename = function (request, ...args) {
  if (hiddenPackages.some((name) => request === name || request.startsWith(`${name}/`))) {
    const error = new Error(`Cannot find module '${request}'`)
    error.code = 'MODULE_NOT_FOUND'
    throw error
  }
  return resolveFilename.call(this, request, ...args)
}
