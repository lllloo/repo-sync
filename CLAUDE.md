# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用指令

```bash
node index.js          # 執行同步（主流程）
npm start              # 同上

node index.js init     # 互動式勾選 repo，寫入 .env
npm run init           # 同上

node index.js clone    # clone .env 列了但本機沒有的 repo
node index.js help     # 顯示說明
```

無 build 步驟、無測試套件、無 npm 相依套件。

## 架構概覽

**單一入口**：所有邏輯都在 `index.js`，無額外模組。純 Node.js stdlib + `child_process.exec`（包裝為 `sh()`）。

**兩個根目錄概念，不要混淆**：

| 概念 | 決定方式 | 用途 |
|---|---|---|
| 掃描根目錄 | `resolveRoot()` → `PULL_ALL_ROOT` 或 `path.dirname(process.cwd())` | 找兄弟 repo |
| `.env` 位置 | `__dirname`（pull-all repo 根目錄，固定） | 讀寫設定 |

修改 `.env` 讀寫邏輯時，兩者必須保持解耦。

**主流程（`main()`）**：

1. `resolveRoot()` 取得掃描根目錄
2. 套用 `PULL_ALL_INCLUDE` 白名單篩選目標 repo
3. `Promise.all` 並行對每個 repo 執行 `checkRepo()`：fetch → 偵測 default branch + current branch → 計算 ahead/behind → 偵測 dirty
4. `renderRepo()` 輸出狀態（顯示 default branch 與 current branch 兩條，相同時合併）
5. 篩出 pull 候選（current branch：有 upstream + behind > 0 + clean）
6. dirty + behind 的 repo 自動跳過，不問
7. 詢問確認後並行 `git pull`

**子命令路由**：`dispatch(process.argv[2])` 分派到 `main()` / `runInit()` / `runClone()`。

## 環境變數

| 變數 | 作用 |
|---|---|
| `PULL_ALL_INCLUDE` | 要追蹤的 repo 名稱，逗號分隔；空白則掃全部 |
| `PULL_ALL_ROOT` | 指定掃描根目錄（不取 cwd 父目錄） |
| `PULL_ALL_OWNER` | `clone` 子命令使用的 GitHub owner |

## OpenSpec 變更管理

`openspec/` 目錄追蹤功能提案與歷史。新功能建議透過 `/openspec-propose` 建提案，實作完成後 `/openspec-archive-change` 歸檔。
