## 1. Env 收斂

- [x] 1.1 刪除 `loadEnvFile` / `parseIncludeList` / `loadIncludeList` / `loadOwner` 四個函式
- [x] 1.2 新增 `loadEnv()` lazy singleton（讀 `.env` 一次，快取結果）
- [x] 1.3 新增 `env(key)` helper：`process.env[key] || loadEnv()[key] || null`
- [x] 1.4 全域搜尋 `PULL_ALL_INCLUDE` → 替換為 `PULL_ALL`
- [x] 1.5 更新 `.env.example`：移除三個舊變數，加入 `PULL_ALL=`

## 2. Root 固定化

- [x] 2.1 `resolveRoot()` 改為 `() => path.dirname(__dirname)`
- [x] 2.2 移除 `PULL_ALL_ROOT` 的所有讀取與參考
- [x] 2.3 更新 `CLAUDE.md` 環境變數說明表格

## 3. git call 壓縮

- [x] 3.1 新增 `parseStatus(stdout)` 函式，解析 `git status --porcelain=v2 --branch` 輸出，回傳 `{ name, detached, sha, hasUpstream, ahead, behind, dirty }`
- [x] 3.2 刪除 `getCurrentBranch` / `isDirty` / `hasUpstream` / `getAhead` / `getBehind` 五個函式
- [x] 3.3 `getBranchStatus(dir, branch)` 內部改為 `Promise.all([ahead, hasUpstream])`，再依 hasUpstream 決定是否查 behind
- [x] 3.4 `checkRepo()` 改寫：fetch 完後 `Promise.all([sh('git status --porcelain=v2 --branch'), getDefaultBranch()])`
- [x] 3.5 `checkRepo()` 回傳值中 `currentStatus` 改從 `parseStatus` 結果組裝

## 4. clone 改用 gh 帳號

- [x] 4.1 `runClone()` 移除 `loadOwner()` 呼叫
- [x] 4.2 `runClone()` 加入 `gh api user --jq .login` 取得 owner，失敗時印錯誤並 exit 1
- [x] 4.3 移除 `checkGhAuth` 與 `checkGhAvailable` 的重複邏輯（若 gh api 呼叫已涵蓋）

## 5. 驗證與清理

- [x] 5.1 執行 `node index.js` 確認主流程正常，狀態顯示正確
- [ ] 5.2 執行 `node index.js init` 確認寫入 `PULL_ALL`（非舊名稱）
- [ ] 5.3 執行 `node index.js clone` 確認 owner 自動取得
- [x] 5.4 執行 `node index.js help` 確認說明文字無舊變數殘留
- [x] 5.5 確認 `index.js` 無殘留的 `PULL_ALL_INCLUDE` / `PULL_ALL_ROOT` / `PULL_ALL_OWNER` 字串
