## Context

pull-all 是單一檔案 CLI（`index.js`），三個子命令共用同一個 `PULL_ALL` 環境變數。目前 `main()` 已透過 `path.join(parentDir, name)` 解析 repo 路徑，理論上只要 name 含 `/` 也能正確解析，因此主流程無需改動。問題集中在 `runInit()`（不會發現巢狀 repo）和 `runClone()`（明確拒絕含 `/` 的名稱）。

## Goals / Non-Goals

**Goals:**
- `init` 能自動發現並列出一層巢狀 git repo
- `init` checkbox 以縮排呈現階層，選取後正確寫入 `parent/child` 格式
- `clone` 支援 `parent/child`，正確計算 GitHub repo 名與本機目標路徑
- 向下相容：現有純名稱（無 `/`）行為不變

**Non-Goals:**
- 遞迴掃描超過兩層的巢狀結構
- 支援多層 `a/b/c` 格式
- 修改 `main()` 的掃描邏輯（已能正確運作）

## Decisions

### D1：掃描策略
`runInit()` 只對**第一層 git repo** 繼續往下掃子目錄。非 git 目錄不下探。

> 替代方案：無條件下探所有目錄。否決原因：會把非 git 父目錄下的偶發子 repo（如測試用的臨時目錄）誤列入選單，造成雜訊。

### D2：checkbox 顯示格式
縮排兩格區隔 `parent/child`：
```
  [ ] obsidian
  [ ]   obsidian/obsidian-deploy
  [ ]   obsidian/obsidian-memory
```
名稱本身即為 `parent/child` 字串，與寫入 `PULL_ALL` 的格式一致，無需額外轉換。

> 替代方案：只顯示 `child` 部分。否決原因：使用者需要知道完整路徑才能理解選的是哪個 repo。

### D3：clone 的 GitHub repo 名
`parent/child` 中取最後一段（`child`）作為 GitHub repo 名。clone 目標目錄為 `path.join(rootDir, parent)`，若不存在則自動建立。

> 替代方案：整段視為 GitHub org/repo。否決原因：用戶的 GitHub org 就是自己，子目錄只是本機組織方式。

### D4：`PULL_ALL_INCLUDE` 廢棄
直接從 `.env` 移除該行（或由使用者手動移除）。不在程式碼中保留讀取邏輯。

## Risks / Trade-offs

- **第一層本身是 git repo 又有巢狀子 repo** → 不下探，符合 D1。若使用者真的需要，手動加入 `PULL_ALL` 即可。
- **parent dir 不存在時 clone** → mkdir 後再 clone，若 mkdir 失敗要顯示錯誤。
- **`init` preselected 邏輯**：現有 `PULL_ALL` 含 `parent/child` 字串，需與新掃描出的名稱清單直接比對（字串相同即可），不需特殊處理。

## Migration Plan

1. 修改 `runInit()` 掃描邏輯
2. 修改 `runClone()` 移除 `/` 限制，加入 mkdir 邏輯
3. 使用者執行 `pull-all init` 重新勾選，`PULL_ALL` 自動更新為含 `parent/child` 格式
4. 建議手動刪除 `.env` 中的 `PULL_ALL_INCLUDE` 行
