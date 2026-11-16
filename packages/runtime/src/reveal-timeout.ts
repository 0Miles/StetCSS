import { readDocument } from './document'

const REVEAL_TIMEOUT_MS = 3000

/**
 * The CDN bundle imports this module first, so the timer starts before any other bundled module
 * evaluates. If startup has not finished 3 s later (for example a module threw while loading,
 * where no try/catch around the startup call can see it), a page that hides `<html>` until the
 * runtime renders is revealed anyway.
 */
const timer = setTimeout(() => readDocument(document, 'documentElement').removeAttribute('hidden'), REVEAL_TIMEOUT_MS)

export function cancelRevealTimeout() {
  clearTimeout(timer)
}
