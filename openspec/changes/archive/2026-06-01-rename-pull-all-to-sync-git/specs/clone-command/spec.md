## MODIFIED Requirements

### Requirement: 從 gh CLI 自動取得 owner
系統 SHALL 執行 `gh api user --jq .login` 取得當前已登入的 GitHub 帳號作為 owner，不再讀取 `PULL_ALL_OWNER` 環境變數或 `.env`。此單一指令同時作為 gh CLI 的前置守門：指令失敗（gh 未安裝或未登入）時 MUST 印出指引並以非 0 exit code 結束，不嘗試任何 clone。

#### Scenario: gh 已登入
- **WHEN** `gh api user --jq .login` 成功回傳帳號名稱
- **THEN** 系統使用該帳號名稱作為 clone 的 owner，繼續後續流程

#### Scenario: gh 未安裝或未登入
- **WHEN** `gh api user --jq .login` 回傳非 0 exit code（指令不存在或未登入）
- **THEN** 印出錯誤訊息提示確認 gh 已安裝並執行 `gh auth login`，以非 0 exit code 結束，不嘗試任何 clone

### Requirement: 掃描根目錄固定化
系統 SHALL 以 `path.dirname(__dirname)` 作為固定掃描根目錄，用於比對本機 repo 與作為 `gh repo clone` 工作目錄。`PULL_ALL_ROOT` 環境變數 SHALL NOT 再被讀取。

#### Scenario: clone 工作目錄固定
- **WHEN** 使用者在任意目錄執行 `sync-git clone`
- **THEN** 系統將 clone 工作目錄固定設為 `path.dirname(__dirname)`，即 sync-git repo 的父目錄
