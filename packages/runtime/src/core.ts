import { MasterCSS, isUndeclaredModeError } from '@stet-css/engine'
import type { MasterCSSManifest } from '@stet-css/schema/manifest'
import type { MasterCSSEmittedGlobals } from '@stet-css/engine'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@stet-css/schema/runtime-style'
import registerGlobal, { isRuntimeClass } from './register-global'
import { hostOf, isDocumentRoot, ownerDocumentOf, readDocument } from './document'
import RuntimeUtilityLayer from './utility-layer'
import RuntimeThemeLayer from './theme-layer'
import RuntimeClassTracker from './class-tracker'
import { browserNativeDeclarationMatcher } from './native-declaration'
import {
  debugRuntimeCreated,
  debugRuntimeDestroyed,
  debugRuntimeDisconnected,
  debugRuntimeMutation,
  debugRuntimeObserved,
  debugRuntimeRefreshed
} from './debuggers'

const RETAINED_CLASS_RULE_MIN_AGE_MS = 1000
const RETAINED_CLASS_RULE_IDLE_TIMEOUT_MS = 5000
const RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE = 64
const RETAINED_CLASS_RULE_SOFT_TARGET = 128
const RETAINED_CLASS_RULE_HARD_LIMIT = 512
const RETAINED_CLASS_RULE_HARD_RAW_BYTES = 256 * 1024

interface RetainedClassRule {
  retainedAt: number
  rawBytes: number
  ruleCount: number
}

interface RuntimeCleanupWindow {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
  setTimeout: typeof globalThis.setTimeout
  clearTimeout: typeof globalThis.clearTimeout
}

export interface CSSRuntimeCreateOptions {
  manifest: MasterCSSManifest
  root?: Document | ShadowRoot
  emittedGlobals?: MasterCSSEmittedGlobals
}

export default class CSSRuntime extends MasterCSS {
  /**
   * Another copy of the runtime on the page (a CDN script beside a bundled import) may already
   * hold the `MasterCSSRuntime` global. Share its instances so each root keeps a single runtime.
   */
  static instances: WeakMap<Document | ShadowRoot, CSSRuntime> = isRuntimeClass(globalThis.MasterCSSRuntime)
    ? globalThis.MasterCSSRuntime.instances
    : new WeakMap()
  readonly host: Element
  readonly container: HTMLElement | ShadowRoot
  readonly baseLayer = new RuntimeUtilityLayer('base', this)
  readonly themeLayer = new RuntimeThemeLayer('theme', this)
  readonly defaultsLayer = new RuntimeUtilityLayer('defaults', this)
  readonly componentsLayer = new RuntimeUtilityLayer('components', this)
  readonly utilitiesLayer = new RuntimeUtilityLayer('utilities', this)
  readonly classCounts = new Map<string, number>()
  readonly retainedClassNames = new Set<string>()
  private readonly classTracker = new RuntimeClassTracker()
  private readonly pendingAddedClassNames = new Set<string>()
  private readonly pendingRemovedClassNames = new Set<string>()
  private readonly retainedClassRules = new Map<string, RetainedClassRule>()
  private pendingAdditionFrame: number | undefined
  private pendingRemovalFrame: number | undefined
  private pendingRemovalFlushFrame: number | undefined
  private retainedCleanupIdleHandle: number | undefined
  private retainedCleanupTimeoutHandle: ReturnType<typeof globalThis.setTimeout> | undefined
  observer?: MutationObserver
  observing = false

  static create(options: CSSRuntimeCreateOptions): CSSRuntime {
    const { manifest, root = document, emittedGlobals } = options
    const current = CSSRuntime.instances.get(root)
    if (current) {
      current.registerEmittedGlobals(emittedGlobals)
      return current
    }
    try {
      return new CSSRuntime(root, manifest, emittedGlobals).register()
    } catch (error) {
      // An invalid manifest or a broken environment must not leave a hidden page blank.
      hostOf(root).removeAttribute('hidden')
      throw error
    }
  }

  constructor(
    public root: Document | ShadowRoot = document,
    manifest: MasterCSSManifest,
    emittedGlobals?: MasterCSSEmittedGlobals
  ) {
    super(manifest, emittedGlobals, {
      nativeDeclarationMatcher: browserNativeDeclarationMatcher
    })
    this.container = isDocumentRoot(root) ? readDocument(root, 'head') : root
    this.host = hostOf(root)
    this.applyEmittedGlobalsCounts({
      variables: this.emittedGlobals.variables
    })
  }

  register(): this {
    const registered = CSSRuntime.instances.get(this.root) === this
    CSSRuntime.instances.set(this.root, this)
    if (isDocumentRoot(this.root)) {
      readDocument(this.root, 'defaultView')!.globalThis.masterCSSRuntime = this
    }
    if (!registered && process.env.NODE_ENV === 'development') {
      debugRuntimeCreated(this)
    }
    return this
  }

  unregister(): this {
    CSSRuntime.instances.delete(this.root)
    if (isDocumentRoot(this.root)) {
      const scope = readDocument(this.root, 'defaultView')!.globalThis
      if (scope.masterCSSRuntime === this) scope.masterCSSRuntime = undefined as unknown as CSSRuntime
    }
    return this
  }

  private createRuntimeStyle() {
    const ownerDocument = ownerDocumentOf(this.root)
    // `.call` drops the tag-name overload, so restate the element type.
    const style = readDocument(ownerDocument, 'createElement').call(ownerDocument, 'style') as HTMLStyleElement
    style.id = MASTER_CSS_RUNTIME_STYLE_ID
    style.setAttribute('blocking', 'render')
    this.style = style
    this.container.append(style)
  }

  private getAnimationFrameWindow() {
    const ownerDocument = ownerDocumentOf(this.root)
    return (ownerDocument && readDocument(ownerDocument, 'defaultView')) || globalThis
  }

  private cancelPendingRemovalFrames() {
    const view = this.getAnimationFrameWindow()
    if (this.pendingRemovalFrame !== undefined) {
      view.cancelAnimationFrame(this.pendingRemovalFrame)
      this.pendingRemovalFrame = undefined
    }
    if (this.pendingRemovalFlushFrame !== undefined) {
      view.cancelAnimationFrame(this.pendingRemovalFlushFrame)
      this.pendingRemovalFlushFrame = undefined
    }
  }

  private cancelPendingAdditionFrame() {
    if (this.pendingAdditionFrame === undefined) return
    const view = this.getAnimationFrameWindow()
    view.cancelAnimationFrame(this.pendingAdditionFrame)
    this.pendingAdditionFrame = undefined
  }

  private clearPendingAddedClassNames() {
    this.pendingAddedClassNames.clear()
    this.cancelPendingAdditionFrame()
  }

  private clearPendingRemovedClassNames() {
    this.pendingRemovedClassNames.clear()
    this.cancelPendingRemovalFrames()
  }

  private getCleanupWindow() {
    return this.getAnimationFrameWindow() as RuntimeCleanupWindow
  }

  private cancelRetainedClassRuleCleanup() {
    const view = this.getCleanupWindow()
    if (this.retainedCleanupIdleHandle !== undefined) {
      view.cancelIdleCallback?.(this.retainedCleanupIdleHandle)
      this.retainedCleanupIdleHandle = undefined
    }
    if (this.retainedCleanupTimeoutHandle !== undefined) {
      view.clearTimeout(this.retainedCleanupTimeoutHandle)
      this.retainedCleanupTimeoutHandle = undefined
    }
  }

  private clearRetainedClassRules() {
    this.retainedClassNames.clear()
    this.retainedClassRules.clear()
    this.cancelRetainedClassRuleCleanup()
  }

  private cancelPendingRemovedClassNames(classNames: Iterable<string>) {
    if (!this.pendingRemovedClassNames.size) return
    for (const className of classNames) {
      this.pendingRemovedClassNames.delete(className)
    }
    if (!this.pendingRemovedClassNames.size) this.cancelPendingRemovalFrames()
  }

  private cancelPendingAddedClassNames(classNames: Iterable<string>) {
    if (!this.pendingAddedClassNames.size) return
    for (const className of classNames) {
      this.pendingAddedClassNames.delete(className)
    }
    if (!this.pendingAddedClassNames.size) this.cancelPendingAdditionFrame()
  }

  private cancelRetainedClassNames(classNames: Iterable<string>) {
    if (!this.retainedClassNames.size) return
    for (const className of classNames) {
      this.retainedClassNames.delete(className)
      this.retainedClassRules.delete(className)
    }
    if (!this.retainedClassNames.size) this.cancelRetainedClassRuleCleanup()
  }

  private schedulePendingRemovalFlush() {
    if (!this.pendingRemovedClassNames.size) return
    if (this.pendingRemovalFrame !== undefined || this.pendingRemovalFlushFrame !== undefined) return
    const view = this.getAnimationFrameWindow()
    this.pendingRemovalFrame = view.requestAnimationFrame(() => {
      this.pendingRemovalFrame = undefined
      this.pendingRemovalFlushFrame = view.requestAnimationFrame(() => {
        this.pendingRemovalFlushFrame = undefined
        this.flushPendingRemovedClassNames()
      })
    })
  }

  private queueRemovedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) {
      if (!this.classCounts.has(className)) this.pendingRemovedClassNames.add(className)
    }
    this.schedulePendingRemovalFlush()
  }

  private schedulePendingAdditionFlush() {
    if (!this.pendingAddedClassNames.size) return
    if (this.pendingAdditionFrame !== undefined) return
    const view = this.getAnimationFrameWindow()
    this.pendingAdditionFrame = view.requestAnimationFrame(() => {
      this.pendingAdditionFrame = undefined
      this.flushPendingAddedClassNames()
    })
  }

  private queueAddedClassNames(classNames: Iterable<string>) {
    for (const className of classNames) {
      if (this.classCounts.has(className)) this.pendingAddedClassNames.add(className)
    }
    this.schedulePendingAdditionFlush()
  }

  private estimateRetainedClassRule(className: string): RetainedClassRule | undefined {
    const rules = this.classUtilities.get(className)
    if (!rules?.length) return
    let rawBytes = 0
    let ruleCount = 0
    for (const rule of rules) {
      const nodes = (rule as { nodes?: { text: string }[] }).nodes
      if (nodes?.length) {
        for (const node of nodes) {
          rawBytes += node.text.length
          ruleCount++
        }
      } else {
        rawBytes += rule.text.length
        ruleCount++
      }
    }
    return {
      retainedAt: Date.now(),
      rawBytes,
      ruleCount
    }
  }

  private getRetainedClassRuleRawBytes() {
    let rawBytes = 0
    for (const retainedRule of this.retainedClassRules.values()) {
      rawBytes += retainedRule.rawBytes
    }
    return rawBytes
  }

  private exceedsRetainedClassRuleHardLimits() {
    return this.retainedClassNames.size > RETAINED_CLASS_RULE_HARD_LIMIT
      || this.getRetainedClassRuleRawBytes() > RETAINED_CLASS_RULE_HARD_RAW_BYTES
  }

  private scheduleRetainedClassRuleCleanup() {
    if (!this.retainedClassNames.size) return
    if (this.retainedCleanupIdleHandle !== undefined || this.retainedCleanupTimeoutHandle !== undefined) return
    const view = this.getCleanupWindow()
    const hardLimitExceeded = this.exceedsRetainedClassRuleHardLimits()
    const cleanup = () => {
      this.retainedCleanupIdleHandle = undefined
      this.retainedCleanupTimeoutHandle = undefined
      this.cleanupRetainedClassRules()
    }
    const timeout = hardLimitExceeded ? 0 : RETAINED_CLASS_RULE_IDLE_TIMEOUT_MS
    if (view.requestIdleCallback) {
      this.retainedCleanupIdleHandle = view.requestIdleCallback(cleanup, { timeout })
    } else {
      this.retainedCleanupTimeoutHandle = view.setTimeout(cleanup, timeout)
    }
  }

  private retainRemovedClassRules(classNames: string[]) {
    for (const className of classNames) {
      if (this.classCounts.has(className)) continue
      const retainedRule = this.retainedClassRules.get(className) || this.estimateRetainedClassRule(className)
      if (!retainedRule) continue
      this.retainedClassNames.add(className)
      this.retainedClassRules.set(className, retainedRule)
    }
    this.scheduleRetainedClassRuleCleanup()
  }

  private getRetainedClassRuleCleanupCandidates(force = false) {
    const now = Date.now()
    const hardLimitExceeded = this.exceedsRetainedClassRuleHardLimits()
    const entries: [string, RetainedClassRule][] = []

    for (const className of this.retainedClassNames) {
      if (this.classCounts.has(className)) {
        this.retainedClassNames.delete(className)
        this.retainedClassRules.delete(className)
        continue
      }
      const retainedRule = this.retainedClassRules.get(className)
      if (!retainedRule) {
        this.retainedClassNames.delete(className)
        continue
      }
      const oldEnough = now - retainedRule.retainedAt >= RETAINED_CLASS_RULE_MIN_AGE_MS
      if (force || hardLimitExceeded || (oldEnough && this.retainedClassNames.size > RETAINED_CLASS_RULE_SOFT_TARGET)) {
        entries.push([className, retainedRule])
      }
    }

    entries.sort(([, a], [, b]) => a.retainedAt - b.retainedAt)
    const cleanupCount = hardLimitExceeded
      ? Math.max(RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE, this.retainedClassNames.size - RETAINED_CLASS_RULE_SOFT_TARGET)
      : RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE
    return entries
      .slice(0, force ? entries.length : cleanupCount)
      .map(([className]) => className)
  }

  private removeRetainedClassRules(classNames: string[]) {
    const removedClassNames: string[] = []
    for (const className of classNames) {
      if (!this.retainedClassNames.has(className)) continue
      this.retainedClassNames.delete(className)
      this.retainedClassRules.delete(className)
      if (!this.classCounts.has(className)) {
        removedClassNames.push(className)
      }
    }
    if (removedClassNames.length) super.deleteClassRules(...removedClassNames)
    return removedClassNames.length
  }

  private cleanupRetainedClassRules(force = false) {
    const removedCount = this.removeRetainedClassRules(this.getRetainedClassRuleCleanupCandidates(force))
    if (this.retainedClassNames.size && (force || this.retainedClassNames.size > RETAINED_CLASS_RULE_SOFT_TARGET || this.exceedsRetainedClassRuleHardLimits())) {
      this.scheduleRetainedClassRuleCleanup()
    }
    return removedCount
  }

  flushRetainedClassRules() {
    this.cancelRetainedClassRuleCleanup()
    const removedCount = this.cleanupRetainedClassRules(true)
    if (this.retainedClassNames.size) this.scheduleRetainedClassRuleCleanup()
    return removedCount
  }

  private flushPendingRemovedClassNames() {
    if (!this.pendingRemovedClassNames.size) return
    const classNames: string[] = []
    for (const className of this.pendingRemovedClassNames) {
      if (!this.classCounts.has(className)) classNames.push(className)
    }
    this.pendingRemovedClassNames.clear()
    if (classNames.length) this.retainRemovedClassRules(classNames)
  }

  private flushPendingAddedClassNames() {
    if (!this.pendingAddedClassNames.size) return
    const classNames: string[] = []
    for (const className of this.pendingAddedClassNames) {
      if (this.classCounts.has(className)) classNames.push(className)
    }
    this.pendingAddedClassNames.clear()
    if (classNames.length) this.ensureClassRules(...classNames)
  }

  private handleMutationRecords(records: MutationRecord[]) {
    const deltaCounts = this.classTracker.collectMutations(records)
    const warmClassNames: string[] = []
    const queuedClassNames: string[] = []
    const removedClassNames: string[] = []

    for (const [cls, change] of deltaCounts) {
      const current = this.classCounts.get(cls) || 0
      const next = current + change
      if (next > 0) {
        this.classCounts.set(cls, next)
        if (current === 0) {
          if (this.classUtilities.has(cls) || this.retainedClassNames.has(cls)) {
            warmClassNames.push(cls)
          } else {
            queuedClassNames.push(cls)
          }
        }
      } else {
        this.classCounts.delete(cls)
        removedClassNames.push(cls)
      }
    }

    if (warmClassNames.length) this.ensureClassRules(...warmClassNames)
    if (queuedClassNames.length) this.queueAddedClassNames(queuedClassNames)
    if (removedClassNames.length) {
      this.cancelPendingAddedClassNames(removedClassNames)
      this.queueRemovedClassNames(removedClassNames)
    }

    if (process.env.NODE_ENV === 'development') {
      debugRuntimeMutation(records, deltaCounts, this)
    }
  }

  ensureClassRules(...classNames: string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    this.cancelRetainedClassNames(classNames)
    for (const className of classNames) {
      try {
        super.ensureClassRules(className)
      } catch (error) {
        // One class naming an undeclared mode must not stop CSS for the rest of the page.
        if (!isUndeclaredModeError(error)) throw error
        console.error(error.message)
      }
    }
    return this
  }

  deleteClassRules(...classNames: string[]) {
    this.cancelPendingAddedClassNames(classNames)
    this.cancelPendingRemovedClassNames(classNames)
    this.cancelRetainedClassNames(classNames)
    super.deleteClassRules(...classNames)
  }

  private startMutationObserver() {
    this.observer = new MutationObserver(records => this.handleMutationRecords(records))

    this.observer.observe(this.root, {
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    })
  }

  /**
   * Observe the DOM for changes and update the running stylesheet. (browser only)
   * @param options mutation observer options
   * @returns this
   */
  observe(): this {
    if (this.observing) return this

    try {
      const connectedNames = this.classTracker.collectConnected(this.root, this.classCounts)
      this.createRuntimeStyle()
      this.insertStaticResources()
      connectedNames.forEach(cls => this.ensureClassRules(cls))
      this.startMutationObserver()
    } finally {
      // Reveal after the first render, and also when it throws, so a hidden page never stays blank.
      this.host.removeAttribute('hidden')
    }
    this.observing = true
    if (process.env.NODE_ENV === 'development') {
      debugRuntimeObserved(this)
    }
    return this
  }

  disconnect() {
    this.clearPendingAddedClassNames()
    this.clearPendingRemovedClassNames()
    this.clearRetainedClassRules()
    if (!this.observing) return
    if (this.observer) {
      this.observer.disconnect()
      this.observer = undefined
    }
    // @ts-ignore
    this.observing = false
    this.reset()
    this.loadManifest(this.manifest)
    this.classCounts.clear()
    this.classTracker.reset()
    this.style?.remove()
    this.style = null
    if (process.env.NODE_ENV === 'development') {
      debugRuntimeDisconnected(this)
    }
    return this
  }

  refresh(manifest: MasterCSSManifest = this.manifest) {
    this.clearPendingAddedClassNames()
    this.clearPendingRemovedClassNames()
    this.clearRetainedClassRules()
    if (!this.observing || !this.style!.sheet) return this
    const cssRules = this.style!.sheet.cssRules
    for (let i = cssRules.length - 1; i >= 0; i--) {
      this.style!.sheet.deleteRule(i)
    }
    super.refresh(manifest)
    /**
     * Recreate rules from the current class names against the latest manifest.
     * 所以 refresh 過後 rules 可能會變多也可能會變少
     */
    this.classCounts.forEach((_, className) => {
      this.ensureClassRules(className)
    })
    if (process.env.NODE_ENV === 'development') {
      debugRuntimeRefreshed(this, manifest)
    }
    return this
  }

  destroy() {
    this.disconnect()
    this.unregister()
    if (process.env.NODE_ENV === 'development') {
      debugRuntimeDestroyed(this)
    }
    return this
  }
}

(function (CSSRuntime) {
  registerGlobal(CSSRuntime)
})(CSSRuntime)
