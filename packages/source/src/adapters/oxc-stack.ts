import { parseSync, type ParserOptions } from 'oxc-parser'
import type { MessagePort, Worker } from 'node:worker_threads'

// `@stet-css/source` (`src/adapters/oxc-stack.ts`) and `@stet-css/language`
// (`src/utils/oxc-stack.ts`) each keep a copy of this file, because language
// may not import source. They differ only in `PACKAGE_NAME`; a language test
// fails when they drift apart.
const PACKAGE_NAME = '@stet-css/source'

type OxcParseResult = Pick<ReturnType<typeof parseSync>, 'program' | 'errors'>
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
// oxc-parser 0.137 spends at most about 320 bytes of native stack per source
// character on the chains the prescan lets through (`a:` labels, `new`, `a=`),
// so 1 KiB per character keeps 3x headroom; 16 MiB covers the 1024 levels of
// brackets the prescan allows.
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
let stackWorker: StackWorker | undefined
let stackWorkerUnavailable = false
let idleTimer: ReturnType<typeof setTimeout> | undefined
let warned = false

function warnOnce(message: string) {
  if (warned) return
  warned = true
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
  clearTimeout(idleTimer)
  idleTimer = setTimeout(dropStackWorker, IDLE_MS)
  ;(idleTimer as { unref?: () => void }).unref?.()
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
    const oxcEntry = getBuiltinModule('node:module').createRequire(import.meta.url).resolve('oxc-parser')
    const bindingsURL = new URL('bindings.js', getBuiltinModule('node:url').pathToFileURL(oxcEntry)).href
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
  } else if (stackWorkerUnavailable) {
    // No worker threads in this host.
  } else if (stackSizeMb === MIN_STACK_MB) {
    stackWorkerUnavailable = true
    warnOnce('Could not start the thread that parses JS/TS on a large stack; parsing inline, where deeply nested files can crash the process.')
  } else {
    warnOnce(`Could not start a thread with a ${stackSizeMb} MiB stack to parse a large JS/TS file; falling back to text extraction for files that need one.`)
  }
  return started
}

// Mirrors oxc-parser's `jsonParseAst`: JSON cannot carry BigInt or RegExp
// literal values, so the binding lists the paths to fill in.
function parseProgramJSON(json: string): OxcParseResult['program'] {
  const { node, fixes } = JSON.parse(json) as { node: OxcParseResult['program'], fixes: (string | number)[][] }
  for (const path of fixes) {
    let literal: any = node
    for (const key of path) literal = literal[key]
    if (literal.bigint) {
      literal.value = BigInt(literal.bigint)
    } else {
      try {
        literal.value = new RegExp(literal.regex.pattern, literal.regex.flags)
      } catch {
        // Invalid, or syntax this Node.js version lacks; oxc leaves it unset too.
      }
    }
  }
  return node
}

function parseOnStackWorker(
  current: StackWorker,
  filename: string,
  sourceText: string,
  options: ParserOptions
): OxcParseResult | undefined {
  const { port, signal } = current
  Atomics.store(signal, 0, PENDING)
  port.postMessage({ filename, sourceText, options })
  Atomics.wait(signal, 0, PENDING, PARSE_TIMEOUT_MS + PARSE_TIMEOUT_MS_PER_KIB * (sourceText.length >> 10))
  const state = Atomics.load(signal, 0)
  const reply = workerThreads?.receiveMessageOnPort(port)?.message as
    | { program: string, errors: OxcParseResult['errors'] }
    | undefined
  if (state !== DONE || !reply) {
    if (state === PENDING) dropStackWorker()
    return
  }
  let program: OxcParseResult['program'] | undefined
  return {
    errors: reply.errors,
    get program() {
      program ??= parseProgramJSON(reply.program)
      return program
    }
  }
}

/**
 * `parseSync` from oxc-parser, run on a thread whose stack grows with the
 * source. oxc recurses once per nesting level, and overflowing the native stack
 * kills the host process, which no try/catch can stop. Returns `undefined`,
 * which callers treat as a parse failure, for sources past `MAX_PARSE_LENGTH`
 * and when a parse thread fails, times out, or cannot get the stack it needs.
 * Where no parse thread can start at all (browsers, hosts without worker
 * threads) it parses inline.
 *
 * Callers still gate on `exceedsScriptNestingLimit` first: brackets cost oxc
 * up to ten times more stack per character than the chains the prescan lets
 * through, and the stack sizing here assumes the prescan has capped them.
 */
export function parseOxcOnSourceStack(
  filename: string,
  sourceText: string,
  options: ParserOptions
): OxcParseResult | undefined {
  if (sourceText.length > MAX_PARSE_LENGTH) return
  if (sourceText.length <= INLINE_LENGTH || stackWorkerUnavailable) {
    return parseSync(filename, sourceText, options)
  }
  const current = getStackWorker(getStackSizeMb(sourceText.length))
  if (!current) {
    return stackWorkerUnavailable ? parseSync(filename, sourceText, options) : undefined
  }
  const result = parseOnStackWorker(current, filename, sourceText, options)
  scheduleIdleDrop()
  return result
}
