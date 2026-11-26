# 專案檢查指令

由 sorry-matt get-to-work 依 repo 內容產生（2026-11-26）。來源：根目錄 `package.json` 的 `scripts`、`.github/workflows/ci.yml` 的 `run` 步驟、`docs/agents/dev-workflow.md`〈指令〉。

## Full checks

CI 的 `checks` job 依序執行（`.github/workflows/ci.yml`）；在新的 worktree 先跑 `bun install --frozen-lockfile`，第一次先裝 Playwright 瀏覽器（`bun x --no-install playwright install --only-shell chromium firefox`）。

```sh
bun run check -- --continue
bun run check:release
bun run check:naming
bun run check:packages
bun run build:examples -- --continue
bun run e2e
bun pm untrusted
```

`bun pm untrusted` 列出套件時結束碼仍是 0，輸出要是 `Found 0 untrusted dependencies with scripts.`。本機的已知失敗見 `docs/agents/dev-workflow.md`〈判讀結果〉。

## Targeted checks

單一套件（來源：`docs/agents/dev-workflow.md`〈邊做邊驗〉）：

```sh
bun run --filter <套件名> test -- --run <相對套件目錄的測試檔>
bun run --filter <套件名> lint
bun run --filter <套件名> type-check
```

改到 `packages/<name>/` 的檔案就跑該套件的三項，再跑 `packages/<name>/AI.md`「Validation」節要求的檢查。`--filter` 單跑不會先建置；結果和 `bun run check` 不一致時先跑 `bun run build`。

## Coverage

none

## Failures only

none

## Sensitive paths

.github/workflows/
.claude/settings.json
release-please-config.json
.release-please-manifest.json
scripts/publish-packages.mjs
scripts/published-packages.mjs
scripts/check-release-manifest.mjs
scripts/check-package-contents.mjs
packages/vscode/scripts/release.js
