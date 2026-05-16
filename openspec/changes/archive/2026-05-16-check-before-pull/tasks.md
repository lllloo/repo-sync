## 1. Fetch 與狀態檢查

- [x] 1.1 實作 `fetchRepo(dir)`：對單一 repo 執行 `git fetch`，回傳成功/失敗
- [x] 1.2 實作 `getStatus(dir)`：執行 `git rev-list HEAD..@{u} --count`，回傳落後 commit 數（無追蹤分支時回傳特殊值）
- [x] 1.3 並行對所有目標 repo 執行 fetch + status 檢查
- [x] 1.4 顯示狀態摘要（落後 N commits / up to date / ⚠ 無追蹤分支 / ✗ fetch 失敗）

## 2. 互動確認

- [x] 2.1 若有落後的 repo，使用 `readline` 詢問「N 個 repo 需要更新，要 pull 嗎？[y/N]」
- [x] 2.2 實作 y/N 判斷：y/Y 繼續 pull，其他任何輸入顯示「已取消」並結束
- [x] 2.3 若全部都是最新，顯示「所有 repo 已是最新」直接結束（不問）

## 3. Pull 階段調整

- [x] 3.1 只對落後的 repo 執行並行 `git pull`（移除對「已最新」repo 的 pull）

## 4. 測試驗證

- [x] 4.1 執行 `node index.js`，確認先顯示摘要再詢問
- [x] 4.2 輸入 y，確認只有落後的 repo 被 pull
- [x] 4.3 輸入 N，確認不執行任何 pull
- [x] 4.4 確認無追蹤分支的 repo 顯示警告並跳過
