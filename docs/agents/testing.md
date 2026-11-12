# 測試

## 六條門檻

1. **說得出它防止哪一個故障，才寫。** 一句話講清楚：什麼情況下會壞、壞了誰受害。只講得出「驗證有傳進去」「驗證有被呼叫」的不寫。兩支抓得到真缺陷的測試，勝過七支只證明程式碼長成現在這樣的測試。
2. **不測接線。** 以下都是同義反覆，型別檢查與 code review 已經擋住：
   - 建置外掛把選項原樣轉交給 engine。
   - 函式回傳自己的字面值。
   - `vi.mock` 拋出的例外被原樣接住。

   不為了覆蓋率隔離無狀態的輔助函式。
3. **不測不是我們寫的東西。** 包括：
   - Node 標準函式庫。
   - Vite、webpack、Next.js、Nuxt 等框架本身的行為。
   - lightningcss 的 CSS 解析。
   - 瀏覽器的 cascade。

   用真的框架跑建置的整合測試，測的是我們的外掛接進框架之後的輸出，不算測框架。
4. **行為導向、重構友善。** 只驗公開契約與可觀察的行為。這個 repo 最主要的契約是產生的 CSS（`AGENTS.md` 的 Invariants）。重構內部、升級相依套件、微調文案，都不該讓測試變紅。
5. **判準必須被缺陷打紅，而且只紅它自己。** 改壞它宣稱要守的那一個行為，確認它會紅、其他測試不會。讀程式碼判斷不出來，做法見下一節。
6. **違反上面任一條，必須換到更有價值的另一條。** 在該測試的 docstring 寫明放棄了什麼、換到什麼。

## 第 5 條：反向驗證怎麼做

把測試宣稱要擋的缺陷放進產品碼，看它會不會紅。只在寫新的守門測試時做一次。

1. 從 docstring 取出它守的那一個行為。講不出「壞了會怎樣」的，照第 1 條刪掉。
2. 到產品碼找直接控制那個行為的地方。找不到，代表判準指向的是形狀，不是行為。
3. 注入最小缺陷：改一個值、一個比較符號或一個分支。
4. 單獨跑，回答「會不會紅」；跑全套，回答「是不是只紅它自己」。兩者對不上時，先懷疑跨行程共用的資源：
   - 期限、負載與埠。
   - 暫存檔。
   - 子行程。
   - 共用的建置輸出（`dist`）。

   把波及範圍裡和缺陷無關的那幾支單獨重跑確認。
5. 判讀，見下表。
6. 還原，並確認檔案逐位元相同。

| 結果 | 意義 | 處置 |
| --- | --- | --- |
| 沒紅 | 空殼：判準沒打到它宣稱的行為 | 重寫判準，或刪掉 |
| 紅了，波及範圍解釋得通 | 通過 | 留著 |
| 紅一片，而且多數與缺陷無關 | 判準沒指向特定行為 | 拆細 |

缺陷的真實症狀就是啟動即失敗時，整套在載入階段爆掉不算第三種。

### 這個 repo 的指令

單跑與全套見 `dev-workflow.md`〈指令〉。repo 沒有突變測試工具，缺陷用手工注入，還原要自動化：

```bash
f=packages/<套件目錄>/src/<檔案>.ts
cp "$f" "$f.orig"; before=$(shasum -a 256 < "$f.orig")
trap 'mv "$f.orig" "$f"; [ "$(shasum -a 256 < "$f")" = "$before" ] && echo restored || echo RESTORE-MISMATCH' EXIT
# 在 $f 注入最小缺陷，然後：
bun run --filter <套件名> test -- --run tests/<測試檔>
bun run check -- --continue
```

- **同一個套件的測試**：測試 import `../src`，不必重新建置就讀得到缺陷。
- **其他套件的測試**：不一定讀得到下層套件的 `src`。例如 engine 的測試沒有反映 lexer `src` 裡注入的缺陷；建置整合測試起的 Vite、webpack、Nuxt、Next 則用 Node 的模組解析，讀的是 `exports` 指向的 `dist`。缺陷注入在下層套件時，先 `bun run build` 再跑上層的測試。
- **還原之後**：如果注入期間跑過 `bun run build`，還原後要再 build 一次，否則 `dist` 會留著缺陷。

## 測試分層

一支測試放在**看得到那個故障的最便宜那一層**。各套件測試的放置位置與 fixture 規則，以 `packages/<name>/AI.md` 的「Validation」節為準，例如 eslint-plugin 的 `tests/issues/<n>.test.ts`、nuxt 每個模式各一個 fixture。

- **單元**（Vitest，`packages/<套件>/tests/`）
  - 測什麼：engine、lexer、preset、compiler 等純邏輯，斷言產生的 CSS 字串或語法結構。
  - 相依：用真的套件，沒有網路或外部服務。本套件讀 `../src`，其他套件可能讀 `dist`。
  - 例：`packages/lexer/tests/class.test.ts`。
- **建置整合**（Vitest）
  - 測什麼：用真的框架對 `tests/fixtures/` 跑建置或起 dev server，斷言輸出的 CSS 與檔案。
  - 例：
    - `packages/vite/tests/dev-hmr.test.ts`
    - `packages/webpack/tests/runtime-e2e.test.ts`
    - `packages/nuxt/tests/static.test.ts`
    - `packages/next/tests/*-e2e.test.ts`：只在 `--mode e2e` 下跑，由 `bun run e2e` 觸發。
- **瀏覽器**（Playwright Firefox，`packages/runtime/e2e/` 與 `packages/runtime/tests/issues/`）
  - 測什麼：runtime 在真的瀏覽器裡的行為，包括 DOM 變動時產生規則、CSSOM 的插入順序、主題與 mode。
  - 例：`packages/runtime/e2e/theme-layer-order.test.ts`。
- **效能**（engine 和 runtime 的 `bench`）
  - 測什麼：效能退步。
  - 怎麼判讀：看各自 `AI.md` 的說明。
- **範例建置**（`bun run build:examples`）
  - 測什麼：每個範例在真的框架下建置得起來，只看建置是否成功。
- **只有實機看得到的**
  - 例：頁面上的實際呈現、dev server 的熱更新體驗、在範例裡手動改 class 的結果。
  - 交給 `dev-workflow.md`〈實機驗收〉。

## docstring 寫什麼

以下三件事寫在該測試的 docstring：

- 第 1 條的「防哪一個故障」。
- 第 6 條的取捨。
- 反向驗證的結論。

反向驗證只寫一句結論：注入了什麼、紅了哪幾支，例如「`<檔名>` 判斷範圍那一行的 `=== 0` 換成 `!==`，只紅本支」。不寫日期、步驟編號，也不寫單檔和全套各紅幾支的過程。
