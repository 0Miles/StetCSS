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

以下五條都要在本機跑：開 PR 前跑一次；PR 開了之後又有新的 commit，合併前在最後的 HEAD 上再跑一次。CI 會再跑第 1 到 4 條。

1. `bun run check -- --continue`：所有套件的 `test`、`lint`，以及有 `type-check` script 的套件的型別檢查。`--continue` 讓所有 task 跑完再回報。
   - 另跑 `bun run check:release`：release-please 的 config 與 manifest 要剛好列出每個要發佈的 `@stet-css/*` 套件，版號和各自的 `package.json` 相同。新增、改名或刪除套件時要一起改這兩個檔。
   - 另跑 `bun run check:packages`：先建置，再用 `bun pm pack` 打包每個要發佈的 `@stet-css/*`（不連 registry），檢查 tarball：`exports`、`main`、`types`、`browser`、`bin`、`typesVersions` 指到的檔都在，有 `LICENSE`；`.js`／`.d.ts` 的相對 import 都解析得到、沒有 repo 內部的 `~/` 路徑，import 的套件都列在 `dependencies`、`peerDependencies` 或 `optionalDependencies`（宿主專案提供的套件列成 optional peer）；依賴沒有留下 `workspace:` 之類的本地協定，`package.json` 有 `files`，`repository`／`bugs`／`homepage` 指向 `0Miles/StetCSS`。
2. `bun run build:examples -- --continue`：建置 `examples/` 的每個範例。
3. `bun run e2e`：先跑建置整合的 e2e，通過後再單獨跑 runtime 的 Playwright e2e。
   - 不要加參數：參數會接到 script 最後的 runtime e2e 上。
4. `bun pm untrusted`：輸出要是 `Found 0 untrusted dependencies with scripts.`。它列出套件時結束碼仍是 0，所以看輸出。
5. 動到的每個套件，跑它 `packages/<name>/AI.md` 的「Validation」節另外要求的檢查。這些檢查不在 `check` 裡，例如：
   - svelte 用 `check`（svelte-check）做型別檢查，沒有 `type-check` script。svelte-check 用舊版 TypeScript 的編譯器 API，要經過相容包裝才跑得起來：`node scripts/with-typescript-tooling-compat.mjs bun run --filter @stet-css/svelte check`。
   - next 要跑 `dev:build`。
   - engine 和 runtime 要跑 `bench`。

**CI**

`.github/workflows/ci.yml` 在 PR 開啟、重新開啟、有新的 push 時，以及推到 main 時執行，每次全跑，不依改動範圍挑選。下面的 job 名稱就是 `gh pr checks` 列出的名稱：

- `checks`：在 Linux 上跑全套的第 1 到 4 條。
- `all-platforms`：裝齊 VS Code 擴充每個 target 的原生套件，跑 `master-css-vscode` 的測試，再確認每個 target 的原生套件都解析得到；也跑第 4 條。本機的安裝只有本機平台的原生套件，所以這個 job 只在 CI 跑。
- `required`：等其他 job 跑完，全部是 success 才是 success。合併只看它，見〈分支、commit 與合併〉。

看結果：

- `gh pr checks <n>`：每個 job 的結果與連結。PR 剛開、還沒有任何檢查時，它會回 `no checks reported`，稍後再跑。
- `gh run view <run-id> --log-failed`：失敗步驟的 log。`required` 的 log 會印出它等的每個 job 的結果。

在 `ci.yml` 新增 job 時，同時加進 `required` 的 `needs`；漏了的話 `required` 會失敗，並列出漏掉的 job。`required` 只比對 `ci.yml`，而且每個 job 都要是 success，所以：

- 放在其他 workflow 檔的 job 擋不住合併。
- `ci.yml` 裡只在特定事件才跑的 job，被跳過時 `required` 也會失敗。

**判讀結果**

- **已知失敗**：除了下面三項，其餘都要通過。
  - `build:examples` 的 `master-css-angular-example#build`：Angular CLI 要求 Node 24.15 以上（見 #22）。
  - `build:examples` 的 `master-css-nuxtjs-example#build`：nitro 打包時出現 `ENAMETOOLONG`（見 #22）。
  - svelte 的 `check`：`packages/svelte/src/lib/vite.ts` 有 2 個型別錯誤，因為 vite 8.0.16 和 8.1.0 兩份型別互不相容。

  前兩項只在本機失敗：CI 的 Node 24 不低於 24.15，路徑也短，兩個範例都建置得起來。CI 上這兩項失敗，照回歸處理。
- **回歸**：新出現的失敗重跑一次仍然失敗，才算回歸。CI 上用 `gh run rerun <run-id> --failed` 重跑，`required` 會一起重跑。失敗看起來和改動無關時，先看 main 最近一次的 CI 是不是也紅，見〈合併之後〉。

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
- 合併任何 PR 前，CI 的 `required` 必須是 success，開到整合分支的 PR 也一樣：
  1. `gh pr checks <n> --watch`：等全部的檢查跑完。
  2. `gh pr checks <n> --json name,bucket --jq '.[] | select(.name == "required") | .bucket'` 要印出 `pass`。印出空白，代表 `required` 還沒出現（它等其他 job 跑完才建立），回到第 1 步。印出 `fail`，就修好再 push。

  `--required` 旗標依 base 分支的保護設定挑檢查，`required` 還沒出現、或 base 不是 main 時，會直接報 `no required checks reported`，所以用上面的 `--jq`。
- main 有分支保護：必要檢查只有 `required`，不要求分支跟上最新的 main。進 main 的 PR，`required` 不是 success 時，`gh pr merge` 會拒絕，並提示可以加 `--admin`。
- 分支保護不對管理員強制，而代理通常用維護者的管理員帳號登入 gh。必要檢查擋不住這個帳號：`gh pr merge --admin`、透過 API 合併、直接推到 main 都會成功。上一條的拒絕是 gh 讀到合併狀態是 BLOCKED 之後在本機擋下的，剛 push、狀態還沒算出來時不會擋，所以合併前一定先照上面的兩步確認 `required`。要用任何方式繞過分支保護，先問維護者，見 `AGENTS.md` 的「Stop and ask」。
- 動到〈實機驗收〉列出的套件時，要先做完實機驗收才合併。

**合併之後**

- 沒有部署。
- 推到 main 的那次 CI：`gh run list --workflow ci.yml --branch main --limit 1`。被下一次合併取消的，看下一次。紅了就是合併後才出現的問題，例如兩支各自綠燈的 PR 互相衝突；之後每支 PR 的 `required` 都會跟著紅，先修好 main。
- 主 checkout：執行 `git switch main && git pull --ff-only`；`bun.lock` 有變動時，再執行 `bun install --frozen-lockfile`。
- 來自票的 PR：接著走 `issue-tracker.md`〈Definition of Done〉。
- 整合分支的 PR：合併進 main 之後，再逐張收它底下的票。

**發佈**：npm 和 VS Code 擴充的發佈不屬於合併流程。發佈前先問維護者，見 `AGENTS.md` 的「Stop and ask」。

**版號與 release PR**

- 每個要發佈的 `@stet-css/*` 共用一個版號，設定在 `release-please-config.json`（`linked-versions`）與 `.release-please-manifest.json`。VS Code 擴充、examples、benchmarks、shared 不在裡面，VS Code 擴充照舊用 `release:vscode`。
- 推到 main 時，`.github/workflows/release-please.yml` 開出或更新 release PR：新版號、各套件的 `CHANGELOG.md`，再把 `bun.lock` 同步後 commit 回 PR 分支。release PR 合併後，下一次執行會替每個套件建立 GitHub release 與 tag（`<套件名>-v<版號>`，例如 `core-v0.1.0`），接著發佈到 npm，見〈發佈到 npm〉。
- 目前的版號是 `0.0.0`，代表還沒發佈過。release-please 把 manifest 裡的 `0.0.0` 當成沒有前一版，第一張 release PR 不看 commit 類型，直接用 config 的 `initial-version`（`0.1.0`）；changelog 從 config 的 `bootstrap-sha` 之後算起。發佈過之後 `initial-version` 不再作用，不必拿掉。
- 之後的版號由 commit 類型決定。1.0 之前：`fix` 升 patch（`0.1.0` → `0.1.1`），`feat` 升 minor（→ `0.2.0`），帶 `!` 的破壞性變更也只升 minor（→ `0.2.0`）。
- workflow 只在 repo 變數 `RELEASE_PLEASE_ENABLED` 是 `true` 時執行。workflow 全程用 `GITHUB_TOKEN`，不存個人 token。release PR 由 `github-actions[bot]` 開，它的 CI 每次更新後都停在等待核准，維護者要在 PR 上按 "Approve and run workflows"，PR 才會有 `required`。變數由維護者設定。
- 不要手改版號，版號只由 release PR 改。新增或移除套件時，在 manifest、config 的 `packages` 與 `linked-versions` 各加或刪一筆，版號照目前的共用版號。

**發佈到 npm**

同一個 workflow 在 release-please 建立 release 之後，接著跑兩個 job。沒有建立 release 的執行不會發佈。

- `pack`：checkout release 的 tag，安裝、跑 `check:release` 與 `check:packages`（含建置），再用 `bun pm pack` 把每個要發佈的套件打包成 tarball。套件版號和 tag 的版號不同時直接失敗，所以 `0.0.0` 發不出去。
- `publish`：只下載 tarball，確認每個都是 `@stet-css/*`、版號和 tag 相同，再用 `npm publish <tarball> --access public --provenance --ignore-scripts` 上傳。`--ignore-scripts` 讓 npm 不跑任何 lifecycle script，tarball 原樣上傳。只有這個 job 有 `id-token: write`，它不安裝依賴。
- 用 npm 上傳而不是 `bun publish`：Bun 1.4.4 的 `bun publish` 不支援 npm trusted publishing（OIDC），也產生不了 provenance；`bun pm pack` 負責把 `workspace:^` 改寫成實際版號。
- 順序與中斷：npm 沒有跨套件的交易。腳本（`scripts/publish-packages.mjs`）先問 registry 每個版號在不在，再照依賴順序上傳缺的，已經在 npm 上的跳過，任何一個失敗就停。先發被依賴的套件，所以中斷時 npm 上不會有套件依賴還沒發佈的版號。
- 中斷後補發，兩種都只補還沒發佈的套件：
  - `publish` 失敗後 7 天內：在那次執行按「Re-run failed jobs」。tarball 的 artifact 只留 7 天，過期後這個做法會在下載 artifact 時失敗。
  - 其他情況：從 main 手動執行 workflow（`workflow_dispatch`），`tag` 填那次 release 的任一個 tag，例如 `core-v0.1.0`。包括 artifact 過期、`pack` 回報 release-please 沒有給 tag、release-please 建立 release 到一半就失敗。從其他分支執行會被拒絕。
  - 「Re-run all jobs」沒有用：release 已經存在，release-please 第二次不會回報建立了 release，`pack` 會被跳過。
- 開關：repo 變數 `NPM_PUBLISH_ENABLED` 是 `true` 才會跑，沒設時兩個 job 都跳過。首次發佈（#96）前保持不設。
- 認證：npm 要等套件存在才能設定 trusted publisher，所以首次發佈用 repo secret `NPM_TOKEN`（granular token，只給 `@stet-css` scope 的讀寫權限，有效期設最短）。之後每個套件在 npm 設定 trusted publisher：repository `0Miles/StetCSS`、workflow `release-please.yml`、不填 environment，再刪掉 `NPM_TOKEN`。workflow 改檔名時，28 個套件的設定都要跟著改。
- `publish` 沒有掛 GitHub environment。npm 的 trusted publisher 只比對 repo 與 workflow 檔名，不比對分支，所以有寫入權限的人可以在別的分支改這個 workflow 來取得發佈身分。目前只有維護者有寫入權限；加入協作者之前，替 `publish` 加上限定 main 的 environment，並在 npm 的 trusted publisher 填同一個 environment。
- 代理不設定變數與 secret、不碰 npm、不手動觸發發佈；這些都是維護者的事，見 #84 與 #96。

維護者首次發佈的步驟（#84 完成、改名 #18 合併之後）：

1. 確認 npm 上的 `@stet-css` organization 屬於自己，建立 granular token（`@stet-css` scope 讀寫、有效期最短），存成 repo secret `NPM_TOKEN`。CI 沒辦法輸入 2FA 驗證碼，token 可能要勾選「Bypass two-factor authentication」，否則第一個套件就會以 `EOTP` 失敗；這一點沒有實測過，以 npm 建立 token 頁面的選項為準。
2. 確認 `RELEASE_PLEASE_ENABLED` 是 `true`，release PR 已經開出來，核准它的 CI run 後 PR 上有 `required`。
3. 檢查 release PR：版號是 `0.1.0`，每個套件有 `CHANGELOG.md`，`bun.lock` 的 workspace 版號已同步，`required` 是 success。
4. 把 repo 變數 `NPM_PUBLISH_ENABLED` 設成 `true`，再合併 release PR。
5. 看那次 `Release Please` 執行：`release-please` 建立 28 個 release，`pack`、`publish` 成功，npm 上 28 個套件都是 `0.1.0` 並帶 provenance。`publish` 中途失敗就照上面補發。
6. 在 npm 替 28 個套件設定 trusted publisher，撤銷並刪除 `NPM_TOKEN`，再把每個套件的 publishing access 改成「Require two-factor authentication and disallow tokens」，之後外流的 token 也發佈不了。下一次 release 走 OIDC。

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

3. 在瀏覽器打開頁面，加上或修改受影響的 class，核對產生的 CSS 規則和計算後的樣式符合改動的宣稱。runtime 的改動還要確認：動態加進 DOM 的 class 也會產生規則。`examples/lit` 的 runtime 只掛在 `<my-element>` 上，動態 class 要加在它的 shadow DOM 裡；頁面其他地方的 class 由 build 時的 static CSS 提供。
4. 停掉服務，確認 `git status` 沒有多出追蹤中的改動。

**範圍**

- 只能改範例裡為了驗收臨時加的 markup，結束前要還原。
- 不安裝新套件、不推送、不發佈。
- 服務只綁 localhost。

**報告**：用 `gh pr comment <n> --body-file <file>` 貼在 PR 上，內容包括：

- 用了哪個範例、跑了哪些指令。
- 核對了哪些 class，結果如何。
- 截圖或 CSS 片段。
