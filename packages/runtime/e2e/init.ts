import { Page } from '@playwright/test'
import type { StetCSSManifest } from '@stet-css/core'
import defaultManifestJSON from '@stet-css/preset/default-manifest.json' with { type: 'json' }
import {
  flattenStetCSSManifestVariables,
  groupStetCSSManifestVariables,
  type StetCSSManifestVariable
} from '@stet-css/schema/manifest'
import UtilityType from '@stet-css/schema/utility-type'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createServer, type ViteDevServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')
const defaultManifest = defaultManifestJSON as unknown as StetCSSManifest
let runtimeServerPromise: Promise<ViteDevServer> | undefined

type RuntimeProjectManifestUtilityInput = Partial<NonNullable<StetCSSManifest['utilities']>[number]> & {
  declarations?: Record<string, string | number>
  rules?: { selector?: string, declarations: Record<string, string | number> }[]
}

type RuntimeManifestVariableInput = StetCSSManifestVariable
type RuntimeManifestVariable = StetCSSManifestVariable

type RuntimeProjectManifestInput = Partial<Omit<StetCSSManifest, 'utilities'>> & {
  baseUnit?: string
  defaultMode?: string
  modeTrigger?: NonNullable<StetCSSManifest['settings']>['modeTrigger']
  modes?: string[]
  variables?: RuntimeManifestVariableInput[]
  utilities?: RuntimeProjectManifestUtilityInput[]
}

function getDefaultVariableName(key: string, namespace?: string) {
  const negative = key.startsWith('-')
  const positiveKey = negative ? key.slice(1) : key
  const name = namespace
    ? `${namespace}${positiveKey ? '-' + positiveKey : ''}`
    : positiveKey
  return negative ? '-' + name : name
}

function normalizeVariableValue(value: RuntimeManifestVariable['value'] | undefined) {
  if (typeof value !== 'string') {
    return { value, dependencies: undefined }
  }
  return {
    value: value.replace(/\|/g, ' '),
    dependencies: undefined
  }
}

function inferVariableType(value: RuntimeManifestVariable['value'] | undefined, modes?: RuntimeManifestVariable['modes']) {
  if (typeof value === 'number') return 'number'
  const firstMode = modes && Object.values(modes)[0]
  return firstMode?.type || 'string'
}

function normalizeVariable(variable: RuntimeManifestVariableInput): RuntimeManifestVariable {
  const value = variable.value
  const name = variable.name || getDefaultVariableName(variable.key, variable.namespace)
  const normalizedValue = normalizeVariableValue(value)
  return {
    ...variable,
    name,
    type: variable.type || inferVariableType(value, variable.modes),
    ...(normalizedValue.value !== undefined ? { value: normalizedValue.value } : {}),
    ...(normalizedValue.dependencies?.length ? {
      dependencies: [...new Set([...(variable.dependencies || []), ...normalizedValue.dependencies])]
    } : variable.dependencies?.length ? { dependencies: [...variable.dependencies] } : {})
  }
}

function createRuntimeVariables(defaultVariables: RuntimeManifestVariable[], inputVariables: RuntimeManifestVariableInput[] | undefined) {
  const variables = new Map<string, RuntimeManifestVariable>()
  for (const variable of defaultVariables) {
    if (!variable.name) continue
    variables.set(variable.name, {
      ...variable,
      ...(variable.modes ? { modes: { ...variable.modes } } : {}),
      ...(variable.dependencies?.length ? { dependencies: [...variable.dependencies] } : {})
    })
  }

  for (const inputVariable of inputVariables || []) {
    const normalized = normalizeVariable(inputVariable)
    const current = variables.get(normalized.name!) || {
      name: normalized.name,
      key: normalized.key,
      ...(normalized.namespace ? { namespace: normalized.namespace } : {}),
      type: normalized.type
    }
    if (normalized.mode) {
      current.modes = {
        ...(current.modes || {}),
        [normalized.mode]: {
          type: normalized.type!,
          value: normalized.value as string | number
        }
      }
    } else {
      Object.assign(current, {
        key: normalized.key,
        ...(normalized.namespace ? { namespace: normalized.namespace } : {}),
        type: normalized.type,
        ...(normalized.value !== undefined ? { value: normalized.value } : {}),
        ...(normalized.dependencies?.length ? { dependencies: normalized.dependencies } : {}),
        ...(normalized.inline ? { inline: true } : {}),
        ...(normalized.static ? { static: true } : {})
      })
    }
    variables.set(normalized.name!, current)
  }

  return groupStetCSSManifestVariables([...variables.values()])
}

function normalizeUtility(utility: RuntimeProjectManifestUtilityInput, order: number): NonNullable<StetCSSManifest['utilities']>[number] {
  if (utility.emit && utility.matchers) return utility as NonNullable<StetCSSManifest['utilities']>[number]
  const name = utility.name || utility.id || ''
  const isSemantic = utility.type === UtilityType.Semantic || utility.type === undefined
  return {
    id: utility.id || (isSemantic ? `.${name}` : name),
    name,
    type: utility.type ?? UtilityType.Semantic,
    order: utility.order ?? order,
    layer: utility.layer,
    emit: {
      type: 'static',
      rules: utility.rules || [
        {
          selector: '&',
          declarations: utility.declarations || {}
        }
      ]
    },
    matchers: [{ type: 'static', name }]
  }
}

export function createRuntimeProjectManifest(manifest: RuntimeProjectManifestInput) {
  const defaultUtilities = defaultManifest.utilities || []
  const { baseUnit, defaultMode, modeTrigger, modes, ...rest } = manifest
  const variables = createRuntimeVariables(flattenStetCSSManifestVariables(defaultManifest.variables), rest.variables)
  const customUtilities = (rest.utilities || []).map((utility, index) => normalizeUtility(utility, defaultUtilities.length + index))
  return {
    ...defaultManifest,
    ...rest,
    version: 1,
    settings: {
      ...defaultManifest.settings,
      ...rest.settings,
      ...(baseUnit !== undefined ? { baseUnit } : {}),
      ...(defaultMode !== undefined ? { defaultMode } : {}),
      ...(modeTrigger !== undefined ? { modeTrigger } : {}),
      ...(modes !== undefined ? { modes } : {})
    },
    variables,
    animations: {
      ...(defaultManifest.animations || {}),
      ...(rest.animations || {})
    },
    variants: [
      ...(defaultManifest.variants || []),
      ...(rest.variants || [])
    ],
    utilities: [
      ...defaultUtilities,
      ...customUtilities
    ]
  } satisfies StetCSSManifest
}

const RUNTIME_ASSET_BASE_URL = 'http://stet-css-runtime.test'
export const RUNTIME_SCRIPT_URL = `${RUNTIME_ASSET_BASE_URL}/css-runtime@rc`
/** Serves the built CDN bundle (`dist/global.min.js`), which embeds its default manifest. */
export async function routeRuntimeAssets(page: Page) {
  await page.route(RUNTIME_SCRIPT_URL, (route) => {
    route.fulfill({
      contentType: 'text/javascript',
      body: readFileSync(resolve(packageRoot, 'dist/global.min.js'), 'utf8')
    })
  })
}

export async function getRuntimeLoaderURL() {
  runtimeServerPromise ??= (async () => {
    const server = await createServer({
      appType: 'custom',
      configFile: false,
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      logLevel: 'error',
      root: packageRoot,
      server: {
        cors: true,
        host: '127.0.0.1',
        port: 0
      }
    })
    await server.listen()
    return server
  })()
  const server = await runtimeServerPromise
  const localURL = server.resolvedUrls?.local[0]
  if (!localURL) throw new Error('Cannot resolve runtime e2e Vite server URL.')
  return new URL('/e2e/runtime-loader.ts', localURL).href
}

export default async function init(page: Page, manifestInput?: RuntimeProjectManifestInput) {
  const manifest = manifestInput ? createRuntimeProjectManifest(manifestInput) : undefined
  await page.evaluate(async ({ loaderURL, manifest }) => {
    const { startCSSRuntime } = await import(loaderURL)
    startCSSRuntime({ manifest })
  }, { loaderURL: await getRuntimeLoaderURL(), manifest })
  await page.waitForFunction(() => !!globalThis.stetCSSRuntime)
}
