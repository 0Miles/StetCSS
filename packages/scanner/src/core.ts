import scannerOptions, { validateScannerOptions, type ScannerOptions } from './options'
import { StetCSS } from '@stet-css/core'
import type { StetCSSManifest } from '@stet-css/schema/manifest'
import { createRequire } from 'node:module'
import {
  extractSourceClassCandidates,
  resolveSourceAdapter,
  type SourceAdapter
} from '@stet-css/source'
import { createCSSWithNativeDeclarations, generateValidRules } from '@stet-css/validator'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { cssEscape } from '@stet-css/lexer'

const require = createRequire(import.meta.url)
const defaultManifest = require('@stet-css/preset/default-manifest.json') as StetCSSManifest

interface ScannerResetOptions {
  emit?: boolean
}

export interface ScannerSourceResult {
  /** Whether the source brought candidates this scanner had not seen, as `scan` returns. */
  changed: boolean
  /** Every unique class candidate the source contains, in source order. */
  candidates: string[]
}

/**
 * What a first-party caller validates candidates against. Not a user option: projects
 * configure classes in their CSS entry.
 * @internal
 */
export interface ScannerValidation {
  /** The manifest compiled from the project's entries; defaults to the preset's. */
  manifest?: StetCSSManifest
}

/**
 * Validates class candidates from supplied source text and caches the result: which classes
 * are valid, which are not, and which (source, content) pairs were already read. Which files
 * to read and which classes to force in or out is the stylesheet's class set.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default class CSSScanner extends EventEmitter {
  latentClasses = new Set<string>()
  validClasses = new Set<string>()
  invalidClasses = new Set<string>()
  initialized = false
  initializing?: Promise<this>
  resetDependencies: string[] = []

  /**
   * Per-source content-hash cache. When the same `source` arrives with the
   * same `content` (a caller re-reads an unchanged file), we skip re-running
   * extraction and re-validating every class.
   */
  private contentHashes = new Map<string, string>()

  /**
   * Memoized result of `generateValidRules` per syntax string. The same
   * class commonly appears in 100+ files in real codebases; without this,
   * we re-run css.generate() + validateCSS() per occurrence. With it, the
   * second occurrence is an O(1) Map lookup.
   */
  private validRulesCache = new Map<string, ReturnType<typeof generateValidRules>>()

  /**
   * @param validation - Internal: set by first-party callers only, kept across `reset()`.
   */
  constructor(
    public customOptions: ScannerOptions = {},
    public cwd = process.cwd(),
    public validation: ScannerValidation = {}
  ) {
    super()
  }

  init(customOptions: ScannerOptions = this.customOptions) {
    if (this.initialized) return Promise.resolve(this)
    if (this.initializing) return this.initializing
    return this.initializing = this.initInternal(customOptions)
      .finally(() => {
        this.initializing = undefined
      })
  }

  private async initInternal(customOptions: ScannerOptions = this.customOptions) {
    validateScannerOptions(customOptions)
    this.options = { ...scannerOptions, ...customOptions }
    this.resetDependencies = []
    this.css = createCSSWithNativeDeclarations(this.validation.manifest || defaultManifest)
    this.emit('init', this.options, this.manifest)
    this.initialized = true
    return this
  }

  async reset(
    customOptions: ScannerOptions = this.customOptions,
    resetOptions: ScannerResetOptions = {}
  ) {
    this.clearCaches()
    this.initialized = false
    this.initializing = undefined
    await this.init(customOptions)
    if (resetOptions.emit !== false) {
      this.emit('reset')
    }
    return this
  }

  async destroy() {
    this.clearCaches()
    this.removeAllListeners()
    this.emit('destroy')
    return this
  }

  private clearCaches() {
    this.latentClasses.clear()
    this.validClasses.clear()
    this.invalidClasses.clear()
    this.contentHashes.clear()
    this.validRulesCache.clear()
    this.resetDependencies = []
  }

  /**
   * @description Extract source content candidates.
   * @param source
   * @param content
   * @returns Promise<string[]> Latent classes
   */
  async collectCandidates(source: string, content: string): Promise<string[]> {
    return this.addLatentClasses(await this.extractCandidates(source, content))
  }

  /**
   * @description Extract trusted content candidates and scan.
   * @param source
   * @param content
   * @returns Whether the content brought candidates this scanner had not seen
   */
  async scan(source: string, content: string): Promise<boolean> {
    if (!content || this.isUnchangedSource(source, content)) {
      return false
    }
    return this.validateCandidates(await this.extractCandidates(source, content))
  }

  /**
   * Scans like `scan` and also returns every unique candidate this source contains, including
   * ones another source already brought, so a caller can tell which classes each source uses.
   */
  async scanSource(source: string, content: string): Promise<ScannerSourceResult> {
    if (!content) {
      return { changed: false, candidates: [] }
    }
    const unchanged = this.isUnchangedSource(source, content)
    const candidates = await this.extractCandidates(source, content)
    return {
      changed: unchanged ? false : this.validateCandidates(candidates),
      candidates
    }
  }

  private async extractCandidates(source: string, content: string): Promise<string[]> {
    if (!source || !content) {
      return []
    }
    return [...new Set(await extractSourceClassCandidates({ source, content }, this.options.adapters))]
  }

  /** Adds candidates to the latent classes and returns the ones this scanner had not seen. */
  private addLatentClasses(candidates: Iterable<string>): string[] {
    const latentClasses: string[] = []
    for (const eachLatentClasses of candidates) {
      if (!this.latentClasses.has(eachLatentClasses)) {
        this.latentClasses.add(eachLatentClasses)
        latentClasses.push(eachLatentClasses)
      }
    }
    return latentClasses
  }

  /**
   * Whether this exact (source, content) pair was already processed; records it otherwise.
   * HMR commonly re-fires unchanged files; vite can also call `transform` on the same module
   * twice. Hashing 1 KB of source via SHA-1 is ~2 µs; running scan + validate on it is ms.
   */
  private isUnchangedSource(source: string, content: string): boolean {
    if (!source) {
      return false
    }
    const hash = createHash('sha1').update(content).digest('hex')
    if (this.contentHashes.get(source) === hash) {
      return true
    }
    this.contentHashes.set(source, hash)
    return false
  }

  /**
   * Validates the candidates this scanner has not seen yet and inserts their rules.
   * @returns Whether any candidate was new
   */
  private validateCandidates(candidates: Iterable<string>): boolean {
    // Only candidates this scanner has not seen yet; valid and invalid classes are subsets.
    const latentClasses = this.addLatentClasses(candidates)
    if (!latentClasses.length) {
      return false
    }

    // Synchronous loop — generateValidRules is sync; the previous
    // `Promise.all(map(async))` was just microtask overhead with no
    // parallelism in single-threaded JS. Per-class result is also memoized
    // so repeated occurrences across files are O(1).
    let changed = false
    for (const eachLatentClass of latentClasses) {
      let validRules = this.validRulesCache.get(eachLatentClass)
      if (validRules === undefined) {
        validRules = generateValidRules(eachLatentClass, this.css)
        this.validRulesCache.set(eachLatentClass, validRules)
      }
      if (validRules.length) {
        for (const validRule of validRules) {
          validRule.layer.insert(validRule)
        }
        changed = true
        this.validClasses.add(eachLatentClass)
      } else {
        this.invalidClasses.add(eachLatentClass)
      }
    }
    if (changed) {
      this.emit('change')
    }
    return true
  }

  resolveSourceAdapter(source: string): SourceAdapter | undefined {
    return resolveSourceAdapter(source, this.options.adapters)
  }

  /**
   * The manifest the scanner validates candidates against.
   */
  get manifest(): StetCSSManifest {
    return this.css.manifest
  }

  get slotCSSRule(): string {
    return '#' + cssEscape('stet-css-slot') + '{--slot:0}'
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export default interface CSSScanner {
  css: StetCSS
  options: ScannerOptions
}
