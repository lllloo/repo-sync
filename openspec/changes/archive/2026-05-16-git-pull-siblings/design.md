## Context

專案位於 `/Users/barney/code/pull-all`，目前只有 `openspec/` 目錄，尚無任何程式碼。目標是建立一個可執行的 CLI 工具，對父目錄下所有兄弟層 git repo 執行 `git pull`。

## Goals / Non-Goals

**Goals:**
- 掃描父目錄（`../`）下所有包含 `.git` 的子資料夾
- 對每個 git repo 執行 `git pull`，支援並行執行
- 清楚回報每個 repo 的結果（成功 / 失敗 / 非 git repo 跳過）
- 可作為 CLI 工具直接執行（`node index.js` 或 `npx pull-all`）

**Non-Goals:**
- 不支援遞迴掃描（只掃一層）
- 不支援指定 remote 或 branch
- 不提供 GUI 或 TUI 介面
- 不處理 SSH key 或認證問題

## Decisions

**語言：Node.js**
- 理由：環境已有 Node（Volta），無需額外安裝工具；`child_process` 可輕鬆執行 shell 指令
- 替代方案：Shell script — 較難處理並行與格式化輸出

**並行策略：`Promise.allSettled`**
- 對所有 repo 同時發出 `git pull`，等全部完成後彙整輸出
- 理由：避免序列等待，尤其在 repo 數量多時效果顯著
- 替代方案：序列執行 — 簡單但慢

**輸出格式：terminal 彩色文字**
- 成功：綠色 ✓ repo 名稱
- 失敗：紅色 ✗ repo 名稱 + 錯誤訊息
- 跳過（非 git）：灰色 — repo 名稱

**入口：`index.js`（直接執行，無需編譯）**
- 使用 Node.js 原生 `fs`、`child_process`，無額外依賴

## Risks / Trade-offs

- [網路慢] 多個 repo 同時 pull 可能佔用頻寬 → 目前不做 concurrency limit，後續可加
- [認證彈出] SSH passphrase 或 HTTPS 帳密需要互動輸入 → 工具不處理，使用者需自行設定 SSH agent
- [detached HEAD / dirty working tree] git pull 可能因為 dirty state 失敗 → 顯示 stderr 讓使用者自行處理

## Migration Plan

1. 建立 `index.js`
2. 更新 `package.json`（加入 `bin` 欄位與基本 metadata）
3. 建立 `README.md`
4. 本地測試：在 `/Users/barney/code/pull-all` 執行 `node index.js`

無需 rollback 策略（新工具，不影響現有系統）。

## Open Questions

（無）
