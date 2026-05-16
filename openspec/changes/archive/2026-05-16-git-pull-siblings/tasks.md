## 1. 專案初始化

- [x] 1.1 建立 `package.json`（含 `name`、`version`、`bin` 欄位）
- [x] 1.2 確認 Node.js 可用，無需安裝額外套件

## 2. 核心實作

- [x] 2.1 實作 `index.js`：讀取父目錄下所有子資料夾
- [x] 2.2 實作 git repo 偵測（檢查 `.git` 是否存在）
- [x] 2.3 實作並行 `git pull`（`Promise.allSettled` + `child_process.exec`）
- [x] 2.4 實作彩色輸出（成功 / 失敗 / 跳過 / 警告）

## 3. 設定檔支援

- [x] 3.1 實作讀取 `pull-all.config.json`（`include` 白名單）
- [x] 3.2 實作 fallback 邏輯：無設定檔時 pull 所有 git repo
- [x] 3.3 實作找不到 repo 的黃色警告輸出
- [x] 3.4 建立 `pull-all.config.json` 範例檔（可直接修改使用）

## 4. 文件

- [x] 4.1 建立 `README.md`（專案說明、安裝方式、執行指令、設定檔格式說明）

## 5. 測試驗證

- [x] 5.1 在 `/Users/barney/code/pull-all` 執行 `node index.js`，確認能對兄弟層 repo 執行 pull
- [x] 5.2 設定 `pull-all.config.json` 指定部分 repo，確認只 pull 指定的
- [x] 5.3 在設定檔加入不存在的 repo 名稱，確認顯示警告且其他 repo 正常執行
