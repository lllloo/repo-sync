## 1. main() 移除掃全部 fallback

- [x] 1.1 移除 `index.js` `main()` 中 `include.length === 0` 的 else 掃全部分支（含先前加的「改掃描全部」黃字提示）
- [x] 1.2 改為：未設定 `PULL_ALL` 時顯示引導訊息（建議執行 `pull-all init`）並 return，不掃描任何 repo
- [x] 1.3 確認白名單模式（有值）行為不變

## 2. runInit() 全不勾視為取消

- [x] 2.1 `runInit()` 在 `chosen.length === 0` 時不呼叫 `updateEnvFile`，改顯示「未選任何 repo，已取消」並 return
- [x] 2.2 移除「（全部）」顯示語意（`index.js:473` 附近）
- [x] 2.3 確認選了 ≥1 repo 時寫入行為不變

## 3. runClone() 訊息統一

- [x] 3.1 將 `runClone()` 未設定 `PULL_ALL` 的訊息措辭統一為引導執行 `pull-all init`

## 4. 文件同步

- [x] 4.1 更新 `CLAUDE.md` 環境變數表：「空白則掃全部」→「未設定則引導 init」
- [x] 4.2 同步 `README.md` 中任何提及掃全部 fallback 的描述
- [x] 4.3 更新 `openspec/specs/pull-siblings/spec.md` Purpose 一行，移除「無設定時 fallback 為掃描全部 repo」（archive 時併入主 spec）

## 5. 驗證

- [x] 5.1 無 `PULL_ALL` 跑 `node index.js`：確認停下並引導 init、未 fetch 任何 repo
- [x] 5.2 有 `PULL_ALL` 跑：確認只掃白名單
- [x] 5.3 `node index.js init` 全不勾按 Enter：確認 `.env` 未被修改且顯示已取消（邏輯確認：全不勾走 return 不呼叫 updateEnvFile；建議真終端手動最終確認）
