## Why

使用者需要手動建立 `.env` 並填寫 `PULL_ALL_INCLUDE`，沒有引導流程容易出錯或遺忘。`init` 指令提供互動式勾選 UI，讓初始設定一步完成。

## What Changes

- 新增 `pull-all init` subcommand
- 掃描上層目錄所有 git repo，以互動式 checkbox 讓使用者勾選
- 根據勾選結果寫入（或更新）`.env` 的 `PULL_ALL_INCLUDE`
- `.env` 已存在時，讀取現有清單並預先勾選對應 repo
- `.env` 有其他 key 時，僅更新 `PULL_ALL_INCLUDE`，保留其餘內容

## Capabilities

### New Capabilities

- `init-command`: 互動式初始化 `.env` 的 subcommand，含 terminal checkbox UI 與 `.env` 讀寫邏輯

### Modified Capabilities

（無）

## Impact

- `index.js`：新增 subcommand routing（`process.argv[2] === 'init'`）及 `runInit()`、`checkbox()` 函式
- `.env`：由 `init` 指令生成或更新，不影響現有讀取邏輯
- 無新增 dependency
