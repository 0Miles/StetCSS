# benchmarks

Advisory measurement suites and report helpers: CSS output size and structure, build performance, delivery modes, browser CSS cost, build, runtime and hydration diagnostics, Tailwind CSS comparison snapshots, and CI helpers in `ci/` that normalize engine/runtime reports and compare GitHub Actions artifact history. Results are **evidence** for an investigation; correctness lives in the product packages' tests.

## Boundaries

- Product behaviour (CSS output, cascade order, hydration, runtime lifecycle, extraction, public APIs) → the owning package. Benchmark and diagnostic code observes it and changes none of it.
- Release gates and pass/fail thresholds for benchmark history sit outside this package; numbers stay advisory.

## Risks

- **Correctness first**: validate the affected product package before reporting numbers. A product change made for a better number needs that package's tests and an intentional behaviour review.
- **Noise**: local values are not deterministic pass/fail signals. `BENCHMARK_ROUNDS`, suite-specific round variables and `BENCHMARK_COMMAND_TIMEOUT_MS` tune collection only, never hide failures.
- **Comparable runs**: keep fixture intent fixed when presenting before/after numbers. Master CSS and Tailwind CSS fixtures share rendered UI intent, not source code.
- **Report IDs**: change `BenchmarkSuiteId`, fixture coverage, adapter metadata, metrics, package scripts and report schema usage together, with every consumer including `ci/`.
- **Limits stay visible**: each suite answers a known hot path or diagnostic question, and its report carries `environment`, package and browser versions, metric units, sample counts, useful artifacts, and limits (machine noise, Chromium trace event naming, cold vs warm cache, static vs runtime delivery, Tailwind equivalence).
- **Generated output** stays in `benchmarks/.results/**`, never reused as checked-in fixture data; workspaces, traces, screenshots and downloaded history stay uncommitted too.
- **Payload**: compiled indexes and caches enter runtime/browser payloads only with a bundle-size review, never just to speed up benchmark setup.
- **`report-smoke`** values check report shape; they are never real results.

## Validation

- Report shape or shared report helpers: `pnpm --filter ./benchmarks bench:report-smoke`.
- Suite code: the smallest relevant `bench:<suite>` script.
- Intentional baseline change: the matching `snapshot:<suite>` script, with the new baseline explained.
- Final reports state the command run, environment limits, whether correctness validation ran first, any CSS output or runtime behaviour change, and why a benchmark or snapshot was skipped.
