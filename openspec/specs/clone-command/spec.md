# clone-command Spec

## Purpose
提供 `sync-git clone` 子命令，把 `.env` 的 `SYNC_REPOS` 列了但本機不存在的 repo，透過 `gh` CLI 自動 clone 下來，補完整個工作區同步閉環。URL 解析與認證交由 `gh` 處理，本機只維護單一 GitHub `owner` 設定。
## Requirements
### Requirement: clone subcommand 路由
執行 `sync-git clone` 時，系統 SHALL 進入 clone 流程而非主要 pull 流程或 init 流程。

#### Scenario: 正確路由
- **WHEN** 使用者執行 `sync-git clone`
- **THEN** 系統執行 `runClone()`，不執行 `main()` 或 `runInit()`

#### Scenario: 主 sync-git 行為不受影響
- **WHEN** 使用者執行 `sync-git`（未帶子命令）
- **THEN** 系統依既有 `main()` 流程執行，與 `clone` 子命令存在與否無關

### Requirement: 從 gh CLI 自動取得 owner
系統 SHALL 執行 `gh api user --jq .login` 取得當前已登入的 GitHub 帳號作為 owner，不再讀取 `SYNC_REPOS_OWNER` 環境變數或 `.env`。此單一指令同時作為 gh CLI 的前置守門：指令失敗（gh 未安裝或未登入）時 MUST 印出指引並以非 0 exit code 結束，不嘗試任何 clone。

#### Scenario: gh 已登入
- **WHEN** `gh api user --jq .login` 成功回傳帳號名稱
- **THEN** 系統使用該帳號名稱作為 clone 的 owner，繼續後續流程

#### Scenario: gh 未安裝或未登入
- **WHEN** `gh api user --jq .login` 回傳非 0 exit code（指令不存在或未登入）
- **THEN** 印出錯誤訊息提示確認 gh 已安裝並執行 `gh auth login`，以非 0 exit code 結束，不嘗試任何 clone

### Requirement: 解析 SYNC_REPOS 取得 repo 清單
系統 SHALL 讀取 `SYNC_REPOS` 取得逗號分隔的 repo 名字清單。名字含 `/` SHALL 視為合法的 `parent/child` 巢狀格式（行為見 `nested-repo-clone`），不視為錯誤。

#### Scenario: 名字清單合法
- **WHEN** `SYNC_REPOS=web,common,note`
- **THEN** 系統取得 `["web", "common", "note"]` 作為候選清單

#### Scenario: 名字含 /（巢狀格式）
- **WHEN** `SYNC_REPOS` 任一項含 `/`（如 `obsidian/obsidian-deploy`）
- **THEN** 系統接受該項，交由 `nested-repo-clone` 的 parent/child 邏輯處理，不報錯

#### Scenario: 清單為空
- **WHEN** `SYNC_REPOS` 未設定或解析後為空
- **THEN** 印出引導訊息建議執行 `sync-git init`，並以 exit code 0 結束

### Requirement: 計算缺漏 repo 清單
系統 SHALL 將 `SYNC_REPOS` 名字清單與掃描根目錄下實際存在的子資料夾比對，僅對「本機不存在」或「存在但非 git repo」的項目進入後續處理。

#### Scenario: 本機完全不存在
- **WHEN** 名字 `web` 對應的 `<root>/web` 目錄不存在
- **THEN** `web` 列入待 clone 清單

#### Scenario: 本機已存在且為 git repo
- **WHEN** `<root>/web` 存在且含 `.git` 目錄
- **THEN** `web` 跳過，不列入待 clone 清單（顯示為「已存在」或完全不顯示）

#### Scenario: 本機存在但非 git repo
- **WHEN** `<root>/web` 存在但不含 `.git` 目錄
- **THEN** `web` 不列入待 clone 清單，印出警告「<name> 已存在但不是 git repo，跳過」，繼續處理其餘項目

#### Scenario: 無需 clone
- **WHEN** 比對後待 clone 清單為空
- **THEN** 印出訊息「所有 repo 都已存在」並以 exit code 0 結束

### Requirement: 並行執行 gh repo clone
系統 SHALL 對待 clone 清單中的每個名字並行執行 `gh repo clone <OWNER>/<name>`，工作目錄為掃描根目錄。

#### Scenario: 全部成功
- **WHEN** 所有 clone 指令均回傳 exit code 0
- **THEN** 每個 repo 顯示綠色成功標記，系統以 exit code 0 結束

#### Scenario: 部分失敗
- **WHEN** 某個 clone 回傳非 0 exit code（如 repo 不存在、權限不足）
- **THEN** 該 repo 顯示紅色失敗標記與 `gh` stderr 內容，其餘 repo 不受影響繼續完成

#### Scenario: 失敗時 exit code
- **WHEN** 至少一個 clone 失敗
- **THEN** 系統以非 0 exit code 結束

### Requirement: 顯示執行結果
系統 SHALL 在執行 clone 後印出每個項目的結果摘要，格式與既有 pull 子命令對齊。

#### Scenario: 成功標記
- **WHEN** clone 成功
- **THEN** 顯示綠色 `✓ <name>`

#### Scenario: 失敗標記
- **WHEN** clone 失敗
- **THEN** 顯示紅色 `✗ <name>` 與 `gh` 的 stderr 訊息

#### Scenario: 跳過標記
- **WHEN** 名字因「已存在但非 git repo」被跳過
- **THEN** 顯示黃色警告 `⚠ <name> 已存在但不是 git repo，跳過`

### Requirement: 掃描根目錄固定化
系統 SHALL 以 `path.dirname(__dirname)` 作為固定掃描根目錄，用於比對本機 repo 與作為 `gh repo clone` 工作目錄。`SYNC_REPOS_ROOT` 環境變數 SHALL NOT 再被讀取。

#### Scenario: clone 工作目錄固定
- **WHEN** 使用者在任意目錄執行 `sync-git clone`
- **THEN** 系統將 clone 工作目錄固定設為 `path.dirname(__dirname)`，即 sync-git repo 的父目錄
