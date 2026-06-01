# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用指令

```bash
node index.js          # 執行同步（主流程）
npm start              # 同上

node index.js init     # 互動式勾選 repo，寫入 .env
npm run init           # 同上

node index.js clone    # clone .env 列了但本機沒有的 repo（需要 gh CLI + gh auth login）
node index.js help     # 顯示說明

npm link               # 安裝全域 sync-git 指令
```

無 build 步驟、無測試套件、無 npm 相依套件。`clone` 子命令額外需要 [gh CLI](https://cli.github.com/)。

## 架構概覽

**單一入口**：所有邏輯都在 `index.js`，無額外模組。純 Node.js stdlib + `child_process.exec`（包裝為 `sh()`）。

**根目錄固定**：`resolveRoot()` 永遠回傳 `path.dirname(__dirname)`（sync-git repo 的父目錄），不受 cwd 影響。`.env` 位置同樣固定於 `__dirname`。

**主流程（`main()`）**：

1. `resolveRoot()` 取得掃描根目錄
2. 套用 `SYNC_REPOS` 白名單篩選目標 repo
3. `Promise.all` 並行對每個 repo 執行 `checkRepo()`：fetch → 並行取 `git status --porcelain=v2 --branch` + default branch → 計算 ahead/behind → 偵測 dirty
4. `renderRepo()` 輸出狀態（顯示 default branch 與 current branch 兩條，相同時合併）
5. 篩出 pull 候選（current branch：有 upstream + behind > 0 + clean）
6. dirty + behind 的 repo 自動跳過，不問
7. 詢問確認後並行 `git pull`

**子命令路由**：`dispatch(process.argv[2])` 分派到 `main()` / `runInit()` / `runClone()`。

## 環境變數

| 變數 | 作用 |
|---|---|
| `SYNC_REPOS` | 要追蹤的 repo 名稱，逗號分隔；支援 `parent/child` 格式（巢狀 repo）；未設定則停下並引導執行 `sync-git init` |

## OpenSpec 變更管理

`openspec/` 目錄追蹤功能提案與歷史。新功能建議透過 `/openspec-propose` 建提案，實作完成後 `/openspec-archive-change` 歸檔。
