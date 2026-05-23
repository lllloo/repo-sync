## Why

pull-all 目前只掃 `parentDir` 的第一層，無法追蹤放在子目錄裡的 git repo（如 `obsidian/obsidian-deploy`、`obsidian/obsidian-memory`）。使用者被迫手動維護 `.env`，且 `init` 會在下次執行時洗掉手動加的路徑。

## What Changes

- `PULL_ALL` 支援 `"parent/child"` 路徑格式，main() 無需改動（`path.join` 已能正確解析）
- `init()` 掃描時對**非 git** 的第一層目錄下探一層，發現巢狀 git repo，checkbox 以縮排顯示階層
- `clone()` 移除 `/` 限制，取路徑最後一段作為 GitHub repo 名，clone 前確保 parent dir 存在
- 移除 `.env` 中的 `PULL_ALL_INCLUDE`（從未被讀取，為廢棄變數）

## Capabilities

### New Capabilities

- `nested-repo-discovery`: init 掃描時自動發現一層巢狀 git repo，並以 `parent/child` 格式寫入 PULL_ALL
- `nested-repo-clone`: clone 支援 `parent/child` 格式，正確計算 GitHub repo 名與本機目標路徑

### Modified Capabilities

（無現有 spec 需變更）

## Impact

- `index.js`：`runInit()`、`runClone()` 需修改；`main()` 幾乎不變
- `.env`：`PULL_ALL_INCLUDE` 廢棄；`PULL_ALL` 格式向下相容（純名稱不受影響）
- 無外部依賴變更
