# @stet-css/runtime

Runs the engine in the browser. `CSSRuntime` observes DOM class changes, keeps per-class **usage counts**, and inserts or deletes native rules in `style#master-css`; when that style arrives prerendered, it **hydrates** the sheet from a hydration manifest instead of regenerating it.

## Boundaries

- Prerendering `style#master-css` and its hydration manifest → `@stet-css/server` (via engine `createHydrationManifest`); the manifest format → `@stet-css/schema/hydration-manifest`.
- Framework provider lifecycle → the framework packages; when and how the runtime is injected → the build plugins.

## Risks

- **Inheritance**: `CSSRuntime` extends engine `MasterCSS`, so every `MasterCSS` method ships to browsers. Keep tooling-only methods off `MasterCSS` (runtime surface in `AGENTS.md`).
- **Bundle audit**: `dist/global.min.js` stays free of devtools hook globals, generic listener maps, and event emit callsites. Debug helpers in `src/debuggers` run only under `process.env.NODE_ENV === 'development'`.
- **Usage counts**: a class keeps its rules while its `classCounts` entry lives. Pair every increment with its decrement across `MutationObserver` diffs, for Document and ShadowRoot roots alike.
- **Emitted globals**: emittedGlobals variable and keyframe counts stop duplicate global insertion and leave utility insertion untouched.
- **Native indexes**: locate a native rule by identity (`findNativeCSSRuleIndex`) before deleting it; a guessed index deletes the wrong rule.
- **Hydration** adopts a prerendered sheet only when its layers (`CSSLayerBlockRule`), theme and keyframes (`CSSKeyframesRule`) match the hydration manifest; every mismatch goes through `failHydration` to a runtime rebuild. Keep each check.
- **FOUC**: `@stet-css/vite` `avoidFOUC` adds `hidden` to `<html>`, and runtime removes it after a non-hydrating render. Validate a change on either side through the integration.
- **Global names** `MasterCSSRuntime` (the class, holding `instances`) and `masterCSSRuntime` (the document instance) are public; rename them only on request.

## Validation

- `e2e` (Playwright) is the test suite and covers `e2e/**` and `tests/issues/**`. Extend `e2e/lifecycle.test.ts`, `e2e/class-usages.test.ts` or `e2e/progressive/**`, or add an issue regression under `tests/issues/`.
- Run `bench` when changing DOM observation, class tracking, lifecycle, hydration, CSSOM insertion or deletion, or the global bundle. e2e asserts browser correctness; timing belongs to `bench`. Report bench status, global bundle impact, memory / cold-start / CPU / CSSOM trade-offs, and whether CSS output, progressive hydration or fallback hydration changed.
