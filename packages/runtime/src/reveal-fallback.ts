import { hostOf } from './document'

/**
 * The CDN bundle imports this module first, so the timer is set before any other bundled module
 * evaluates. Startup runs synchronously in the same script, so the timer only fires when the
 * script aborted before startup returned or threw: a module threw while loading, where no
 * try/catch around the startup call can see it. It then reveals, on the next task, a page that
 * hides `<html>` until the runtime renders. Upstream waits 3 s because its runtime fetches the
 * manifest asynchronously; this bundle embeds it, so any delay would only keep the page blank.
 */
const timer = setTimeout(() => hostOf(document).removeAttribute('hidden'))

export function cancelRevealFallback() {
  clearTimeout(timer)
}
