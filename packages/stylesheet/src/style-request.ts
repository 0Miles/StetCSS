import { extname } from 'node:path'

/**
 * Stylesheet request ids as bundlers pass them: a file path, optionally followed by a
 * query, such as an SFC block's `?vue&type=style&index=0&lang.css`.
 */
export const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/

export function cleanStyleRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

function getStyleRequestSearchParams(id: string) {
  const queryStart = id.indexOf('?')
  return queryStart === -1 ? new URLSearchParams() : new URLSearchParams(id.slice(queryStart + 1))
}

export function getStyleRequestExtension(id: string) {
  const cleanExtension = extname(cleanStyleRequest(id))
  if (cleanExtension === '.css' || cleanExtension === '.scss' || cleanExtension === '.sass') {
    return cleanExtension
  }
  const lang = getStyleRequestSearchParams(id).get('lang')
  if (lang === 'css' || lang === 'scss' || lang === 'sass') {
    return '.' + lang
  }
  return cleanExtension
}

function isStyleModuleRequest(id: string) {
  return getStyleRequestSearchParams(id).get('type') === 'style'
}

export function isStyleCSSRequest(id: string) {
  return STYLE_CSS_REQUEST_RE.test(id) || (isStyleModuleRequest(id) && ['.css', '.scss', '.sass'].includes(getStyleRequestExtension(id)))
}

/**
 * The scope id of a Vue SFC `<style scoped>` request, the `<id>` of its `data-v-<id>`
 * attribute: Vite's `scoped=<id>`, or vue-loader's `id=<id>&scoped=true`. Undefined for
 * any other request.
 */
export function getVueScopedStyleId(id: string) {
  const params = getStyleRequestSearchParams(id)
  if (!params.has('vue') || params.get('type') !== 'style') return
  const scoped = params.get('scoped')
  if (!scoped) return
  return (scoped === 'true' ? params.get('id') : scoped) || undefined
}
