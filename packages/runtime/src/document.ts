/**
 * Page elements with a `name` (`img`, `form`, `embed`, `object`, `iframe`) become same-named
 * properties of `document` and shadow its built-in members, so `document.head` can be an
 * `<img>`. Read document members through the interface prototypes instead of the instance.
 */

/**
 * Reads the `Symbol.toStringTag` brand, which named properties (strings) cannot shadow. It also
 * holds for documents from another realm, and for roots outside a DOM, where `Node` is undefined.
 */
export function isDocumentRoot(root: Document | ShadowRoot): root is Document {
  const tag = Object.prototype.toString.call(root)
  return tag === '[object HTMLDocument]' || tag === '[object Document]'
}

export function readDocument<K extends keyof Document>(document: Document, key: K): Document[K] {
  return Reflect.get(Document.prototype, key, document)
}

export function querySelectorAllIn(root: Document | ShadowRoot, selectors: string): NodeListOf<Element> {
  return isDocumentRoot(root)
    ? readDocument(root, 'querySelectorAll').call(root, selectors)
    : root.querySelectorAll(selectors)
}
