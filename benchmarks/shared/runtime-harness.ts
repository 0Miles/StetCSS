/**
 * Page scripts that load `/global.min.js` with instrumentation installed first.
 * The bundle registers `StetCSSRuntime` and calls `observe()` while it runs, so a
 * wrapper added after the script tag would miss startup. A one-shot setter on the
 * global hands the class to `instrumentLines` (a function body with `Runtime` in scope)
 * as it registers, before `create()` and `observe()`.
 */
export function createRuntimeBundleScripts(metricsGlobal: string, instrumentLines: string[]) {
  return [
    '    <script>',
    '        (function hookRuntimeRegistration(instrument) {',
    '            Object.defineProperty(window, "StetCSSRuntime", {',
    '                configurable: true,',
    '                get() { return undefined; },',
    '                set(Runtime) {',
    '                    Object.defineProperty(window, "StetCSSRuntime", { value: Runtime, writable: true, configurable: true, enumerable: true });',
    '                    instrument(Runtime);',
    '                }',
    '            });',
    '        })((Runtime) => {',
    ...instrumentLines,
    '        });',
    '    </script>',
    '    <script src="/global.min.js"></script>',
    `    <script>if (!window.StetCSSRuntime) window.${metricsGlobal}.error = "missing-runtime";</script>`
  ]
}
