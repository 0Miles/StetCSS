import { test, expect, type Page } from '@playwright/test'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@stet-css/schema/runtime-style'
import init from './init'

async function waitForRuntimeRemovalFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
  }))
}

async function waitForRuntimeRuleFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  }))
}

test('disconnect clears counts and observe rescans the current DOM', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<div class="block"></div>'
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(await page.evaluate(() => Object.fromEntries(globalThis.masterCSSRuntime.classCounts))).toEqual({
    block: 1
  })

  const disconnected = await page.evaluate(async () => {
    globalThis.masterCSSRuntime.disconnect()
    document.body.innerHTML = '<div class="font:bold"></div>'
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      hasStyle: !!document.head.querySelector('style#master-css')
    }
  })
  expect(disconnected).toEqual({
    counts: {},
    hasStyle: false
  })

  const reconnected = await page.evaluate(async () => {
    globalThis.masterCSSRuntime.observe()
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      text: globalThis.masterCSSRuntime.text
    }
  })
  expect(reconnected.counts).toEqual({
    'font:bold': 1
  })
  expect(reconnected.text).toContain(':root{--font-weight-bold:700}')
  expect(reconnected.text).toContain('.font\\:bold{font-weight:var(--font-weight-bold)}')
  expect(reconnected.text).not.toContain('.block{display:block}')
})

test('mutation removals keep counts immediate and retain CSSOM rules after settle', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
  })
  await waitForRuntimeRuleFlush(page)

  const duringFlushWindow = await page.evaluate(async () => {
    document.getElementById('target')?.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
      text: globalThis.masterCSSRuntime.text
    }
  })
  expect(duringFlushWindow.counts).toEqual({})
  expect(duringFlushWindow.hasClassUtility).toBe(true)
  expect(duringFlushWindow.text).toContain('.fg\\:red-60')

  await waitForRuntimeRemovalFlush(page)
  const afterFlush = await page.evaluate(() => ({
    counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
    hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
    text: globalThis.masterCSSRuntime.text
  }))
  expect(afterFlush).toEqual({
    counts: {},
    hasClassUtility: true,
    retainedClassNames: ['fg:red-60'],
    text: expect.stringContaining('.fg\\:red-60')
  })

  const afterForcedCleanup = await page.evaluate(() => ({
    removedCount: globalThis.masterCSSRuntime.flushRetainedClassRules(),
    counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
    hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
    text: globalThis.masterCSSRuntime.text
  }))
  expect(afterForcedCleanup).toEqual({
    removedCount: 1,
    counts: {},
    retainedClassNames: [],
    hasClassUtility: false,
    text: ''
  })
})

test('mutation removal flush keeps remaining native CSSOM references valid', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = [
      '<p id="keep" class="fg:blue-60"></p>',
      '<p id="target" class="fg:red-60 bg:green-60 animation:fade|1s"></p>'
    ].join('')
  })
  await waitForRuntimeRuleFlush(page)

  await page.evaluate(() => {
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const afterBatchFlush = await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime
    const sheetText = Array.from(runtime.style!.sheet!.cssRules)
      .map((cssRule) => cssRule.cssText)
      .join('\n')
    return {
      classUtilities: [...runtime.classUtilities.keys()],
      retainedClassNames: [...runtime.retainedClassNames],
      themeCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      animationCounts: Object.fromEntries(runtime.animationsNonLayer.tokenCounts),
      text: runtime.text,
      sheetText
    }
  })
  expect(afterBatchFlush.classUtilities).toEqual(['fg:blue-60', 'fg:red-60', 'bg:green-60', 'animation:fade|1s'])
  expect(afterBatchFlush.retainedClassNames).toEqual(['fg:red-60', 'bg:green-60', 'animation:fade|1s'])
  expect(afterBatchFlush.themeCounts).toEqual({
    'color-blue-60': 1,
    'color-red-60': 1,
    'color-green-60': 1
  })
  expect(afterBatchFlush.animationCounts).toEqual({
    fade: 1
  })
  expect(afterBatchFlush.text).toContain('.fg\\:blue-60')
  expect(afterBatchFlush.text).toContain('.fg\\:red-60')
  expect(afterBatchFlush.text).toContain('.bg\\:green-60')
  expect(afterBatchFlush.text).toContain('@keyframes fade')
  expect(afterBatchFlush.sheetText).toContain('.fg\\:blue-60')
  expect(afterBatchFlush.sheetText).toContain('.fg\\:red-60')
  expect(afterBatchFlush.sheetText).toContain('.bg\\:green-60')
  expect(afterBatchFlush.sheetText).toContain('@keyframes fade')

  const afterForcedCleanup = await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime
    const removedCount = runtime.flushRetainedClassRules()
    const sheetText = Array.from(runtime.style!.sheet!.cssRules)
      .map((cssRule) => cssRule.cssText)
      .join('\n')
    return {
      removedCount,
      classUtilities: [...runtime.classUtilities.keys()],
      retainedClassNames: [...runtime.retainedClassNames],
      themeCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      animationCounts: Object.fromEntries(runtime.animationsNonLayer.tokenCounts),
      text: runtime.text,
      sheetText
    }
  })
  expect(afterForcedCleanup.removedCount).toBe(3)
  expect(afterForcedCleanup.classUtilities).toEqual(['fg:blue-60'])
  expect(afterForcedCleanup.retainedClassNames).toEqual([])
  expect(afterForcedCleanup.themeCounts).toEqual({
    'color-blue-60': 1
  })
  expect(afterForcedCleanup.animationCounts).toEqual({})
  expect(afterForcedCleanup.text).toContain('.fg\\:blue-60')
  expect(afterForcedCleanup.text).not.toContain('.fg\\:red-60')
  expect(afterForcedCleanup.text).not.toContain('.bg\\:green-60')
  expect(afterForcedCleanup.text).not.toContain('@keyframes fade')
  expect(afterForcedCleanup.sheetText).toContain('.fg\\:blue-60')
  expect(afterForcedCleanup.sheetText).not.toContain('.fg\\:red-60')
  expect(afterForcedCleanup.sheetText).not.toContain('.bg\\:green-60')
  expect(afterForcedCleanup.sheetText).not.toContain('@keyframes fade')

  const afterDirectMutation = await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime
    runtime.ensureClassRules('block')
    runtime.deleteClassRules('fg:blue-60')
    const sheetText = Array.from(runtime.style!.sheet!.cssRules)
      .map((cssRule) => cssRule.cssText)
      .join('\n')
    return {
      classUtilities: [...runtime.classUtilities.keys()],
      themeCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      text: runtime.text,
      sheetText
    }
  })
  expect(afterDirectMutation.classUtilities).toEqual(['block'])
  expect(afterDirectMutation.themeCounts).toEqual({})
  expect(afterDirectMutation.text).toBe('@layer utilities{.block{display:block}}')
  expect(afterDirectMutation.sheetText).toContain('.block')
  expect(afterDirectMutation.sheetText).not.toContain('.fg\\:blue-60')
})

test('re-adding a retained class cancels retained cleanup', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const afterReadd = await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    const removedCount = globalThis.masterCSSRuntime.flushRetainedClassRules()
    return {
      removedCount,
      counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
      hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
      text: globalThis.masterCSSRuntime.text
    }
  })
  expect(afterReadd.counts).toEqual({
    'fg:red-60': 1
  })
  expect(afterReadd.removedCount).toBe(0)
  expect(afterReadd.retainedClassNames).toEqual([])
  expect(afterReadd.hasClassUtility).toBe(true)
  expect(afterReadd.text).toContain('.fg\\:red-60')
})

test('direct remove deletes retained CSSOM rules synchronously', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const afterDirectRemove = await page.evaluate(() => {
    globalThis.masterCSSRuntime.deleteClassRules('fg:red-60')
    return {
      retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
      hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
      text: globalThis.masterCSSRuntime.text
    }
  })
  expect(afterDirectRemove).toEqual({
    retainedClassNames: [],
    hasClassUtility: false,
    text: ''
  })
})

test('retained hard-limit cleanup returns to soft target and preserves active classes', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async () => {
    const idleCallbacks = new Map<number, IdleRequestCallback>()
    const nativeRequestIdleCallback = window.requestIdleCallback
    const nativeCancelIdleCallback = window.cancelIdleCallback
    let nextIdleHandle = 1
    window.requestIdleCallback = (callback) => {
      const handle = nextIdleHandle++
      idleCallbacks.set(handle, callback)
      return handle
    }
    window.cancelIdleCallback = (handle) => {
      idleCallbacks.delete(handle)
    }
    const waitFrames = (count: number) => new Promise<void>((resolve) => {
      const step = () => {
        if (count <= 0) {
          resolve()
          return
        }
        count--
        requestAnimationFrame(step)
      }
      step()
    })
    const flushIdleCallbacks = () => {
      const callbacks = [...idleCallbacks]
      idleCallbacks.clear()
      for (const [, callback] of callbacks) {
        callback({
          didTimeout: false,
          timeRemaining: () => 50
        })
      }
    }

    try {
      const wrapper = document.createElement('section')
      for (let index = 0; index < 520; index++) {
        const element = document.createElement('p')
        element.className = `z:${index}`
        wrapper.append(element)
      }
      document.body.innerHTML = '<p class="fg:blue-60"></p>'
      document.body.append(wrapper)
      await waitFrames(2)
      wrapper.remove()
      await waitFrames(3)

      const beforeHardLimitCleanup = {
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        retainedCount: globalThis.masterCSSRuntime.retainedClassNames.size,
        retainedHasReusedClass: globalThis.masterCSSRuntime.retainedClassNames.has('z:0'),
        queuedIdleCount: idleCallbacks.size
      }

      const reused = document.createElement('p')
      reused.className = 'z:0'
      document.body.append(reused)
      await new Promise(resolve => setTimeout(resolve, 0))
      const afterReuseBeforeCleanup = {
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        retainedCount: globalThis.masterCSSRuntime.retainedClassNames.size,
        retainedHasReusedClass: globalThis.masterCSSRuntime.retainedClassNames.has('z:0'),
        hasReusedClassUtility: globalThis.masterCSSRuntime.classUtilities.has('z:0'),
        hasActiveClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:blue-60'),
        queuedIdleCount: idleCallbacks.size
      }

      flushIdleCallbacks()
      const afterHardLimitCleanup = {
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        retainedCount: globalThis.masterCSSRuntime.retainedClassNames.size,
        retainedHasReusedClass: globalThis.masterCSSRuntime.retainedClassNames.has('z:0'),
        hasReusedClassUtility: globalThis.masterCSSRuntime.classUtilities.has('z:0'),
        hasActiveClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:blue-60'),
        text: globalThis.masterCSSRuntime.text,
        queuedIdleCount: idleCallbacks.size
      }

      const afterForcedCleanup = {
        removedCount: globalThis.masterCSSRuntime.flushRetainedClassRules(),
        retainedCount: globalThis.masterCSSRuntime.retainedClassNames.size,
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        hasReusedClassUtility: globalThis.masterCSSRuntime.classUtilities.has('z:0'),
        hasActiveClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:blue-60'),
        text: globalThis.masterCSSRuntime.text
      }

      return {
        beforeHardLimitCleanup,
        afterReuseBeforeCleanup,
        afterHardLimitCleanup,
        afterForcedCleanup
      }
    } finally {
      window.requestIdleCallback = nativeRequestIdleCallback
      window.cancelIdleCallback = nativeCancelIdleCallback
    }
  })
  expect(result.beforeHardLimitCleanup.counts).toEqual({
    'fg:blue-60': 1
  })
  expect(result.beforeHardLimitCleanup.retainedCount).toBe(520)
  expect(result.beforeHardLimitCleanup.retainedHasReusedClass).toBe(true)
  expect(result.beforeHardLimitCleanup.queuedIdleCount).toBe(1)

  expect(result.afterReuseBeforeCleanup.counts).toEqual({
    'fg:blue-60': 1,
    'z:0': 1
  })
  expect(result.afterReuseBeforeCleanup.retainedCount).toBe(519)
  expect(result.afterReuseBeforeCleanup.retainedHasReusedClass).toBe(false)
  expect(result.afterReuseBeforeCleanup.hasReusedClassUtility).toBe(true)
  expect(result.afterReuseBeforeCleanup.hasActiveClassUtility).toBe(true)
  expect(result.afterReuseBeforeCleanup.queuedIdleCount).toBe(1)

  expect(result.afterHardLimitCleanup.counts).toEqual({
    'fg:blue-60': 1,
    'z:0': 1
  })
  expect(result.afterHardLimitCleanup.retainedCount).toBeLessThanOrEqual(128)
  expect(result.afterHardLimitCleanup.retainedCount).toBeGreaterThan(0)
  expect(result.afterHardLimitCleanup.retainedHasReusedClass).toBe(false)
  expect(result.afterHardLimitCleanup.hasReusedClassUtility).toBe(true)
  expect(result.afterHardLimitCleanup.hasActiveClassUtility).toBe(true)
  expect(result.afterHardLimitCleanup.text).toContain('.fg\\:blue-60')
  expect(result.afterHardLimitCleanup.text).toContain('.z\\:0')
  expect(result.afterHardLimitCleanup.queuedIdleCount).toBe(0)

  expect(result.afterForcedCleanup.removedCount).toBe(result.afterHardLimitCleanup.retainedCount)
  expect(result.afterForcedCleanup.retainedCount).toBe(0)
  expect(result.afterForcedCleanup.counts).toEqual({
    'fg:blue-60': 1,
    'z:0': 1
  })
  expect(result.afterForcedCleanup.hasReusedClassUtility).toBe(true)
  expect(result.afterForcedCleanup.hasActiveClassUtility).toBe(true)
  expect(result.afterForcedCleanup.text).toContain('.fg\\:blue-60')
  expect(result.afterForcedCleanup.text).toContain('.z\\:0')
  expect(result.afterForcedCleanup.text).not.toContain('.z\\:1')
})

test('mutation removals are canceled when a class returns before flush', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
  })
  await waitForRuntimeRuleFlush(page)

  const duringFlushWindow = await page.evaluate(async () => {
    const target = document.getElementById('target')!
    target.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.body.append(target)
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60')
    }
  })
  expect(duringFlushWindow).toEqual({
    counts: {
      'fg:red-60': 1
    },
    hasClassUtility: true
  })

  await waitForRuntimeRemovalFlush(page)
  const afterFlush = await page.evaluate(() => ({
    counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
    hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
    text: globalThis.masterCSSRuntime.text
  }))
  expect(afterFlush.counts).toEqual({
    'fg:red-60': 1
  })
  expect(afterFlush.hasClassUtility).toBe(true)
  expect(afterFlush.text).toContain('.fg\\:red-60')
})

test('direct ensureClassRules and deleteClassRules stay synchronous', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(() => {
    globalThis.masterCSSRuntime.ensureClassRules('fg:red-60')
    const added = {
      hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
      text: globalThis.masterCSSRuntime.text
    }
    globalThis.masterCSSRuntime.deleteClassRules('fg:red-60')
    return {
      added,
      removed: {
        hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
        text: globalThis.masterCSSRuntime.text
      }
    }
  })

  expect(result.added.hasClassUtility).toBe(true)
  expect(result.added.text).toContain('.fg\\:red-60')
  expect(result.removed).toEqual({
    hasClassUtility: false,
    text: ''
  })
})

test('observer-added cold classes update counts immediately and flush rules before paint', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(async () => {
    const queuedFrames = new Map<number, FrameRequestCallback>()
    const nativeRequestAnimationFrame = window.requestAnimationFrame
    const nativeCancelAnimationFrame = window.cancelAnimationFrame
    let nextFrameHandle = 1
    window.requestAnimationFrame = (callback) => {
      const handle = nextFrameHandle++
      queuedFrames.set(handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (handle) => {
      queuedFrames.delete(handle)
    }

    try {
      const target = document.createElement('p')
      target.className = 'fg:red-60'
      document.body.append(target)
      await new Promise(resolve => setTimeout(resolve, 0))

      const beforeFlush = {
        queuedFrameCount: queuedFrames.size,
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
        text: globalThis.masterCSSRuntime.text
      }

      for (const callback of queuedFrames.values()) {
        callback(performance.now())
      }
      queuedFrames.clear()

      const afterFlush = {
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
        text: globalThis.masterCSSRuntime.text
      }

      return { beforeFlush, afterFlush }
    } finally {
      window.requestAnimationFrame = nativeRequestAnimationFrame
      window.cancelAnimationFrame = nativeCancelAnimationFrame
    }
  })

  expect(result.beforeFlush).toEqual({
    queuedFrameCount: 1,
    counts: {
      'fg:red-60': 1
    },
    hasClassUtility: false,
    text: ''
  })
  expect(result.afterFlush.counts).toEqual({
    'fg:red-60': 1
  })
  expect(result.afterFlush.hasClassUtility).toBe(true)
  expect(result.afterFlush.text).toContain('.fg\\:red-60')
})

test('observer-added retained classes are reused immediately', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const result = await page.evaluate(async () => {
    const queuedFrames = new Map<number, FrameRequestCallback>()
    const nativeRequestAnimationFrame = window.requestAnimationFrame
    const nativeCancelAnimationFrame = window.cancelAnimationFrame
    let nextFrameHandle = 1
    window.requestAnimationFrame = (callback) => {
      const handle = nextFrameHandle++
      queuedFrames.set(handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (handle) => {
      queuedFrames.delete(handle)
    }

    try {
      document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
      await new Promise(resolve => setTimeout(resolve, 0))
      return {
        queuedFrameCount: queuedFrames.size,
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
        hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
        text: globalThis.masterCSSRuntime.text
      }
    } finally {
      window.requestAnimationFrame = nativeRequestAnimationFrame
      window.cancelAnimationFrame = nativeCancelAnimationFrame
    }
  })

  expect(result.counts).toEqual({
    'fg:red-60': 1
  })
  expect(result.queuedFrameCount).toBe(0)
  expect(result.retainedClassNames).toEqual([])
  expect(result.hasClassUtility).toBe(true)
  expect(result.text).toContain('.fg\\:red-60')
})

test('observer queued cold classes removed before flush are skipped', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(async () => {
    const queuedFrames = new Map<number, FrameRequestCallback>()
    const nativeRequestAnimationFrame = window.requestAnimationFrame
    const nativeCancelAnimationFrame = window.cancelAnimationFrame
    let nextFrameHandle = 1
    window.requestAnimationFrame = (callback) => {
      const handle = nextFrameHandle++
      queuedFrames.set(handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (handle) => {
      queuedFrames.delete(handle)
    }

    try {
      const target = document.createElement('p')
      target.className = 'z:1234'
      document.body.append(target)
      await new Promise(resolve => setTimeout(resolve, 0))
      target.remove()
      await new Promise(resolve => setTimeout(resolve, 0))

      const beforeFlush = {
        queuedFrameCount: queuedFrames.size,
        counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
        hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('z:1234'),
        text: globalThis.masterCSSRuntime.text
      }

      for (const callback of queuedFrames.values()) {
        callback(performance.now())
      }
      queuedFrames.clear()

      return {
        beforeFlush,
        afterFlush: {
          counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
          hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('z:1234'),
          text: globalThis.masterCSSRuntime.text
        }
      }
    } finally {
      window.requestAnimationFrame = nativeRequestAnimationFrame
      window.cancelAnimationFrame = nativeCancelAnimationFrame
    }
  })

  expect(result.beforeFlush.queuedFrameCount).toBeGreaterThanOrEqual(0)
  expect(result.beforeFlush).toMatchObject({
    counts: {},
    hasClassUtility: false,
    text: ''
  })
  expect(result.afterFlush).toEqual({
    counts: {},
    hasClassUtility: false,
    text: ''
  })
})

test('disconnect and destroy clear pending mutation additions and removals', async ({ page }) => {
  await init(page)
  const disconnected = await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p><p class="z:1234"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('target')?.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    globalThis.masterCSSRuntime.disconnect()
    return {
      counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
      utilities: globalThis.masterCSSRuntime.classUtilities.size,
      hasStyle: !!document.head.querySelector('style#master-css')
    }
  })
  expect(disconnected).toEqual({
    counts: {},
    retainedClassNames: [],
    utilities: 0,
    hasStyle: false
  })
  await waitForRuntimeRemovalFlush(page)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.classUtilities.size)).toBe(0)

  await page.evaluate(() => globalThis.masterCSSRuntime.observe())
  const destroyed = await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p><p class="z:1234"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('target')?.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    const runtime = globalThis.masterCSSRuntime
    runtime.destroy()
    return {
      registered: globalThis.MasterCSSRuntime.instances.get(document) === runtime,
      globalRuntime: globalThis.masterCSSRuntime,
      counts: Object.fromEntries(runtime.classCounts),
      retainedClassNames: [...runtime.retainedClassNames],
      utilities: runtime.classUtilities.size
    }
  })
  expect(destroyed).toEqual({
    registered: false,
    globalRuntime: undefined,
    counts: {},
    retainedClassNames: [],
    utilities: 0
  })
  await waitForRuntimeRemovalFlush(page)
})

test('shadow roots maintain isolated runtime state and style nodes', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(() => {
    const host = document.createElement('section')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<p class="block"></p>'
    document.body.append(host)

    const shadowRuntime = globalThis.MasterCSSRuntime.create({
      root: shadow,
      manifest: globalThis.masterCSSRuntime.manifest
    }).observe()

    return {
      documentCounts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
      documentHasBlockRule: globalThis.masterCSSRuntime.text.includes('.block{display:block}'),
      shadowCounts: Object.fromEntries(shadowRuntime.classCounts),
      shadowHasStyle: !!shadow.querySelector('style#master-css'),
      shadowText: shadowRuntime.text,
      instanceRegistered: globalThis.MasterCSSRuntime.instances.get(shadow) === shadowRuntime
    }
  })

  expect(result).toEqual({
    documentCounts: {},
    documentHasBlockRule: false,
    shadowCounts: { block: 1 },
    shadowHasStyle: true,
    shadowText: '@layer utilities{.block{display:block}}',
    instanceRegistered: true
  })
})

/**
 * Guards: the runtime adopting or deleting a `style#master-css` that is already on the page
 * (left by an older build or written by the page itself). The runtime renders into its own
 * sheet and leaves that element and its rules alone. Making `observe()` reuse or remove the
 * existing element turns this test red.
 */
test('leaves a style#master-css already on the page alone and renders its own sheet', async ({ page }) => {
  const messages: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') messages.push(message.text())
  })
  page.on('pageerror', error => messages.push(error.message))
  const prerenderedText = '@layer utilities{.unknown{color:red}}'

  await page.evaluate(({ runtimeStyleId, text }) => {
    document.body.innerHTML = '<p class="block"></p>'
    const style = document.createElement('style')
    style.id = runtimeStyleId
    style.textContent = text
    document.head.append(style)
    ;(globalThis as any).prerenderedStyle = style
  }, { runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID, text: prerenderedText })
  await init(page)

  const result = await page.evaluate(() => {
    const prerenderedStyle = (globalThis as any).prerenderedStyle as HTMLStyleElement
    const runtime = globalThis.masterCSSRuntime
    return {
      prerenderedConnected: prerenderedStyle.isConnected,
      prerenderedText: prerenderedStyle.textContent,
      ownStyle: runtime.style !== prerenderedStyle && runtime.style?.isConnected === true,
      text: runtime.text
    }
  })

  expect(result).toEqual({
    prerenderedConnected: true,
    prerenderedText,
    ownStyle: true,
    text: '@layer utilities{.block{display:block}}'
  })
  expect(messages).toEqual([])
})

test('removes shared alias variable dependencies when classes disappear', async ({ page }) => {
  await init(page, {
    variables: [
      { key: 'surface', value: '#ffffff' },
      { key: 'brand', value: 'var(--surface)', dependencies: ['surface'] }
    ]
  })

  await page.evaluate(() => {
    const el = document.createElement('p')
    el.classList.add('fg:brand', 'color:brand')
    document.body.append(el)
  })
  await waitForRuntimeRuleFlush(page)
  const initial = await page.evaluate(() => ({
    text: globalThis.masterCSSRuntime.themeLayer.text,
    counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts)
  }))
  expect(initial).toEqual({
    text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
    counts: {
      brand: 2,
      surface: 2
    }
  })

  await page.evaluate(() => {
    document.querySelector('p')?.classList.remove('fg:brand')
  })
  await waitForRuntimeRemovalFlush(page)
  const afterOneRemoval = await page.evaluate(() => ({
    text: globalThis.masterCSSRuntime.themeLayer.text,
    counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames]
  }))
  expect(afterOneRemoval).toEqual({
    text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
    counts: {
      brand: 2,
      surface: 2
    },
    retainedClassNames: ['fg:brand']
  })

  await page.evaluate(() => {
    document.querySelector('p')?.classList.remove('color:brand')
  })
  await waitForRuntimeRemovalFlush(page)
  const afterAllRemoved = await page.evaluate(() => ({
    text: globalThis.masterCSSRuntime.themeLayer.text,
    counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
    nativeAttached: !!globalThis.masterCSSRuntime.themeLayer.native?.parentStyleSheet
  }))
  expect(afterAllRemoved).toEqual({
    text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
    counts: {
      brand: 2,
      surface: 2
    },
    retainedClassNames: ['fg:brand', 'color:brand'],
    nativeAttached: true
  })

  const afterForcedCleanup = await page.evaluate(() => ({
    removedCount: globalThis.masterCSSRuntime.flushRetainedClassRules(),
    text: globalThis.masterCSSRuntime.themeLayer.text,
    counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
    nativeAttached: !!globalThis.masterCSSRuntime.themeLayer.native?.parentStyleSheet
  }))
  expect(afterForcedCleanup).toEqual({
    removedCount: 2,
    text: '',
    counts: {},
    retainedClassNames: [],
    nativeAttached: false
  })
})

test('inlines variables without runtime theme counts', async ({ page }) => {
  await init(page, {
    variables: [
      { namespace: 'color', key: 'brand', value: '#123456', inline: true }
    ]
  })

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<p class="fg:brand"></p>'
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    return {
      text: globalThis.masterCSSRuntime.text,
      counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts)
    }
  })

  expect(result).toEqual({
    text: '@layer utilities{.fg\\:brand{color:#123456}}',
    counts: {}
  })
})
