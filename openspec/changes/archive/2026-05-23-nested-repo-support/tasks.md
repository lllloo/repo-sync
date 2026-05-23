## 1. runInit() 掃描邏輯

- [x] 1.1 修改 `runInit()` 的目錄掃描：第一層非 git 目錄往下掃一層，發現 git repo 以 `parent/child` 格式加入清單
- [x] 1.2 修改 `checkbox()` 顯示邏輯：`parent/child` 格式的項目前綴兩個空格（縮排）

## 2. runClone() 巢狀支援

- [x] 2.1 移除 `runClone()` 中對含 `/` 名稱的錯誤攔截
- [x] 2.2 加入 `parent/child` 解析：取最後一段作為 GitHub repo 名，前段作為本機 parent dir
- [x] 2.3 clone 前確保 parent dir 存在（`fs.mkdirSync` + 錯誤處理）

## 3. 清理

- [x] 3.1 從 `.env` 移除 `PULL_ALL_INCLUDE` 行（廢棄變數）
- [x] 3.2 更新 `CLAUDE.md` 的環境變數說明表，移除 `PULL_ALL_INCLUDE` 條目
