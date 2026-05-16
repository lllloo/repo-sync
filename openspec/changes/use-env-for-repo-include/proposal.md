## Why

同步 repo 清單屬於本機偏好，直接寫在 `pull-all.config.json` 會讓個人資料夾名稱進入 git。改用 `.env` 可以保留白名單設定能力，同時避免本機同步清單被提交。

## What Changes

- 改以專案目錄內的 `.env` 讀取要同步的 repo 白名單。
- 使用 `PULL_ALL_INCLUDE` 環境變數，以逗號分隔 repo 名稱。
- 將 `.env` 加入 git ignore，避免本機設定被提交。
- 新增可提交的 `.env.example` 作為設定範例。
- 保留無設定時掃描父層所有 git repo 的 fallback 行為。
- **BREAKING**: `pull-all.config.json` 不再作為主要同步清單設定來源。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pull-siblings`: 將同步清單設定來源從 `pull-all.config.json` 改為 `.env` 的 `PULL_ALL_INCLUDE`。

## Impact

- `index.js`: 設定讀取邏輯改為 `.env` / environment variable。
- `README.md`: 更新設定方式與範例。
- `.gitignore`: 忽略 `.env`。
- `.env.example`: 新增可提交的範例檔。
- `pull-all.config.json`: 後續實作時應移除或停止依賴。
