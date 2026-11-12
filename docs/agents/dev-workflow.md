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

開 PR 前，以下四條都要在本機跑。CI 會再跑前三條，但第 4 條只在本機跑，而且 CI 的結果要 push 之後才看得到。

1. `bun run check -- --continue`：所有套件的 `test`、`lint`，以及有 `type-check` script 的套件的型別檢查。`--continue` 讓所有 task 跑完再回報。
2. `bun run build:examples -- --continue`：建置 `examples/` 的每個範例。
3. `bun run e2e`：先跑建置整合的 e2e，通過後再單獨跑 runtime 的 Playwright e2e。
   - 不要加參數：參數會接到 script 最後的 runtime e2e 上。
4. 動到的每個套件，跑它 `packages/<name>/AI.md` 的「Validation」節另外要求的檢查。這些檢查不在 `check` 裡，例如：
   - svelte 用 `check`（svelte-check）做型別檢查，沒有 `type-check` script。svelte-check 用舊版 TypeScript 的編譯器 API，要經過相容包裝才跑得起來：`node scripts/with-typescript-tooling-compat.mjs bun run --filter @stet-css/svelte check`。
   - next 要跑 `dev:build`。
   - engine 和 runtime 要跑 `bench`。

**CI**

`.github/workflows/ci.yml` 在每支 PR 開啟、重新開啟或有新的 push 時執行，每次推到 main 也執行。同一支 PR 有新的 push 時，舊的那次會被取消。每次都跑三個 job，不依改動範圍挑選：

- `checks`：在 Linux 上跑全套的第 1 到 3 條。
- `all-platforms`：裝齊 VS Code 擴充 9 個 target 的原生套件，跑 `master-css-vscode` 的測試，再確認每個 target 的原生套件都解析得到。
- `required`：等其他 job 跑完，全部是 success 才是 success。分支保護只要求這個檢查，見〈分支、commit 與合併〉。

兩個安裝相依的 job 裝完都跑 `bun pm untrusted`，輸出列出任何套件就失敗。

看結果：

- PR：`gh pr checks <n>` 列出每個 job 的結果與連結；`gh pr checks <n> --required` 只列 `required`。
- 推到 main 的那次：`gh run list --workflow ci.yml --branch main`。
- 失敗的 log：`gh run view <run-id> --log-failed`。`required` 的 log 會印出它等的每個 job 的結果。

在 `ci.yml` 新增 job 時，同時加進 `required` 的 `needs`，否則 `required` 會失敗，並列出漏掉的 job。`required` 只比對 `ci.yml`，而且每個 job 都要是 success，所以：

- 放在其他 workflow 檔的 job 擋不住合併。
- `ci.yml` 裡只在特定事件才跑的 job，被跳過時 `required` 也會失敗。

**判讀結果**

- **已知失敗**：除了下面三項，其餘都要通過。
  - `build:examples` 的 `master-css-angular-example#build`：Angular CLI 要求 Node 24.15 以上（見 #22）。
  - `build:examples` 的 `master-css-nuxtjs-example#build`：nitro 打包時出現 `ENAMETOOLONG`（見 #22）。
  - svelte 的 `check`：`packages/svelte/src/lib/vite.ts` 有 2 個型別錯誤，因為 vite 8.0.16 和 8.1.0 兩份型別互不相容。

  前兩項只在本機失敗：CI 的 Node 是最新的 24.x，路徑也短，兩個範例都建置得起來。CI 上這兩項失敗，就照回歸處理。
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
- main 有分支保護，唯一的必要檢查是 CI 的 `required`。合併前 `required` 必須是 success：`gh pr checks <n> --required` 顯示 `pass`。還在跑就加 `--watch` 等它跑完；失敗就修好再 push。
- `required` 不是 success 時，`gh pr merge` 會拒絕，並提示可以加 `--admin`。代理不用 `gh pr merge --admin`：它用管理員權限繞過分支保護。真的需要繞過時，先問維護者，見 `AGENTS.md` 的「Stop and ask」。
- 合併前不必先跟上最新的 main。推到 main 之後，CI 會再跑一次。
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
