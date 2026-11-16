import { parseSync, type ParserOptions } from 'oxc-parser'
import type { MessagePort, Worker } from 'node:worker_threads'

// `@stet-css/source` keeps an identical copy in `src/adapters/oxc-stack.ts`;
// change both together.

type OxcParseResult = Pick<ReturnType<typeof parseSync>, 'program' | 'errors'>

interface StackWorker {
  worker: Worker
  port: MessagePort
  signal: Int32Array
  stackSizeMb: number
}

// Sources this short cannot nest deep enough to overflow a 4 MB worker-thread
// stack, the smallest the callers run on, once `exceedsScriptNestingLimit`
// has capped bracket nesting at 1024 levels.
const INLINE_LENGTH = 1024
// oxc-parser 0.137 spends at most about 320 bytes of native stack per source
// byte on the chains the prescan lets through (`a:` labels, `new`, `a=`), so
// 1 KiB per byte keeps 3x headroom; 16 MiB covers the 1024 levels of brackets
// the prescan allows.
const MIN_STACK_MB = 16
const MAX_STACK_MB = 1024
const INIT_TIMEOUT_MS = 10_000
const PARSE_TIMEOUT_MS = 60_000

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

let stackWorker: StackWorker | undefined
let stackWorkerUnavailable = false

function getBuiltinModules() {
  const getBuiltinModule = globalThis.process?.getBuiltinModule
  if (!getBuiltinModule) return
  return {
    workerThreads: getBuiltinModule('node:worker_threads'),
    nodeModule: getBuiltinModule('node:module'),
    nodeURL: getBuiltinModule('node:url')
  }
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

function startStackWorker(stackSizeMb: number): StackWorker | undefined {
  const modules = getBuiltinModules()
  if (!modules) return
  const { workerThreads, nodeModule, nodeURL } = modules
  try {
    // The binding hands the program back as JSON, so the AST crosses threads
    // as one string, and `JSON.parse` builds it without recursing.
    const oxcEntry = nodeModule.createRequire(import.meta.url).resolve('oxc-parser')
    const bindingsURL = new URL('bindings.js', nodeURL.pathToFileURL(oxcEntry)).href
    const { port1, port2 } = new workerThreads.MessageChannel()
    const signal = new Int32Array(new SharedArrayBuffer(4))
    const worker = new workerThreads.Worker(WORKER_SOURCE, {
      eval: true,
      workerData: { port: port2, signal, bindingsURL },
      transferList: [port2],
      resourceLimits: { stackSizeMb }
    })
    worker.unref()
    port1.unref()
    const started: StackWorker = { worker, port: port1, signal, stackSizeMb }
    worker.on('error', () => {
      if (stackWorker === started) stackWorker = undefined
    })
    Atomics.wait(signal, 0, PENDING, INIT_TIMEOUT_MS)
    if (Atomics.load(signal, 0) !== DONE) {
      void worker.terminate()
      return
    }
    return started
  } catch {
    return
  }
}

function getStackWorker(stackSizeMb: number) {
  if (stackWorker && stackWorker.stackSizeMb >= stackSizeMb) return stackWorker
  dropStackWorker()
  stackWorker = startStackWorker(stackSizeMb)
  if (!stackWorker) stackWorkerUnavailable = true
  return stackWorker
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
  Atomics.wait(signal, 0, PENDING, PARSE_TIMEOUT_MS)
  const state = Atomics.load(signal, 0)
  const reply = getBuiltinModules()?.workerThreads.receiveMessageOnPort(port)?.message as
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
 * kills the host process, which no try/catch can stop. Returns `undefined`
 * when the parse thread fails or times out; callers treat that as a parse
 * failure. Without worker threads (browsers) it parses inline.
 *
 * Callers still gate on `exceedsScriptNestingLimit` first: brackets cost oxc
 * up to ten times more stack per byte than the chains the prescan lets
 * through, and the stack sizing here assumes the prescan has capped them.
 */
export function parseOxcOnSourceStack(
  filename: string,
  sourceText: string,
  options: ParserOptions
): OxcParseResult | undefined {
  if (sourceText.length <= INLINE_LENGTH || stackWorkerUnavailable) {
    return parseSync(filename, sourceText, options)
  }
  const current = getStackWorker(getStackSizeMb(sourceText.length))
  if (!current) return parseSync(filename, sourceText, options)
  return parseOnStackWorker(current, filename, sourceText, options)
}
