# @stet-css/runtime

Runs the engine in the browser. `CSSRuntime` observes DOM class changes, keeps per-class **usage counts**, and inserts or deletes native rules in its own `style#master-css`. It never reads or adopts rules already on the page: static CSS from a build and the runtime's sheet are independent.

## Boundaries

- Framework provider lifecycle → the framework packages. No build plugin injects the runtime: a project imports it itself with the two Vite virtual modules, `virtual:master-css-manifest` and `virtual:master-css-emitted-globals` (`examples/lit`).

## Risks

- **Inheritance**: `CSSRuntime` extends engine `MasterCSS`, so every `MasterCSS` method ships to browsers. Keep tooling-only methods off `MasterCSS` (runtime surface in `AGENTS.md`).
- **Bundle audit**: `dist/global.min.js` stays free of devtools hook globals, generic listener maps, and event emit callsites. Debug helpers in `src/debuggers` run only under `process.env.NODE_ENV === 'development'`.
- **Usage counts**: a class keeps its rules while its `classCounts` entry lives. Pair every increment with its decrement across `MutationObserver` diffs, for Document and ShadowRoot roots alike.
- **Emitted globals**: emittedGlobals variable and keyframe counts stop duplicate global insertion and leave utility insertion untouched.
- **Native indexes**: locate a native rule by identity (`findNativeCSSRuleIndex`) before deleting it; a guessed index deletes the wrong rule.
- **FOUC**: runtime removes `hidden` from `<html>` after its first render, for pages that hide the root until it runs; no build integration adds `hidden` any more. Every failure path reveals too: `create()` and `observe()` remove `hidden` before rethrowing, and the CDN bundle starts a 3 s timer in `src/reveal-timeout.ts`, imported first in `global.min.ts` so it runs before any other bundled module evaluates.
- **Global names** `MasterCSSRuntime` (the class, holding `instances`) and `masterCSSRuntime` (the document instance) are public; rename them only on request.
- **Named access**: page elements with an `id` or `name` occupy same-named `window` globals, and `name`d `img`/`form`/`embed`/`object`/`iframe` elements shadow `document` members. Read the runtime's own class directly, accept a `MasterCSSRuntime` global only when `isRuntimeClass` passes, and read `document` members through `src/document.ts`.

## Validation

- `e2e` (Playwright) is the test suite and covers `e2e/**` and `tests/issues/**`. Extend `e2e/lifecycle.test.ts`, `e2e/class-usages.test.ts`, or `e2e/dom-clobbering.test.ts` (named access), or add an issue regression under `tests/issues/`.
- Run `bench` when changing DOM observation, class tracking, lifecycle, CSSOM insertion or deletion, or the global bundle. e2e asserts browser correctness; timing belongs to `bench`. Report bench status, global bundle impact, memory / cold-start / CPU / CSSOM trade-offs, and whether CSS output changed.
