## Context

`getBranchStatus(dir, branch)` 負責計算一個 branch 的 ahead/behind。目前 ahead 用 `git rev-list ${branch} --not --remotes --count`（不在「任何 remote」的 commit 數），behind 用 `git rev-list ${branch}..${branch}@{u} --count`（落後自己 upstream 的 commit 數）。兩者基準不一致。

更嚴重：`getDefaultBranch` 從 `origin/HEAD` 可能回傳「只存在於 remote、本機未 checkout」的 branch 名（如 `main`）。`getBranchStatus` 收到這個名字後，兩個 rev-list 都因 ref 解析失敗而報錯，`parseInt(...)||0` 把 ahead 與 behind 雙雙靜默歸 0，導致真正落後 remote 的 repo 被顯示為同步。

## Goals / Non-Goals

**Goals:**
- ahead 與 behind 基準對稱，有 upstream 時皆相對自己的 `@{u}`
- default branch 本機不存在時不再假裝同步，明確標示「本機無此分支」
- 修正後行為可被 scenario 測試覆蓋

**Non-Goals:**
- exec → execFile 重構（獨立提案）
- current branch 的 ahead/behind 邏輯（目前已正確用 `HEAD..@{u}`，不動）
- 新增多 remote 支援

## Decisions

### 決策 1：有 upstream 時 ahead 改用 `@{u}..branch`

**選項 A（採用）**：`git rev-list ${branch}@{u}..${branch} --count`  
**選項 B（現況）**：`git rev-list ${branch} --not --remotes --count`

選 A。與 behind（`branch..@{u}`）完全對稱；語意是「相對自己的 upstream 領先幾個 commit」，符合 `⇡` 符號的語意。選項 B 在多 remote 環境下會漏算。

### 決策 2：無 upstream 時 ahead 維持 `--not --remotes`

沒有 upstream 的 branch（顯示 `†`）無法用 `@{u}`。此情況繼續用 `--not --remotes` 計算「不在任何 remote 的 commit 數」，語意合理。邏輯：先查 upstream 存在與否，再決定 ahead 計算方式。

### 決策 3：default branch 本機不存在時，改用 remote ref 計算

`origin/main` 即 `refs/remotes/origin/main`，即使本機無 `refs/heads/main` 也可解析。

ahead（相對 `origin/main`）：`git rev-list origin/${branch}@{u}..origin/${branch}`——但 remote tracking ref 本身就是 upstream，更直接的做法是：

- ahead：`git rev-list origin/${branch}..origin/${branch}` → 永遠 0（無意義）
- 實際上 default branch「本機不存在」時只有 behind 有意義：`git rev-list HEAD..origin/${branch} --count`（切換為以 current HEAD 為基準？）

再想清楚：default branch 的 ahead/behind 意義是「default branch 本身相對其 upstream 的狀態」，用於提示「有人推了新東西到 main，但你沒 checkout main」。本機不存在時：

- **behind**：`git rev-list refs/remotes/origin/${branch}` 與 `origin/${branch}@{u}` 的差——但 `origin/main` 的 upstream 就是 remote，fetch 後兩者永遠同步，behind 永遠 0。
- 真正有意義的是：local HEAD（current branch）落後 `origin/main` 多少——但這屬於 current branch 的資訊，不是 default branch 的。

**結論**：default branch 本機不存在時，顯示 `(本機無此分支)` 標示，不顯示 ahead/behind 數字，不誤判為同步。這比靜默歸 0 誠實，也比試圖用 remote ref 計算更不易誤導。

### 決策 4：`getBranchStatus` 接收「是否本機存在」旗標

`getDefaultBranch` 改為回傳 `{ name, localExists }` 物件，`localExists: false` 時 `getBranchStatus` 跳過計算直接回傳 `{ ahead: 0, behind: 0, hasUpstream: false, localMissing: true }`。呼叫端（`renderRepo`）依 `localMissing` 顯示專用標示。

## Risks / Trade-offs

- `getDefaultBranch` 回傳型別從 `string | null` 改為 `{ name, localExists } | null`，所有呼叫端須更新（目前只有 `checkRepo` 一處）→ 範圍小，可控。
- `localMissing` 標示是新 UI 狀態，需確認 `renderRepo` 不在其他路徑誤觸。
