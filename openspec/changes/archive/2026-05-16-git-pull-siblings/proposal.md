## Why

管理多個 git 專案時，需要逐一進入每個資料夾執行 `git pull`，耗時且容易遺漏。此工具可自動對兄弟層所有 git 資料夾執行 pull，一次同步所有專案。

## What Changes

- 新增 CLI 工具（`pull-all`），對當前目錄的兄弟層所有 git repo 執行 `git pull`
- 偵測哪些子目錄含有 `.git`，僅對其執行 pull
- 支援 `pull-all.config.json` 設定檔，以白名單指定要同步的 repo
- 無設定檔時 fallback 為 pull 所有偵測到的 git repo
- 顯示每個 repo 的執行結果（成功 / 失敗 / 跳過 / 找不到）
- 支援並行執行以縮短等待時間

## Capabilities

### New Capabilities

- `pull-siblings`: 掃描兄弟層資料夾，對所有 git repo 執行 `git pull` 並回報結果

### Modified Capabilities

（無）

## Impact

- 新增入口腳本（Node.js 或 Shell）
- 無外部 API 依賴
- 僅需 `git` 指令存在於 PATH
