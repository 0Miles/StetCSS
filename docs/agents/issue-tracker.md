# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh issue create --blocked-by <n>,<n> ...` or `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Count open blockers**: `gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary.blocked_by` (open blockers only; 0 means startable). `gh issue view <n> --json blockedBy` also lists closed blockers, so filter it: `--jq '[.blockedBy.nodes[] | select(.state == "OPEN")] | length'`.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: post the explanation with `gh issue comment <number> --body "..."`, then `gh issue close <number>`. On an already-closed issue, `gh issue close --comment` drops the comment and still exits 0.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

File issues only into the user's own repo. Never file into `mattpocock/skills` (the repo these skills come from) unless the user owns it. In a fork, `gh` can default to the upstream parent, so before the first `gh issue create` of a session, check the target with `gh repo view --json nameWithOwner` and confirm it with the user if it is not their repo.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number>`, then `gh pr view <number> --comments` (off a TTY, `--comments` prints only the comments, not the body), and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## Research notes

Research findings live as GitHub issues labelled `research`, not as files in the repo. The project direction is likewise an issue: #4, labelled `direction` and pinned.

- **Publish**: write the note to a scratch file outside the repo, then `gh issue create --label research --title "Research: <topic>" --body-file <file>`. The title comes from the note's H1; drop the H1 from the body.
- **Links**: relative repo links do not resolve in issues. Name repo files as plain text (`packages/core/package.json`), and write upstream issues as `master-co/css#<n>` so they do not link to this repo's issues.
- **Update**: `gh issue edit <n> --body-file <file>`.
- Never commit research notes; `docs/research/` is git-ignored.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: see **Blocking** under Conventions.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (see **Count open blockers**, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

## 什麼該變成票

審查與實作途中的發現預設不開票，照順序判斷去處：

1. **當場修掉**：三條都成立就改在手上的 diff 裡，commit 訊息帶一句。不確定算不算就是不算。
   - 不改公開契約：產生的 CSS、class 語法、`@stet-css/*` 的公開 API 與型別、設定檔格式、CLI。
   - 不需要新增測試。
   - 小到寫票比改還貴。
2. **開票**：滿足任一條。
   - 擋住一張已經決定要做的票（寫出哪一張）。
   - 對應一個已經觀察到的使用者可見錯誤行為（寫重現步驟或實際輸出，不是推論）。
   - 是母票驗收區明文列出的項目（寫出母票與哪一項）。

   「使用者」是 `AGENTS.md` 說的前端開發者，不含維護者。測試穩定性、殘留暫存檔、覆蓋率缺口傷的是跑測試的人，不記；哪天真的擋住一次合併，改走第一款。

3. **其他不記**，尤其是「X 沒有判準／讀數／守門測試／型別上擋不住」。要變成票，必須指出一個因為缺它而實際漏掉的錯誤行為。

代理不自己開票：把需要開的票列給維護者，標題用 `GLOSSARY.md` 的詞，逐項標明過的是哪一條，過不了的標「不記」。

已經開出來的票過不了門檻時，以 `gh issue close <n> --reason "not planned"` 關掉，不掛 `wontfix`。留言寫過不了哪一條、缺什麼、什麼條件成立該重開。拒絕一個請求時，理由寫在關票留言，不另建紀錄。

標籤是 `research` 或 `direction` 的票是筆記，不是工作票，不套用這一節。

## Definition of Done

PR 合併之後才走；合併前只把證據補到票上，不勾驗收、不關票。PR 正文用 `Refs #<n>` 連到票，不用 `Closes`，關票只在這裡決定。

1. 跑完驗收所需的檢查（`dev-workflow.md`〈指令〉），確認票的範圍全部交付。
2. 驗收區（`## Acceptance criteria` 底下的 checkbox）每一項有直接證據，才把 `- [ ]` 改成 `- [x]`，用 `gh issue edit <n> --body-file <file>` 更新全文；不改驗收項目的文字與驗收區以外的內容。仍有未勾項時票保持開啟，回報缺什麼。
3. 留完成摘要：commit、完成的行為、逐項驗收證據、檢查結果、沒修的審查 finding 與理由、仍需揭露的限制。
4. 關票：`gh issue close <n> --reason completed`。接手只用 assignee 表示，不用另外拿掉標籤。
5. 讀回內文與狀態（`gh issue view <n> --json body,state`），確認驗收全部是 `[x]`、狀態是 `CLOSED`，才回報完成。

母票（標籤 `epic` 的總票、規格票）等所有子票關閉才收：
- 總票 `## 範圍（待展開）` 的 checkbox 照第 2 步的規則勾選。
- 有 `## 完成條件` 的，每一條都要有證據，才留言並關閉。
- 沒有 `## 完成條件` 的（例如規格票），子票都關閉後就留言並關閉。
