## 1. Subcommand routing

- [x] 1.1 將 `index.js` 底部的 `main()` 呼叫改為 router（`argv[2] === 'init'` → `runInit()`，否則 `main()`）

## 2. checkbox UI

- [x] 2.1 實作 `checkbox(items, preselected)` 函式：raw mode、↑↓ 移動、空白 toggle、Enter 送出、Ctrl+C 退出
- [x] 2.2 加入非 TTY guard（`process.stdin.isTTY` 檢查，顯示錯誤後退出）

## 3. runInit 流程

- [x] 3.1 掃描上層目錄，列出所有含 `.git` 的子目錄
- [x] 3.2 讀取現有 `.env` 的 `PULL_ALL_INCLUDE`，產生預選清單
- [x] 3.3 呼叫 `checkbox()` 顯示互動 UI，取得使用者勾選結果

## 4. .env 寫入

- [x] 4.1 實作 `.env` 更新函式：讀取現有 key-value → 替換 `PULL_ALL_INCLUDE` → 寫回（不存在則建立）
- [x] 4.2 顯示完成訊息（寫入路徑 + 清單內容）
