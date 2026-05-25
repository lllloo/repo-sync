## 1. A — cli-output：砍 version 承諾

- [x] 1.1 `index.js` `printHelp()` 移除 `-v, --version     顯示版本號` 那一行
- [x] 1.2 確認 `dispatch()` 行為不變（`-v`/`--version` 維持落到「未知指令」，不另加分支）

## 2. C — env-config：未設定改引導 init

- [x] 2.1 確認 `index.js` `main()` 未設定分支已是「引導 init + return」（無需改 code，僅核對）
- [x] 2.2 spec delta 已將「PULL_ALL 未設定（fallback 掃全部）」scenario 改為「引導 init、不掃描」

## 3. D — clone-command：對齊實作

- [x] 3.1 spec delta 移除「gh CLI 前置條件檢查」需求，併入「從 gh CLI 自動取得 owner」
- [x] 3.2 spec delta 移除「名字含 / 報錯」需求，新增「解析 PULL_ALL 取得清單（接受含 / 的 nested 格式）」
- [x] 3.3 spec delta 將「計算缺漏 repo 清單」需求中的 `PULL_ALL_INCLUDE` 改為 `PULL_ALL`
- [x] 3.4 確認 `index.js` `runClone()` 行為與新 spec 一致（無需改 code，僅核對）

## 4. 驗證

- [x] 4.1 `pull-all help`：確認輸出不再出現 `-v / --version`（已跑，通過）
- [x] 4.2 `pull-all -v`：確認落到「未知指令」exit 1（已跑，通過）
- [x] 4.3 未設定 `PULL_ALL` 跑 `pull-all`：邏輯確認 `main()` 355-360 為引導 init + return，未 fetch 任何 repo（未實跑以免動到本機 repo）
- [x] 4.4 `PULL_ALL` 含 `parent/child` 跑 `pull-all clone`：邏輯確認 `runClone()` 519-531 以 `split('/')` 取末段為 repo 名、前段建子目錄，與 `nested-repo-clone` 一致（未實跑以免實際 clone）

## 5. Archive 時併入主 spec 的零散修正（delta 處理不到的非需求文字）

- [x] 5.1 `clone-command/spec.md` Purpose（第 4 行）的 `PULL_ALL_INCLUDE` 改為 `PULL_ALL`
- [x] 5.2 評估後保留 `PULL_ALL_ROOT` / `PULL_ALL_OWNER` 的「SHALL NOT 再被讀取」——屬有效負面約束（明確宣告不讀某變數），非錯誤，不清理
