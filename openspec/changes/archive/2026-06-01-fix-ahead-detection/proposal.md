## Why

工具的核心用途是「找出落後 remote、該更新的 repo」。但 `getBranchStatus` 在兩種情況下會把實際落後的 repo 靜默顯示為「已最新」而漏掉，直接違背此用途。

## What Changes

- 修正 ahead 計算基準不一致：有 upstream 的 branch，ahead 應相對自己的 upstream（`@{u}..branch`），與 behind（`branch..@{u}`）對稱；目前 ahead 卻一律用 `--not --remotes`（相對「任何 remote」），導致已推到其他 remote 的 commit 被漏算。
- 修正 default branch 本機不存在時的漏判：`origin/HEAD` 指向 `main` 但本機未 checkout（無 `refs/heads/main`）時，rev-list 因 ref 無法解析而報錯，`parseInt(...)||0` 把 ahead 與 behind 都靜默歸 0，repo 被誤判為同步。改為偵測到 ref 無法解析時明確標示「本機無此分支」，不再假裝同步。
- 範圍僅此 ahead/behind 偵測修正。**不含** exec→execFile 重構、SYNC_REPOS 路徑校驗、`.env` 寫入中和等其他審核發現（各自獨立提案）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `status-check`: 修改 ahead 計算的 requirement（有 upstream 時相對 `@{u}` 而非 `--not --remotes`）；新增「default branch 本機不存在」的處理 requirement（明確標示而非靜默歸 0）。

## Impact

- `index.js`：`getBranchStatus`（約 90-101 行）ahead 計算與 ref 無法解析的處理；`getDefaultBranch`（約 77-88 行）或其呼叫端，需區分「本機有此 branch」與「僅 remote 有」。
- `openspec/specs/status-check/spec.md`：對應 scenario 更新。
- 顯示輸出（`renderRepo`）可能新增一種「本機無此分支」標示，影響 `cli-output` 觀感但不改其 requirement。
- 無新依賴；無破壞性變更（僅修正錯誤輸出）。
