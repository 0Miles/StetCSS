import { exceedsScriptNestingLimit } from '@stet-css/lexer'
import { parseSync, type ParserOptions } from 'oxc-parser'
import type { MessagePort, Worker } from 'node:worker_threads'

// `@stet-css/source` (`src/adapters/oxc-stack.ts`) and `@stet-css/language`
// (`src/utils/oxc-stack.ts`) each keep a copy of this file: language's AI.md
// keeps its imports off source, and depending on source would change the
// lockfile. They differ only in `PACKAGE_NAME`; a language test fails when
// they drift apart.
const PACKAGE_NAME = '@stet-css/source'

type OxcProgram = ReturnType<typeof parseSync>['program']
type WorkerThreads = typeof import('node:worker_threads')

interface StackWorker {
  worker: Worker
  port: MessagePort
  signal: Int32Array
  stackSizeMb: number
}

/**
 * Sources this short parse inline: they cannot nest deep enough to overflow a
 * 4 MB worker-thread stack, the smallest the callers run on, once
 * `exceedsScriptNestingLimit` has capped bracket nesting at 1024 levels.
 */
export const INLINE_LENGTH = 1024
// oxc-parser spends at most about 320 bytes (0.137) or 390 bytes (0.129, which
// the VS Code extension ships) of native stack per source character on the
// chains the prescan lets through (`a:` labels, `new`, `a=`), so 1 KiB per
// character keeps 2.6x headroom; 16 MiB covers the 1024 levels of brackets the
// prescan allows.
const MIN_STACK_MB = 16
const MAX_STACK_MB = 1024
/**
 * Longer sources need more stack than the 1 GiB cap gives at 1 KiB per
 * character, so they are not parsed at all; callers fall back to text
 * extraction.
 */
export const MAX_PARSE_LENGTH = MAX_STACK_MB * 1024
const INIT_TIMEOUT_MS = 10_000
// A worker that dies mid-parse cannot report it while this thread blocks, so
// the wait is bounded by what a parse of that length can take.
const PARSE_TIMEOUT_MS = 3_000
const PARSE_TIMEOUT_MS_PER_KIB = 5
// An idle worker is dropped so a long-lived host gets its memory back.
const IDLE_MS = 2_000

const PENDING = 0
const DONE = 1
const FAILED = 2

// Runs as an eval worker. It inherits the host's `execArgv`, so it may load as
// CommonJS or, under `--input-type=module`, as an ES module: it sticks to
// syntax both accept and loads modules with `import()`.
const WORKER_SOURCE = `
import('node:worker_threads').then(({ workerData }) => {
  const { port, signal, bindingsURL } = workerData
  const settle = (state) => {
    Atomics.store(signal, 0, state)
    Atomics.notify(signal, 0)
  }
  return import(bindingsURL).then(({ parseSync }) => {
    port.on('message', ({ filename, sourceText, options }) => {
      try {
        const result = parseSync(filename, sourceText, options)
        port.postMessage({ program: result.program, errors: result.errors })
        settle(${DONE})
      } catch {
        settle(${FAILED})
      }
    })
    settle(${DONE})
  }, () => settle(${FAILED}))
})
`

let workerThreads: WorkerThreads | undefined
let bindingsURL: string | undefined
let stackWorker: StackWorker | undefined
let stackWorkerUnavailable = false
// Only armed on the worker path, so it is a Node.js timer.
let idleTimer: NodeJS.Timeout | undefined
const warnedMessages = new Set<string>()

function warnOnce(message: string) {
  if (warnedMessages.has(message)) return
  warnedMessages.add(message)
  console.warn(`[${PACKAGE_NAME}] ${message}`)
}

function getStackSizeMb(sourceLength: number) {
  let stackSizeMb = MIN_STACK_MB
  while (stackSizeMb < MAX_STACK_MB && stackSizeMb * 1024 < sourceLength) stackSizeMb *= 2
  return stackSizeMb
}

function dropStackWorker() {
  void stackWorker?.worker.terminate()
  stackWorker = undefined
}

function scheduleIdleDrop() {
  if (idleTimer) {
    idleTimer.refresh()
    return
  }
  idleTimer = setTimeout(dropStackWorker, IDLE_MS) as unknown as NodeJS.Timeout
  idleTimer.unref()
}

function startStackWorker(stackSizeMb: number): StackWorker | undefined {
  const getBuiltinModule = globalThis.process?.getBuiltinModule
  if (!getBuiltinModule) {
    // No worker threads in this host (browsers).
    stackWorkerUnavailable = true
    return
  }
  workerThreads ??= getBuiltinModule('node:worker_threads')
  const { MessageChannel, Worker } = workerThreads
  let worker: Worker | undefined
  try {
    // The binding hands the program back as JSON, so the AST crosses threads
    // as one string, and `JSON.parse` builds it without recursing.
    if (!bindingsURL) {
      const oxcEntry = getBuiltinModule('node:module').createRequire(import.meta.url).resolve('oxc-parser')
      bindingsURL = new URL('bindings.js', getBuiltinModule('node:url').pathToFileURL(oxcEntry)).href
    }
    const { port1, port2 } = new MessageChannel()
    const signal = new Int32Array(new SharedArrayBuffer(4))
    worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: { port: port2, signal, bindingsURL },
      transferList: [port2],
      resourceLimits: { stackSizeMb }
    })
    worker.unref()
    port1.unref()
    const started: StackWorker = { worker, port: port1, signal, stackSizeMb }
    worker.on('error', () => {})
    worker.on('exit', () => {
      if (stackWorker === started) stackWorker = undefined
    })
    Atomics.wait(signal, 0, PENDING, INIT_TIMEOUT_MS)
    if (Atomics.load(signal, 0) === DONE) return started
  } catch {
    // Reported by the caller.
  }
  void worker?.terminate()
}

function getStackWorker(stackSizeMb: number) {
  // A worker that exited while this thread was free to run its events.
  if (stackWorker?.worker.threadId === -1) stackWorker = undefined
  if (stackWorker && stackWorker.stackSizeMb >= stackSizeMb) return stackWorker
  const started = startStackWorker(stackSizeMb)
  if (started) {
    dropStackWorker()
    stackWorker = started
  } else if (!stackWorkerUnavailable) {
    if (stackSizeMb === MIN_STACK_MB) {
      stackWorkerUnavailable = true
      warnOnce('Could not start the thread that parses JS/TS on a large stack; parsing inline, where deeply nested files can crash the process.')
    } else {
      warnOnce(`Could not start a thread with a ${stackSizeMb} MiB stack to parse a large JS/TS file; falling back to text extraction for files that need one.`)
    }
  }
  return started
}

function parseInline(filename: string, sourceText: string, options: ParserOptions): OxcProgram | undefined {
  try {
    const result = parseSync(filename, sourceText, options)
    return result.errors.length ? undefined : result.program
  } catch {
    return
  }
}

function parseOnStackWorker(
  current: StackWorker,
  filename: string,
  sourceText: string,
  options: ParserOptions
): OxcProgram | undefined {
  const { port, signal } = current
  Atomics.store(signal, 0, PENDING)
  port.postMessage({ filename, sourceText, options })
  Atomics.wait(signal, 0, PENDING, PARSE_TIMEOUT_MS + PARSE_TIMEOUT_MS_PER_KIB * (sourceText.length >> 10))
  const state = Atomics.load(signal, 0)
  const reply = workerThreads?.receiveMessageOnPort(port)?.message as
    | { program: string, errors: unknown[] }
    | undefined
  if (state !== DONE || !reply) {
    if (state === PENDING) dropStackWorker()
    return
  }
  if (reply.errors.length) return
  // The binding's JSON cannot carry BigInt or RegExp literal values, which
  // oxc's own wrapper fills in afterwards; they stay `null` here, since only
  // string literals are read.
  return (JSON.parse(reply.program) as { node: OxcProgram }).node
}

/**
 * `parseSync` from oxc-parser, run on a thread whose stack grows with the
 * source. oxc recurses once per nesting level, and overflowing the native stack
 * kills the host process, which no try/catch can stop. Returns the program,
 * or `undefined` for callers to fall back on: when the source has syntax
 * errors, nests past `exceedsScriptNestingLimit` or is longer than
 * `MAX_PARSE_LENGTH`, or when a parse thread fails, times out, or cannot get
 * the stack it needs. Where no
 * parse thread can start at all (browsers, hosts without worker threads) it
 * parses inline.
 *
 * The prescan runs first because brackets cost oxc up to ten times more stack
 * per character than the chains it lets through, and the stack sizing here
 * assumes it has capped them.
 */
export function parseOxcOnSourceStack(
  filename: string,
  sourceText: string,
  options: ParserOptions
): OxcProgram | undefined {
  if (sourceText.length > MAX_PARSE_LENGTH || exceedsScriptNestingLimit(sourceText)) return
  const current = sourceText.length > INLINE_LENGTH && !stackWorkerUnavailable
    ? getStackWorker(getStackSizeMb(sourceText.length))
    : undefined
  if (!current) {
    // Short sources, and hosts where no parse thread can start, parse inline.
    return sourceText.length <= INLINE_LENGTH || stackWorkerUnavailable
      ? parseInline(filename, sourceText, options)
      : undefined
  }
  const program = parseOnStackWorker(current, filename, sourceText, options)
  scheduleIdleDrop()
  return program
}
