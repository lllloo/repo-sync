## 1. 子命令路由

- [x] 1.1 在 `index.js` 底部 `cmd` 判斷新增 `clone` 分支，呼叫 `runClone()`
- [x] 1.2 確認 `pull-all`（無子命令）、`pull-all init`、`pull-all clone` 三條路徑互不影響

## 2. gh 前置條件檢查

- [x] 2.1 新增 `checkGhAvailable()`：執行 `gh --version`，失敗時印錯誤訊息（含 `https://cli.github.com/` 連結）並回傳 false
- [x] 2.2 新增 `checkGhAuth()`：執行 `gh auth status`，失敗時印錯誤訊息（提示 `gh auth login`）並回傳 false
- [x] 2.3 `runClone()` 啟動時呼叫上述兩個檢查，任一失敗以非 0 exit code 結束

## 3. 設定解析與驗證

- [x] 3.1 新增 `loadOwner()`：從 `process.env.PULL_ALL_OWNER` 與 `.env` 讀取 owner，沿用 `PULL_ALL_INCLUDE` 的優先序
- [x] 3.2 `loadOwner()` 對空字串 / 未設定回傳 null，由 caller 印錯誤訊息並退出
- [x] 3.3 在 `runClone()` 中驗證 `PULL_ALL_INCLUDE` 任一項不含 `/`，違規時印錯誤訊息並以非 0 exit code 結束
- [x] 3.4 `PULL_ALL_INCLUDE` 為空時印提示訊息，以 exit code 0 結束

## 4. 缺漏比對

- [x] 4.1 在 `runClone()` 對每個 include 名字計算 `<root>/<name>` 路徑
- [x] 4.2 已存在且是 git repo：跳過、不列入 clone 清單
- [x] 4.3 已存在但非 git repo：列為「跳過 + 警告」項目，不列入 clone 清單
- [x] 4.4 不存在：列入 clone 清單
- [x] 4.5 clone 清單為空時印提示並以 exit code 0 結束

## 5. 並行 clone

- [x] 5.1 新增 `cloneRepo(owner, name, rootDir)`：執行 `gh repo clone <owner>/<name>`，cwd 為 `rootDir`，回傳 `{ name, ok, stderr }`
- [x] 5.2 用 `Promise.all` 並行所有待 clone 項目
- [x] 5.3 收集結果後依序印出：成功 `✓ <name>`、失敗 `✗ <name>` + stderr
- [x] 5.4 至少一個失敗時 `runClone()` 以非 0 exit code 結束

## 6. README 與文件

- [x] 6.1 README 新增 `pull-all clone` 章節：用法、`PULL_ALL_OWNER` 設定、`gh` 前置條件
- [x] 6.2 README 在「特色」與「常用指令」區塊補上 clone 子命令
- [x] 6.3 README 「設定」表格補上 `PULL_ALL_OWNER` 行

## 7. 驗證

- [x] 7.1 手動驗證：`.env` 設定 `PULL_ALL_OWNER` + `PULL_ALL_INCLUDE` 含本機已有與未有的 repo，跑 `pull-all clone` 確認只 clone 缺漏項目
- [x] 7.2 手動驗證：未裝 gh / 未登入 gh / 缺 `PULL_ALL_OWNER` / 名字含 `/` 四種錯誤情境，均明確報錯並以非 0 exit code 結束
- [x] 7.3 手動驗證：目標目錄已存在但非 git repo 時跳過警告且不覆蓋既有檔案
- [x] 7.4 `openspec validate add-clone-command --strict` 通過
