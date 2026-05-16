## Why

直接 pull 無法預覽變更範圍，容易在不清楚狀況下更新。新增狀態檢查階段，讓使用者在 pull 前先知道哪些 repo 有更新，再決定要不要執行。

## What Changes

- 執行 `node index.js` 時，先對所有目標 repo 執行 `git fetch`（並行）
- 檢查每個 repo 落後 remote 幾個 commit，分類顯示狀態摘要
- 若有 repo 需要更新，詢問使用者一次「要 pull 嗎？[y/N]」
- 確認後才對落後的 repo 執行並行 git pull
- 無追蹤分支的 repo 顯示警告並跳過

## Capabilities

### New Capabilities

- `status-check`: fetch 後檢查各 repo 狀態，分類顯示（落後 / 最新 / 無追蹤分支 / fetch 失敗）

### Modified Capabilities

- `pull-siblings`: 執行時機從「立即 pull」改為「使用者確認後才 pull」；只 pull 落後的 repo

## Impact

- `index.js` 主流程重構：加入 fetch、status 檢查、互動確認（Node.js `readline`）
- 無新增外部依賴
