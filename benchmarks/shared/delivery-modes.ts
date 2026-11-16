import { createServer, type Server } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { Browser, Page } from '@playwright/test'
import { benchmarkAdapters } from '../fixtures/manifest'
import { getStaticFixtureSource, staticFixtureIds } from '../fixtures/static'
import { summarizeBytes } from './bytes'
import { analyzeCSSStructure } from './css-structure'
import {
  benchmarkRoot,
  measureRelativeArtifact,
  readFiles,
  resetDirectory,
  resolveBenchmarkPackageFile,
  writeWorkspaceFiles
} from './runner'
import { createRuntimeBundleScripts } from './runtime-harness'
import { runStaticBuild, staticBuildTools, type StaticBuildToolId } from './static-build'
import type {
  BenchmarkAdapter,
  BenchmarkArtifact,
  BenchmarkFixtureId,
  BenchmarkMetric,
  BenchmarkSample,
  BenchmarkVariant
} from './types'

export type DeliveryModeId =
  | 'master-static'
  | 'master-runtime'
  | 'tailwind-static'

interface ChromeTraceEvent {
  name?: string
  ph?: string
  dur?: number
}

interface DeliveryModeDescriptor {
  id: DeliveryModeId
  adapterId: 'master-static' | 'master-runtime' | 'tailwind-cli'
  label: string
}

export interface DeliveryModePage {
  root: string
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface DeliveryModeMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

interface DeliveryModeDiagnostics {
  ready: string | undefined
  textAlign: string
  runtimeAvailable: boolean
  htmlHidden: boolean
  cssomTopLevelRuleCount: number
  cssomLayerRuleCount: number
  cssomLayerRuleCounts: Record<string, number>
  cssomTotalRuleCount: number
  runtimeClassUtilityCount: number
  runtimeClassUtilityNames: string[]
  runtimeGeneratedRuleCount: number
  runtimeStyleRawBytes: number
  runtimeStyleText: string
  consoleWarnings: string[]
}

const fixedViewport = {
  width: 1280,
  height: 720
}

export const masterDeliveryModeFixtureIds = staticFixtureIds

export const deliveryModeDescriptors = [
  {
    id: 'master-static',
    adapterId: 'master-static',
    label: 'Master CSS static'
  },
  {
    id: 'master-runtime',
    adapterId: 'master-runtime',
    label: 'Master CSS runtime'
  },
  {
    id: 'tailwind-static',
    adapterId: 'tailwind-cli',
    label: 'Tailwind CSS static'
  }
] satisfies DeliveryModeDescriptor[]

export const masterDeliveryModeMetrics = [
  {
    id: 'html-raw-bytes',
    label: 'HTML raw bytes',
    unit: 'B',
    description: 'Raw bytes for the benchmark page HTML.'
  },
  {
    id: 'html-gzip-bytes',
    label: 'HTML gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for the benchmark page HTML.'
  },
  {
    id: 'html-brotli-bytes',
    label: 'HTML brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for the benchmark page HTML.'
  },
  {
    id: 'external-css-raw-bytes',
    label: 'External CSS raw bytes',
    unit: 'B',
    description: 'Raw bytes for externally linked CSS delivered before runtime work.'
  },
  {
    id: 'external-css-gzip-bytes',
    label: 'External CSS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for externally linked CSS delivered before runtime work.'
  },
  {
    id: 'external-css-brotli-bytes',
    label: 'External CSS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for externally linked CSS delivered before runtime work.'
  },
  {
    id: 'runtime-js-raw-bytes',
    label: 'Runtime JS raw bytes',
    unit: 'B',
    description: 'Raw bytes for the Master CSS browser runtime bundle.'
  },
  {
    id: 'runtime-js-gzip-bytes',
    label: 'Runtime JS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for the Master CSS browser runtime bundle.'
  },
  {
    id: 'runtime-js-brotli-bytes',
    label: 'Runtime JS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for the Master CSS browser runtime bundle.'
  },
  {
    id: 'delivered-style-rule-count',
    label: 'Delivered style rules',
    unit: 'count',
    description: 'Style rule count for CSS delivered before runtime-generated rules.'
  },
  {
    id: 'delivered-selector-count',
    label: 'Delivered selectors',
    unit: 'count',
    description: 'Selector count for CSS delivered before runtime-generated rules.'
  },
  {
    id: 'delivered-declaration-count',
    label: 'Delivered declarations',
    unit: 'count',
    description: 'Declaration count for CSS delivered before runtime-generated rules.'
  },
  {
    id: 'navigation-ready-ms',
    label: 'Navigation to ready',
    unit: 'ms',
    description: 'Elapsed wall time from navigation start until the page loaded, passed correctness checks, and the runtime observed the DOM when applicable.'
  },
  {
    id: 'stylesheet-parse-ms',
    label: 'Stylesheet parse/attach',
    unit: 'ms',
    description: 'Trace-derived stylesheet parsing and attachment duration where Chromium exposes stable timeline events.'
  },
  {
    id: 'style-recalculation-ms',
    label: 'Style recalculation',
    unit: 'ms',
    description: 'Trace-derived style recalculation duration from Chromium timeline events.'
  },
  {
    id: 'layout-ms',
    label: 'Layout',
    unit: 'ms',
    description: 'Trace-derived layout duration from Chromium timeline events.'
  },
  {
    id: 'paint-ms',
    label: 'Paint',
    unit: 'ms',
    description: 'Trace-derived paint and pre-paint duration from Chromium timeline events.'
  },
  {
    id: 'long-task-count',
    label: 'Long tasks',
    unit: 'count',
    description: 'Count of trace task events at or above 50 ms.'
  },
  {
    id: 'request-count',
    label: 'Request count',
    unit: 'count',
    description: 'Initial HTML request plus same-origin resource requests observed by the page.'
  },
  {
    id: 'runtime-ready-ms',
    label: 'Runtime ready',
    unit: 'ms',
    description: 'Browser performance timestamp when Master CSS runtime finished observe.'
  },
  {
    id: 'runtime-bootstrap-ms',
    label: 'Runtime bootstrap',
    unit: 'ms',
    description: 'Time from browser runtime script execution to runtime observe completion.'
  },
  {
    id: 'runtime-observe-ms',
    label: 'Runtime observe',
    unit: 'ms',
    description: 'Synchronous duration of CSSRuntime.observe().'
  },
  {
    id: 'runtime-generated-rule-count',
    label: 'Runtime generated rules',
    unit: 'count',
    description: 'CSSOM rule count in style#master-css after runtime observe.'
  },
  {
    id: 'runtime-style-raw-bytes',
    label: 'Runtime style raw bytes',
    unit: 'B',
    description: 'Raw bytes of style#master-css after runtime observe.'
  }
] satisfies BenchmarkMetric[]

export function getMasterDeliveryModeAdapters(): BenchmarkAdapter[] {
  const ids = new Set<string>(deliveryModeDescriptors.map((mode) => mode.adapterId))
  return benchmarkAdapters.filter((adapter) => ids.has(adapter.id))
}

export function createMasterDeliveryModeVariants(): BenchmarkVariant[] {
  return masterDeliveryModeFixtureIds.flatMap((fixtureId) => deliveryModeDescriptors.map((mode) => ({
    id: createMasterDeliveryModeVariantId(fixtureId, mode.id),
    fixtureId,
    adapterId: mode.adapterId,
    label: `${fixtureId} / ${mode.label}`
  })))
}

export function createMasterDeliveryModeVariantId(fixtureId: BenchmarkFixtureId, modeId: DeliveryModeId) {
  return `${fixtureId}-${modeId}`
}

export async function createMasterDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  modeId: DeliveryModeId
  variantId: string
}): Promise<DeliveryModePage> {
  if (options.modeId === 'master-static') {
    return createStaticDeliveryModePage({
      ...options,
      toolId: 'master-static-cli'
    })
  }

  if (options.modeId === 'tailwind-static') {
    return createStaticDeliveryModePage({
      ...options,
      toolId: 'tailwind-cli'
    })
  }

  return createRuntimeDeliveryModePage(options)
}

export async function measureMasterDeliveryMode(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  modeId: DeliveryModeId
  round: number
}) {
  const server = await startStaticFileServer(options.pageRoot)

  try {
    const context = await options.browser.newContext({
      viewport: fixedViewport,
      deviceScaleFactor: 1
    })
    const page = await context.newPage()
    const consoleWarnings = collectConsoleWarnings(page)

    try {
      const artifactRoot = resolve(benchmarkRoot, '.results', 'master-delivery-modes', 'artifacts', options.variantId, `round-${options.round}`)
      await resetDirectory(artifactRoot)

      const traceFile = resolve(artifactRoot, 'trace.json')
      const screenshotFile = resolve(artifactRoot, 'screenshot.png')
      const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
      const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
      const traceResult = await traceNavigation(page, server.origin, options.modeId)
      const diagnostics = await readDeliveryDiagnostics(page, consoleWarnings)
      await writeFile(traceFile, `${JSON.stringify({ traceEvents: traceResult.events }, null, 2)}\n`)
      await writeDiagnosticsArtifacts({
        diagnostics,
        diagnosticsFile,
        runtimeStyleFile
      })
      await page.screenshot({ path: screenshotFile, fullPage: false })

      const traceMetrics = summarizeTraceEvents(traceResult.events)
      const artifactFiles = [traceFile, screenshotFile, diagnosticsFile]
      if (diagnostics.runtimeStyleText) artifactFiles.push(runtimeStyleFile)
      const artifacts = await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))

      return {
        samples: createBrowserSamples(options.variantId, options.round, {
          navigationReadyMs: traceResult.navigationReadyMs,
          ...traceMetrics,
          ...traceResult.deliveryMetrics
        }),
        artifacts
      } satisfies DeliveryModeMeasurement
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

async function createStaticDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  modeId: DeliveryModeId
  variantId: string
  toolId: Extract<StaticBuildToolId, 'master-static-cli' | 'tailwind-cli'>
}): Promise<DeliveryModePage> {
  const tool = staticBuildTools.find((candidate) => candidate.id === options.toolId)
  if (!tool) throw new Error(`Missing static build tool: ${options.toolId}`)

  const buildResult = await runStaticBuild({
    suite: 'master-delivery-modes',
    fixtureId: options.fixtureId,
    tool,
    round: 0,
    workspaceName: `${options.variantId}-static-build`
  })
  const css = (await readFiles(buildResult.cssFiles)).toString('utf8')
  const fixture = getStaticFixtureSource(options.fixtureId)
  const sourceHtml = tool.family === 'master' ? fixture.masterHtml : fixture.tailwindHtml
  const html = addStaticHarness(sourceHtml)

  return writeDeliveryModePage({
    variantId: options.variantId,
    html,
    externalCSS: css,
    buildArtifacts: buildResult.artifacts
  })
}

async function createRuntimeDeliveryModePage(options: {
  fixtureId: BenchmarkFixtureId
  variantId: string
}): Promise<DeliveryModePage> {
  const fixture = getStaticFixtureSource(options.fixtureId)
  const html = addRuntimeHarness(fixture.masterHtml)

  return writeDeliveryModePage({
    variantId: options.variantId,
    html,
    runtimeJS: await readRuntimeBundle()
  })
}

async function writeDeliveryModePage(options: {
  variantId: string
  html: string
  externalCSS?: string
  runtimeJS?: Buffer
  buildArtifacts?: BenchmarkArtifact[]
}): Promise<DeliveryModePage> {
  const root = resolve(benchmarkRoot, '.results', 'master-delivery-modes', 'pages', options.variantId)
  await resetDirectory(root)

  const files: Record<string, string> = {
    'index.html': options.html
  }

  if (options.externalCSS !== undefined) files['style.css'] = options.externalCSS
  if (options.runtimeJS) files['global.min.js'] = options.runtimeJS.toString('utf8')

  await writeWorkspaceFiles(root, files)

  const artifacts = await Promise.all(Object.keys(files).map((file) => measureRelativeArtifact(resolve(root, file))))

  return {
    root,
    samples: [
      ...createPayloadSamples(options.variantId, {
        html: Buffer.from(options.html),
        externalCSS: Buffer.from(options.externalCSS || ''),
        runtimeJS: options.runtimeJS || Buffer.alloc(0)
      }),
      ...createDeliveredCSSStructureSamples(options.variantId, options.externalCSS ?? '')
    ],
    artifacts: [
      ...(options.buildArtifacts || []),
      ...artifacts
    ]
  }
}

function createPayloadSamples(variantId: string, payload: {
  html: Buffer
  externalCSS: Buffer
  runtimeJS: Buffer
}): BenchmarkSample[] {
  return [
    ...createByteSamples(variantId, 'html', payload.html),
    ...createByteSamples(variantId, 'external-css', payload.externalCSS),
    ...createByteSamples(variantId, 'runtime-js', payload.runtimeJS)
  ]
}

function createByteSamples(variantId: string, prefix: string, buffer: Buffer): BenchmarkSample[] {
  const bytes = summarizeBytes(buffer)
  return [
    {
      metricId: `${prefix}-raw-bytes`,
      variantId,
      round: 0,
      value: bytes.rawBytes
    },
    {
      metricId: `${prefix}-gzip-bytes`,
      variantId,
      round: 0,
      value: bytes.gzipBytes
    },
    {
      metricId: `${prefix}-brotli-bytes`,
      variantId,
      round: 0,
      value: bytes.brotliBytes
    }
  ]
}

function createDeliveredCSSStructureSamples(variantId: string, css: string): BenchmarkSample[] {
  const structure = css.trim()
    ? analyzeCSSStructure(css)
    : {
      styleRuleCount: 0,
      selectorCount: 0,
      declarationCount: 0
    }

  return [
    {
      metricId: 'delivered-style-rule-count',
      variantId,
      round: 0,
      value: structure.styleRuleCount
    },
    {
      metricId: 'delivered-selector-count',
      variantId,
      round: 0,
      value: structure.selectorCount
    },
    {
      metricId: 'delivered-declaration-count',
      variantId,
      round: 0,
      value: structure.declarationCount
    }
  ]
}

function createBrowserSamples(variantId: string, round: number, metrics: {
  navigationReadyMs: number
  stylesheetParseMs: number
  styleRecalculationMs: number
  layoutMs: number
  paintMs: number
  longTaskCount: number
  requestCount: number
  runtimeReadyMs: number
  runtimeBootstrapMs: number
  runtimeObserveMs: number
  runtimeGeneratedRuleCount: number
  runtimeStyleRawBytes: number
}): BenchmarkSample[] {
  return [
    {
      metricId: 'navigation-ready-ms',
      variantId,
      round,
      value: metrics.navigationReadyMs
    },
    {
      metricId: 'stylesheet-parse-ms',
      variantId,
      round,
      value: metrics.stylesheetParseMs
    },
    {
      metricId: 'style-recalculation-ms',
      variantId,
      round,
      value: metrics.styleRecalculationMs
    },
    {
      metricId: 'layout-ms',
      variantId,
      round,
      value: metrics.layoutMs
    },
    {
      metricId: 'paint-ms',
      variantId,
      round,
      value: metrics.paintMs
    },
    {
      metricId: 'long-task-count',
      variantId,
      round,
      value: metrics.longTaskCount
    },
    {
      metricId: 'request-count',
      variantId,
      round,
      value: metrics.requestCount
    },
    {
      metricId: 'runtime-ready-ms',
      variantId,
      round,
      value: metrics.runtimeReadyMs
    },
    {
      metricId: 'runtime-bootstrap-ms',
      variantId,
      round,
      value: metrics.runtimeBootstrapMs
    },
    {
      metricId: 'runtime-observe-ms',
      variantId,
      round,
      value: metrics.runtimeObserveMs
    },
    {
      metricId: 'runtime-generated-rule-count',
      variantId,
      round,
      value: metrics.runtimeGeneratedRuleCount
    },
    {
      metricId: 'runtime-style-raw-bytes',
      variantId,
      round,
      value: metrics.runtimeStyleRawBytes
    }
  ]
}

function collectConsoleWarnings(page: Page) {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  return warnings
}

async function readDeliveryDiagnostics(page: Page, consoleWarnings: string[]): Promise<DeliveryModeDiagnostics> {
  const diagnostics = await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime as unknown as {
      style?: HTMLStyleElement | null
      text?: string
      classUtilities?: Map<string, unknown>
    } | undefined
    const styleElement = document.querySelector<HTMLStyleElement>('style#master-css')
    const styleRules = styleElement?.sheet?.cssRules
    const runtimeStyleText = runtime?.style?.textContent || runtime?.text || ''
    const runtimeClassUtilityNames = [...(runtime?.classUtilities?.keys?.() || [])].map(String).sort()
    const cssom = summarizeCSSOM(styleRules)

    return {
      ready: document.documentElement.dataset.benchmarkReady,
      textAlign: getComputedStyle(document.getElementById('benchmark-style-probe')!).textAlign,
      runtimeAvailable: Boolean(runtime),
      htmlHidden: document.documentElement.hasAttribute('hidden'),
      cssomTopLevelRuleCount: styleRules?.length || 0,
      cssomLayerRuleCount: cssom.layerRuleCount,
      cssomLayerRuleCounts: cssom.layerRuleCounts,
      cssomTotalRuleCount: cssom.totalRuleCount,
      runtimeClassUtilityCount: runtimeClassUtilityNames.length,
      runtimeClassUtilityNames,
      runtimeGeneratedRuleCount: cssom.totalRuleCount,
      runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,
      runtimeStyleText
    }

    function summarizeCSSOM(rules?: CSSRuleList) {
      const layerRuleCounts: Record<string, number> = {}
      let layerRuleCount = 0
      let totalRuleCount = 0

      if (rules) {
        for (const rule of rules) {
          const childRules = 'cssRules' in rule ? (rule as CSSGroupingRule).cssRules : undefined
          if (childRules) {
            const name = 'name' in rule ? String((rule as CSSGroupingRule & { name?: string }).name || 'anonymous') : rule.constructor.name
            layerRuleCounts[name] = childRules.length
            layerRuleCount += childRules.length
            totalRuleCount += countCSSRules(childRules)
          } else {
            totalRuleCount++
          }
        }
      }

      return {
        layerRuleCount,
        layerRuleCounts,
        totalRuleCount
      }
    }

    function countCSSRules(rules?: CSSRuleList): number {
      if (!rules) return 0
      let total = 0
      for (const rule of rules) {
        total += 'cssRules' in rule
          ? countCSSRules((rule as CSSGroupingRule).cssRules)
          : 1
      }
      return total
    }
  })

  return {
    ...diagnostics,
    consoleWarnings
  }
}

async function writeDiagnosticsArtifacts(options: {
  diagnostics: DeliveryModeDiagnostics
  diagnosticsFile: string
  runtimeStyleFile: string
}) {
  const { runtimeStyleText, ...diagnosticsJSON } = options.diagnostics
  await writeFile(options.diagnosticsFile, `${JSON.stringify({
    ...diagnosticsJSON,
    runtimeStyleTextArtifact: runtimeStyleText ? 'runtime-style.css' : undefined
  }, null, 2)}\n`)
  if (runtimeStyleText) await writeFile(options.runtimeStyleFile, runtimeStyleText)
}

function addStaticHarness(html: string) {
  return addReadyHarness(
    addStyleProbe(
      insertBeforeHeadEnd(html, '    <link rel="stylesheet" href="/style.css">')
    )
  )
}

function addRuntimeHarness(html: string) {
  return insertBeforeHeadEnd(addHiddenAttribute(addStyleProbe(html)), [
    '    <script>',
    '        window.__benchmarkReady = false;',
    '        window.__deliveryMetrics = {',
    '            runtimeScriptLoadedMs: 0,',
    '            runtimeReadyMs: 0,',
    '            runtimeBootstrapMs: 0,',
    '            runtimeObserveMs: 0,',
    '            runtimeGeneratedRuleCount: 0,',
    '            runtimeStyleRawBytes: 0',
    '        };',
    '    </script>',
    ...createRuntimeBundleScripts('__deliveryMetrics', [
      '            const metrics = window.__deliveryMetrics;',
      '            metrics.runtimeScriptLoadedMs = performance.now();',
      '            const originalObserve = Runtime.prototype.observe;',
      '            Runtime.prototype.observe = function(...args) {',
      '                const startedAt = performance.now();',
      '                const result = originalObserve.apply(this, args);',
      '                const finishedAt = performance.now();',
      '                metrics.runtimeObserveMs = finishedAt - startedAt;',
      '                metrics.runtimeReadyMs = finishedAt;',
      '                metrics.runtimeBootstrapMs = finishedAt - metrics.runtimeScriptLoadedMs;',
      '                metrics.runtimeGeneratedRuleCount = countCSSRules(this.style?.sheet?.cssRules);',
      '                metrics.runtimeStyleRawBytes = new TextEncoder().encode(this.style?.textContent || this.text || "").length;',
      '                requestAnimationFrame(() => requestAnimationFrame(() => {',
      '                    const marker = document.getElementById("benchmark-loaded");',
      '                    marker.dataset.ready = "true";',
      '                    document.documentElement.dataset.benchmarkReady = "true";',
      '                    window.__benchmarkReady = true;',
      '                }));',
      '                return result;',
      '            };',
      '            function countCSSRules(rules) {',
      '                if (!rules) return 0;',
      '                let total = 0;',
      '                for (const rule of rules) {',
      '                    if ("cssRules" in rule) {',
      '                        total += countCSSRules(rule.cssRules);',
      '                    } else {',
      '                        total++;',
      '                    }',
      '                }',
      '                return total;',
      '            }'
    ])
  ].join('\n'))
}

function addReadyHarness(html: string) {
  return insertBeforeBodyEnd(html, [
    '    <script>',
    '        window.__benchmarkReady = false;',
    '        requestAnimationFrame(() => requestAnimationFrame(() => {',
    '            const marker = document.getElementById("benchmark-loaded");',
    '            marker.dataset.ready = "true";',
    '            document.documentElement.dataset.benchmarkReady = "true";',
    '            window.__benchmarkReady = true;',
    '        }));',
    '    </script>'
  ].join('\n'))
}

function addStyleProbe(html: string) {
  const probe = [
    '    <span id="benchmark-style-probe" class="text-center" hidden>style probe</span>',
    '    <div id="benchmark-loaded" hidden>loaded</div>'
  ].join('\n')
  return html.replace(/<body([^>]*)>/i, (match) => `${match}\n${probe}`)
}

function addHiddenAttribute(html: string) {
  return html.replace(/<html([^>]*)>/i, (match, attrs: string) => (
    /\shidden(?:[\s=>]|$)/i.test(attrs)
      ? match
      : `<html${attrs} hidden>`
  ))
}

function insertBeforeHeadEnd(html: string, content: string) {
  return html.replace('</head>', `${content}\n</head>`)
}

function insertBeforeBodyEnd(html: string, content: string) {
  return html.replace('</body>', `${content}\n</body>`)
}

async function traceNavigation(page: Page, url: string, modeId: DeliveryModeId) {
  const context = page.context()
  const client = await context.newCDPSession(page)
  const events: ChromeTraceEvent[] = []
  const tracingComplete = new Promise<void>((resolveComplete) => {
    client.once('Tracing.tracingComplete', () => resolveComplete())
  })

  client.on('Tracing.dataCollected', (event: { value?: ChromeTraceEvent[] }) => {
    if (event.value) events.push(...event.value)
  })

  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'blink',
      'loading'
    ].join(','),
    transferMode: 'ReportEvents'
  })

  const startedAt = performance.now()
  await page.goto(url, { waitUntil: 'load' })
  await waitForBenchmarkReady(page)
  await assertDeliveryModeCorrect(page, modeId)
  const deliveryMetrics = await readDeliveryMetrics(page)
  const navigationReadyMs = performance.now() - startedAt

  await client.send('Tracing.end')
  await tracingComplete
  await client.detach()

  return {
    events,
    deliveryMetrics,
    navigationReadyMs
  }
}

async function waitForBenchmarkReady(page: Page) {
  await page.waitForFunction(() => (window as Window & { __benchmarkReady?: boolean }).__benchmarkReady === true, undefined, { timeout: 15000 })
}

async function assertDeliveryModeCorrect(page: Page, modeId: DeliveryModeId) {
  const state = await page.evaluate(() => ({
    ready: document.documentElement.dataset.benchmarkReady,
    textAlign: getComputedStyle(document.getElementById('benchmark-style-probe')!).textAlign,
    runtimeAvailable: Boolean(globalThis.masterCSSRuntime),
    htmlHidden: document.documentElement.hasAttribute('hidden')
  }))

  if (state.ready !== 'true') {
    throw new Error('Benchmark page did not set the ready marker.')
  }

  if (state.textAlign !== 'center') {
    throw new Error(`Expected style probe text-align:center, received ${state.textAlign}.`)
  }

  if (modeId === 'master-runtime') {
    if (!state.runtimeAvailable) throw new Error(`${modeId} did not expose globalThis.masterCSSRuntime.`)
    if (state.htmlHidden) throw new Error('Master runtime variant did not reveal the hidden html element.')
  }
}

async function readDeliveryMetrics(page: Page) {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const metrics = globalThis.__deliveryMetrics || {}

    return {
      requestCount: resources.filter((entry) => entry.name.startsWith(location.origin)).length + 1,
      runtimeReadyMs: metrics.runtimeReadyMs || 0,
      runtimeBootstrapMs: metrics.runtimeBootstrapMs || 0,
      runtimeObserveMs: metrics.runtimeObserveMs || 0,
      runtimeGeneratedRuleCount: metrics.runtimeGeneratedRuleCount || 0,
      runtimeStyleRawBytes: metrics.runtimeStyleRawBytes || 0
    }
  })
}

function summarizeTraceEvents(events: ChromeTraceEvent[]) {
  return {
    stylesheetParseMs: sumTraceDurations(events, new Set([
      'ParseAuthorStyleSheet',
      'ParseStyleSheet',
      'CSSParserImpl::parseStyleSheet'
    ])),
    styleRecalculationMs: sumTraceDurations(events, new Set([
      'UpdateLayoutTree',
      'RecalculateStyles',
      'Document::updateStyle'
    ])),
    layoutMs: sumTraceDurations(events, new Set(['Layout'])),
    paintMs: sumTraceDurations(events, new Set(['PrePaint', 'Paint'])),
    longTaskCount: countLongTasks(events)
  }
}

function sumTraceDurations(events: ChromeTraceEvent[], names: Set<string>) {
  return events.reduce((total, event) => {
    if (event.ph !== 'X' || !event.name || !names.has(event.name) || !event.dur) return total
    return total + event.dur / 1000
  }, 0)
}

function countLongTasks(events: ChromeTraceEvent[]) {
  return events.filter((event) => (
    event.ph === 'X'
    && typeof event.dur === 'number'
    && event.dur >= 50000
    && Boolean(event.name?.includes('RunTask') || event.name?.includes('ProcessTask'))
  )).length
}

async function startStaticFileServer(root: string) {
  const resolvedRoot = resolve(root)
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1')
      const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1))
      const file = resolve(resolvedRoot, relativePath)
      const relativeFile = relative(resolvedRoot, file)

      if (relativeFile.startsWith('..') || isAbsolute(relativeFile)) {
        response.writeHead(403)
        response.end('Forbidden')
        return
      }

      const body = await readFile(file)
      response.writeHead(200, {
        'content-type': getContentType(file),
        'cache-control': 'public, max-age=3600, immutable'
      })
      response.end(body)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.writeHead(404)
        response.end('Not found')
        return
      }

      response.writeHead(500)
      response.end((error as Error).message)
    }
  })

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen)
      resolveListen()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server)
    throw new Error('Unable to allocate local delivery mode benchmark server port.')
  }

  return {
    origin: `http://127.0.0.1:${address.port}/`,
    close: () => closeServer(server)
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose())
  })
}

function getContentType(file: string) {
  switch (extname(file)) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

async function readRuntimeBundle() {
  const file = resolveBenchmarkPackageFile('@stet-css/runtime', 'dist/global.min.js')
  assertExistingFile(file, 'Run `bun run --filter @stet-css/runtime build` before `bench:master-delivery-modes`.')
  return readFile(file)
}

function assertExistingFile(file: string, message: string) {
  if (!existsSync(file)) {
    throw new Error(`Missing file: ${file}\n${message}`)
  }
}

declare global {
  var MasterCSSRuntime: {
    prototype: {
      observe: (...args: unknown[]) => unknown
    }
  }
  var masterCSSRuntime: object | undefined
  var __deliveryMetrics: {
    error?: string
    runtimeScriptLoadedMs?: number
    runtimeReadyMs?: number
    runtimeBootstrapMs?: number
    runtimeObserveMs?: number
    runtimeGeneratedRuleCount?: number
    runtimeStyleRawBytes?: number
  } | undefined

  interface Window {
    __benchmarkReady?: boolean
  }
}
