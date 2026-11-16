export const MANIFEST_MODULE_FILE = 'stet-css-manifest.js'
export const MANIFEST_ASSET_FILE = 'stet-css-manifest.json'
export const STET_CSS_MANIFEST_PRELOAD_REL = 'modulepreload'
export const STET_CSS_MANIFEST_PRELOAD_AS = 'json'

export interface ManifestPreloadLinkAttrs {
  rel: typeof STET_CSS_MANIFEST_PRELOAD_REL
  as: typeof STET_CSS_MANIFEST_PRELOAD_AS
  crossorigin: ''
  href: string
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

export function toInlineManifestModule(json: string) {
  return `export default ${json};`
}

export function toManifestPreloadLinkAttrs(href: string): ManifestPreloadLinkAttrs {
  return {
    rel: STET_CSS_MANIFEST_PRELOAD_REL,
    as: STET_CSS_MANIFEST_PRELOAD_AS,
    crossorigin: '',
    href
  }
}

export function toManifestPreloadLinkTag(href: string) {
  const attrs = toManifestPreloadLinkAttrs(href)
  return [
    '<link',
    `rel="${attrs.rel}"`,
    `as="${attrs.as}"`,
    'crossorigin',
    `href="${escapeAttributeValue(attrs.href)}">`
  ].join(' ')
}

export function toBrowserManifestFacadeModule(urlExpression: string) {
  // Load the manifest with `fetch` rather than a JSON import attribute
  // (`import(url, { with: { type: 'json' } })`). Import attributes are only
  // supported in Safari 17.2+, Chrome 123+, and Firefox 130+; on older engines
  // — notably all iOS 15/16 (Safari < 17.2) — evaluating that dynamic import,
  // even inside `new Function`, throws `SyntaxError: import call expects exactly
  // one argument` while the entry module is being evaluated, so the whole app
  // fails to bootstrap and renders blank with no obvious console error. `fetch`
  // is universally supported and needs no bundler-hiding indirection.
  return [
    `const stetCSSManifestURL = ${urlExpression};`,
    `const stetCSSManifestResponse = await fetch(typeof stetCSSManifestURL === 'string' ? stetCSSManifestURL : stetCSSManifestURL.href);`,
    `export default await stetCSSManifestResponse.json();`,
    ``
  ].join('\n')
}

export function toNodeManifestFacadeModule(urlExpression: string) {
  return [
    `import { fileURLToPath, pathToFileURL } from 'node:url';`,
    ``,
    `const stetCSSManifestURL = ${urlExpression};`,
    `const stetCSSManifestFile = fileURLToPath(new URL(stetCSSManifestURL, import.meta.url));`,
    `const stetCSSManifestModule = await import(pathToFileURL(stetCSSManifestFile).href, { with: { type: 'json' } });`,
    `export default stetCSSManifestModule.default;`,
    ``
  ].join('\n')
}

export function toUniversalManifestFacadeModule(urlExpression: string) {
  return [
    `const stetCSSManifestURL = ${urlExpression};`,
    ``,
    `async function loadStetCSSManifestFromFile(url) {`,
    `    const load = new Function('specifier', 'options', 'return import(specifier, options)');`,
    `    const { fileURLToPath, pathToFileURL } = await load('node:url');`,
    `    const { join } = await load('node:path');`,
    `    const value = typeof url === 'string' ? url : url.href;`,
    `    const files = value.startsWith('/_next/')`,
    `        ? [`,
    `            join(process.cwd(), '.next', value.slice('/_next/'.length)),`,
    `            join(process.cwd(), '.next', 'dev', value.slice('/_next/'.length))`,
    `        ]`,
    `        : [fileURLToPath(value)];`,
    `    let lastError;`,
    `    for (const file of files) {`,
    `        try {`,
    `            const manifestModule = await load(pathToFileURL(file).href, { with: { type: 'json' } });`,
    `            return manifestModule.default;`,
    `        } catch (error) {`,
    `            lastError = error;`,
    `        }`,
    `    }`,
    `    throw lastError;`,
    `}`,
    ``,
    `async function loadStetCSSManifestFromFetch(url) {`,
    `    const specifier = typeof url === 'string' ? url : url.href;`,
    `    const response = await fetch(specifier);`,
    `    return response.json();`,
    `}`,
    ``,
    // Browsers use `fetch`; only the Node branch keeps the JSON import attribute.
    // See `toBrowserManifestFacadeModule` for why import attributes cannot be used
    // on the browser (they break Safari < 17.2 / iOS 15-16 at parse time).
    `export default typeof window === 'undefined'`,
    `    ? await loadStetCSSManifestFromFile(stetCSSManifestURL)`,
    `    : await loadStetCSSManifestFromFetch(stetCSSManifestURL);`,
    ``
  ].join('\n')
}
