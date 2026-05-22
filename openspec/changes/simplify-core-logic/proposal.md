## Why

`index.js` 的邏輯分散在 25 個函式、621 行，其中 env 讀取重複三次、每個 repo 最多序列執行 15 次 git call、`PULL_ALL_INCLUDE` / `PULL_ALL_ROOT` / `PULL_ALL_OWNER` 三個環境變數對使用者認知負擔不必要地高。

## What Changes

- **BREAKING** `PULL_ALL_INCLUDE` → 重命名為 `PULL_ALL`
- **BREAKING** 刪除 `PULL_ALL_ROOT`；root 改為永遠取 `path.dirname(__dirname)`
- **BREAKING** 刪除 `PULL_ALL_OWNER`；`clone` 子命令改用 `gh api user --jq .login` 自動取得 owner
- 四個 env 輔助函式（`loadEnvFile` / `parseIncludeList` / `loadIncludeList` / `loadOwner`）合併為單一 `loadEnv()` + lazy cache
- 五個 git 查詢函式（`getCurrentBranch` / `isDirty` / `hasUpstream` / `getAhead` / `getBehind`）合併為 `parseStatus()`，底層使用 `git status --porcelain=v2 --branch` 單一呼叫
- `checkRepo()` 內部 fetch 後改為並行執行 `git status` + `getDefaultBranch`
- `getBranchStatus()` 內部 ahead + hasUpstream 改為並行

## Capabilities

### New Capabilities

- `env-config`: 單一環境變數 `PULL_ALL` 管理 repo 清單，lazy cache 讀取，取代三個舊變數

### Modified Capabilities

- `pull-siblings`: root 解析邏輯改變（固定為 `__dirname` 父層），env 變數名稱改變
- `clone-command`: owner 改從 gh CLI 自動取得，不再讀 `PULL_ALL_OWNER`
- `status-check`: git call 數量從最多 15 降至 4–5，`checkRepo` 內部並行化

## Impact

- `index.js`：全面重構，函式數 25 → ~14，行數 621 → ~420
- `.env` / `.env.example`：變數名更新
- `CLAUDE.md`：環境變數說明更新
- 無新增外部依賴
