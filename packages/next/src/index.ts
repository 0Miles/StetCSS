import { fileURLToPath } from 'node:url'
import { relative } from 'node:path'
import type { NextConfig } from 'next'
import type { TurbopackLoaderOptions } from 'next/dist/server/config-shared'
import { escapeRegExp } from '@stet-css/lexer'
import { validatePluginOptions } from '@stet-css/scanner'
import { createStetCSSManifestEntryPattern } from '@stet-css/project/entries'
import {
  MASTER_CSS_MANIFEST_QUERY,
  VIRTUAL_MANIFEST_ID
} from '@stet-css/integration/manifest-module'
import { VIRTUAL_CSS_ID } from '@stet-css/integration/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@stet-css/integration/emitted-globals-module'
import {
  createVirtualDefaultManifestModulePathPattern,
  ensureVirtualManifestModulePath,
  ensureVirtualEmittedGlobalsModulePath
} from '@stet-css/integration/node'
import { ensureStaticOutputFile } from './static'
import type { Options } from './options'
import type { GeneratedCSSLoaderOptions } from './generated-css-loader'
import type { StyleCSSLoaderOptions } from './style-css-loader'

type WebpackConfig = Parameters<NonNullable<NextConfig['webpack']>>[0]
type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1]
type TurbopackConfig = NonNullable<NextConfig['turbopack']>
type TurbopackRules = NonNullable<TurbopackConfig['rules']>
type TurbopackRuleConfigCollection = TurbopackRules[string]

const MASTER_CSS_MANIFEST_RESOURCE_QUERY = new RegExp(MASTER_CSS_MANIFEST_QUERY.slice(1))
const MASTER_CSS_MANIFEST_IMPORT_CONTENT_PATTERN = new RegExp(`\\${MASTER_CSS_MANIFEST_QUERY}`)
const MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN = createVirtualDefaultManifestModulePathPattern()
/**
 * Stylesheet entries, and local stylesheets with directives the style loader lowers or
 * rejects (`@dark` and `@light` were folded into `@variant`; `@master` at-rules were removed in
 * favour of `@import '@stet-css/core'` and `@settings`).
 */
const MASTER_CSS_STYLE_CONTENT_PATTERN = new RegExp(`${createStetCSSManifestEntryPattern().source}|@(compose|variant|reference|dark|light|master)\\b`)
const STYLE_FILE_PATTERN = /\.(css|scss|sass)$/

interface MasterCSSNextSetup {
  projectDir: string
  /** Custom source adapters, given to the webpack loaders only. */
  adapters: NonNullable<Options['adapters']>
  /** The generated CSS module, absolute. */
  outputPath: string
  virtualManifestPath: string
  virtualEmittedGlobalsPath: string
  generatedCSSLoader: { loader: string, options: GeneratedCSSLoaderOptions }
  styleCSSLoader: { loader: string, options: StyleCSSLoaderOptions }
  cssManifestLoaderPath: string
  cssManifestImportLoaderPath: string
}

function resolveLoaderPath(file: string) {
  return fileURLToPath(new URL(`./${file}`, import.meta.url))
}

function toTurbopackProjectPath(file: string, projectDir: string) {
  const relativePath = relative(projectDir, file).replace(/\\/g, '/')
  return relativePath.startsWith('./') || relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

function toRuleArray(rule: TurbopackRuleConfigCollection | undefined) {
  return Array.isArray(rule) ? rule : rule ? [rule] : []
}

/** Turbopack passes loader options to its workers as JSON, so they never carry adapters. */
function toTurbopackLoader(loader: { loader: string, options: object }) {
  return {
    loader: loader.loader,
    options: loader.options as TurbopackLoaderOptions
  }
}

/** A loader for the webpack rules, whose options may carry the adapters' functions. */
function withAdapters<T extends { loader: string, options: object }>(loader: T, adapters: MasterCSSNextSetup['adapters'], options: object = {}) {
  return { ...loader, options: { ...loader.options, adapters, ...options } }
}

function createExactPathPattern(file: string) {
  return new RegExp(`^${escapeRegExp(file)}$`)
}

/** Matches the generated CSS module whether the bundler passes an absolute or project-relative path. */
function createGeneratedCSSPathPattern(outputPath: string, projectDir: string) {
  const projectPath = relative(projectDir, outputPath)
    .split(/[\\/]/)
    .map(escapeRegExp)
    .join(String.raw`[/\\]`)
  return new RegExp(String.raw`(?:^|[/\\])${projectPath}$`)
}

function applyMasterCSSWebpackConfig(config: WebpackConfig, setup: MasterCSSNextSetup) {
  config.module ??= {}
  config.module.rules ??= []
  config.module.rules.push(
    {
      test: MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN,
      use: [{
        loader: setup.cssManifestLoaderPath,
        options: { virtual: true, module: true, external: true }
      }]
    },
    {
      resourceQuery: MASTER_CSS_MANIFEST_RESOURCE_QUERY,
      use: [{
        loader: setup.cssManifestLoaderPath,
        options: { module: true, external: true }
      }]
    },
    // `resource` instead of `test`: Next disables its built-in CSS pipeline when a user rule's
    // `test` or `include` matches `.css` files.
    {
      resource: createExactPathPattern(setup.outputPath),
      use: [withAdapters(setup.generatedCSSLoader, setup.adapters)]
    },
    {
      resource: {
        and: [STYLE_FILE_PATTERN],
        not: [createExactPathPattern(setup.outputPath)]
      },
      resourceQuery: { not: [MASTER_CSS_MANIFEST_RESOURCE_QUERY] },
      use: [withAdapters(setup.styleCSSLoader, setup.adapters, { writeOutput: true })]
    }
  )
  config.resolve ??= {}
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    [VIRTUAL_CSS_ID]: setup.outputPath,
    [VIRTUAL_MANIFEST_ID]: setup.virtualManifestPath,
    [VIRTUAL_EMITTED_GLOBALS_ID]: setup.virtualEmittedGlobalsPath
  }
  return config
}

function createCSSManifestImportSourceRules(setup: MasterCSSNextSetup) {
  const loader = {
    loader: setup.cssManifestImportLoaderPath,
    options: { projectDir: setup.projectDir }
  }
  const sourceRules = [
    ['*.js', 'ecmascript'],
    ['*.cjs', 'ecmascript'],
    ['*.ts', 'typescript']
  ] as const
  return sourceRules.map(([glob, type]) => [glob, {
    condition: {
      all: [
        { not: 'foreign' as const },
        { content: MASTER_CSS_MANIFEST_IMPORT_CONTENT_PATTERN }
      ]
    },
    type,
    loaders: [loader]
  }] as const)
}

function applyMasterCSSTurbopackConfig(turbopack: TurbopackConfig = {}, setup: MasterCSSNextSetup): TurbopackConfig {
  const rules = turbopack.rules || {}
  const resolveAlias = turbopack.resolveAlias || {}
  const generatedCSSPathPattern = createGeneratedCSSPathPattern(setup.outputPath, setup.projectDir)
  const generatedCSSRule = {
    condition: { path: generatedCSSPathPattern },
    loaders: [toTurbopackLoader(setup.generatedCSSLoader)],
    type: 'css' as const,
    as: '*.css'
  }
  const styleCSSRule = {
    condition: {
      all: [
        { path: STYLE_FILE_PATTERN },
        { not: { path: generatedCSSPathPattern } },
        { content: MASTER_CSS_STYLE_CONTENT_PATTERN },
        { not: { query: MASTER_CSS_MANIFEST_RESOURCE_QUERY } }
      ]
    },
    loaders: [toTurbopackLoader(setup.styleCSSLoader)],
    type: 'css' as const,
    as: '*.css'
  }
  const virtualManifestRule = {
    condition: { path: MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN },
    loaders: [{
      loader: setup.cssManifestLoaderPath,
      options: { virtual: true, module: true, external: true }
    }],
    type: 'ecmascript' as const
  }
  const manifestQueryRule = {
    condition: {
      all: [
        { path: /\.css$/ },
        { query: MASTER_CSS_MANIFEST_RESOURCE_QUERY }
      ]
    },
    loaders: [{
      loader: setup.cssManifestLoaderPath,
      options: { module: true, external: true }
    }],
    type: 'ecmascript' as const,
    as: '*.js'
  }
  return {
    ...turbopack,
    resolveAlias: {
      ...resolveAlias,
      [VIRTUAL_CSS_ID]: toTurbopackProjectPath(setup.outputPath, setup.projectDir),
      [VIRTUAL_MANIFEST_ID]: toTurbopackProjectPath(setup.virtualManifestPath, setup.projectDir),
      [VIRTUAL_EMITTED_GLOBALS_ID]: toTurbopackProjectPath(setup.virtualEmittedGlobalsPath, setup.projectDir)
    },
    rules: {
      ...rules,
      ...Object.fromEntries(createCSSManifestImportSourceRules(setup).map(([glob, rule]) => [
        glob,
        [rule, ...toRuleArray(rules[glob])]
      ])),
      '*': [
        generatedCSSRule,
        styleCSSRule,
        virtualManifestRule,
        manifestQueryRule,
        ...toRuleArray(rules['*'])
      ]
    } satisfies TurbopackRules
  }
}

/**
 * Adds StetCSS to a Next.js config. Stylesheet entries (`@import '@stet-css/core'`) import
 * one generated CSS module whose content is computed from the project's files, for both
 * Turbopack and `--webpack`. Returns a plain config object synchronously, so other `withX`
 * wrappers compose on either side.
 * @param options - Only `adapters`; a removed or unknown key throws. Custom adapters need
 * webpack (`next dev --webpack`, `next build --webpack`).
 */
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T {
  validatePluginOptions(options, '@stet-css/next')
  const adapters = options.adapters ?? []
  // `next dev` and `next build` set TURBOPACK before loading the config when Turbopack runs.
  if (adapters.length && process.env.TURBOPACK) {
    throw new Error('[@stet-css/next] Custom adapters need webpack: run `next dev --webpack` and `next build --webpack`. Turbopack passes loader options to its workers as JSON, which drops the adapter functions.')
  }
  const projectDir = process.cwd()
  const outputPath = ensureStaticOutputFile(projectDir)
  const setup: MasterCSSNextSetup = {
    projectDir,
    adapters,
    outputPath,
    virtualManifestPath: ensureVirtualManifestModulePath(projectDir),
    virtualEmittedGlobalsPath: ensureVirtualEmittedGlobalsModulePath(projectDir),
    generatedCSSLoader: {
      loader: resolveLoaderPath('generated-css-loader.js'),
      options: { projectDir }
    },
    styleCSSLoader: {
      loader: resolveLoaderPath('style-css-loader.js'),
      options: { outputPath, projectDir }
    },
    cssManifestLoaderPath: resolveLoaderPath('css-manifest-loader.js'),
    cssManifestImportLoaderPath: resolveLoaderPath('css-manifest-import-loader.js')
  }
  const userWebpack = nextConfig.webpack
  return {
    ...nextConfig,
    turbopack: applyMasterCSSTurbopackConfig(nextConfig.turbopack, setup),
    webpack(config: WebpackConfig, context: WebpackContext) {
      const resolvedConfig = userWebpack ? userWebpack(config, context) || config : config
      return applyMasterCSSWebpackConfig(resolvedConfig, setup)
    }
  }
}

export type { Options } from './options'

export default withMasterCSS
