# 開發流程

## 指令

**環境**

- Node 24（`.nvmrc`）與 Bun 1.4.4（`package.json` 的 `packageManager`）。shell 先找到別的 Node 版本時，先切到 v24 再跑。
- `bun.lock` 有變動時，或在新的 worktree 裡，先跑 `bun install --frozen-lockfile`。worktree 不共用 `node_modules`。
- 第一次跑全套之前先裝 Playwright 的瀏覽器：`bun x --no-install playwright install --only-shell chromium firefox`。runtime 的 e2e 用 Firefox；`check` 裡 vite、webpack 的測試與 next 的 e2e 用 Chromium。

**邊做邊驗**

- **單跑一支測試**：`bun run --filter <套件名> test -- --run <相對套件目錄的測試檔>`，例如 `bun run --filter @stet-css/lexer test -- --run tests/class.test.ts`。
- **單一套件的 lint**：`bun run --filter <套件名> lint`。
- **單一套件的型別檢查**：`bun run --filter <套件名> type-check`。
- **建置**：`--filter` 單跑不會先建置。turbo 的 `test` 和 `lint` 依賴 `build`（見 `turbo.json`），所以單跑結果和 `bun run check` 不一致時，先跑 `bun run build` 再試一次。

**結束前的全套**

這個 repo 沒有 CI，開 PR 前以下四條都要跑。

1. `bun run check -- --continue`：所有套件的 `test`、`lint`，以及有 `type-check` script 的套件的型別檢查。`--continue` 讓所有 task 跑完再回報。
2. `bun run build:examples -- --continue`：建置 `examples/` 的每個範例。
3. `bun run e2e`：先跑建置整合的 e2e，通過後再單獨跑 runtime 的 Playwright e2e。
   - 不要加參數：參數會接到 script 最後的 runtime e2e 上。
4. 動到的每個套件，跑它 `packages/<name>/AI.md` 的「Validation」節另外要求的檢查。這些檢查不在 `check` 裡，例如：
   - svelte 用 `check`（svelte-check）做型別檢查，沒有 `type-check` script。svelte-check 用舊版 TypeScript 的編譯器 API，要經過相容包裝才跑得起來：`node scripts/with-typescript-tooling-compat.mjs bun run --filter @stet-css/svelte check`。
   - next 要跑 `dev:build`。
   - engine 和 runtime 要跑 `bench`。

**判讀結果**

- **已知失敗**：除了下面三項，其餘都要通過。
  - `build:examples` 的 `master-css-angular-example#build`：Angular CLI 要求 Node 24.15 以上（見 #22）。
  - `build:examples` 的 `master-css-nuxtjs-example#build`：nitro 打包時出現 `ENAMETOOLONG`（見 #22）。
  - svelte 的 `check`：`packages/svelte/src/lib/vite.ts` 有 2 個型別錯誤，因為 vite 8.0.16 和 8.1.0 兩份型別互不相容。
- **回歸**：新出現的失敗重跑一次仍然失敗，才算回歸。

## 分支、commit 與合併

**分支**

- **票**：一張票一個分支，命名為 `<主題><總票號>/<票號>-<slug>`，例如 `bun10/23-lockfile-migration`。
- **整合分支**：一張總票拆成多張票、要一起進 main 時，先開整合分支 `<主題><總票號>/<主題>`，例如 `bun10/toolchain`。票的 PR 開到這個分支。
- **沒有票的改動**：用 `<type>/<slug>`，`type` 取 Conventional Commits 的類型。

**commit**：英文 Conventional Commits，格式是 `<type>(<scope>): <summary>`，scope 用套件目錄名。一個 commit 只做一件事。

**跟上主線**：`git fetch origin && git rebase origin/main`。目標是整合分支時，就 rebase 到整合分支。不要把主線 merge 進來，歷史保持線性。

**開 PR**

- 指令：`gh pr create --base <main 或整合分支> --title "<Conventional Commit 格式的標題>" --body-file <file>`。
- 正文：repo 沒有 PR 範本，照 `pr` skill 的段落（Summary、Evidence、Merge Danger），用繁體中文寫。
- 連到票：寫 `Refs #<n>`，不要寫 `Closes`。關票在 `issue-tracker.md`〈Definition of Done〉決定。

**合併**

- 指令：`gh pr merge <n> --rebase --delete-branch`。
- 代理可以自己合併，不需要人工核准。`.claude/settings.json` 已經允許 `gh pr merge`。
- main 沒有分支保護，也沒有必要檢查。合併前，自己確認〈指令〉的全套已經通過。
- 動到〈實機驗收〉列出的套件時，要先做完實機驗收才合併。

**合併之後**

- 沒有部署。
- 主 checkout：執行 `git switch main && git pull --ff-only`；`bun.lock` 有變動時，再執行 `bun install --frozen-lockfile`。
- 來自票的 PR：接著走 `issue-tracker.md`〈Definition of Done〉。
- 整合分支的 PR：合併進 main 之後，再逐張收它底下的票。

**發佈**：npm 和 VS Code 擴充的發佈不屬於合併流程。發佈前先問維護者，見 `AGENTS.md` 的「Stop and ask」。

## 實機驗收

**什麼時候做**：PR 動到以下套件時，合併前要做：

- `packages/runtime`
- 框架整合：`packages/vite`、`webpack`、`next`、`nuxt`、`astro`、`svelte`、`integration`

**步驟**：repo 沒有驗收用的 skill 或腳本，由 `qa` 照下面做。

1. 執行 `bun run build`。
2. 挑一個用到改動套件的範例，用 `bun run --cwd examples/<名稱> dev` 起服務。有 SSR 的範例（Next.js、Nuxt、Astro）另外跑一次 `build`，再跑 `preview`（Next.js 用 `start`）。

   | 改動的套件 | 範例 |
   | --- | --- |
   | runtime | `examples/lit` |
   | vite | `examples/vite` |
   | webpack | `examples/webpack` |
   | next | `examples/next.js` |
   | nuxt | `examples/nuxt.js` |
   | astro | `examples/astro` |
   | svelte | `examples/svelte` |
   | integration | `examples/blank` |

3. 在瀏覽器打開頁面，加上或修改受影響的 class，核對產生的 CSS 規則和計算後的樣式符合改動的宣稱。runtime 的改動還要確認：動態加進 DOM 的 class 也會產生規則。
4. 停掉服務，確認 `git status` 沒有多出追蹤中的改動。

**範圍**

- 只能改範例裡為了驗收臨時加的 markup，結束前要還原。
- 不安裝新套件、不推送、不發佈。
- 服務只綁 localhost。

**報告**：用 `gh pr comment <n> --body-file <file>` 貼在 PR 上，內容包括：

- 用了哪個範例、跑了哪些指令。
- 核對了哪些 class，結果如何。
- 截圖或 CSS 片段。
