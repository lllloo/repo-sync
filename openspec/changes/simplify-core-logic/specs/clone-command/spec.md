## MODIFIED Requirements

### Requirement: 解析 PULL_ALL 並驗證名字格式
系統 SHALL 讀取 `PULL_ALL` 取得 repo 名字清單，名字含 `/` MUST 視為錯誤格式並以非 0 exit code 結束。`PULL_ALL_INCLUDE` SHALL NOT 再被讀取。

#### Scenario: 名字清單合法
- **WHEN** `PULL_ALL=web,common,note`
- **THEN** 系統取得 `["web", "common", "note"]` 作為候選清單

#### Scenario: 名字含 /
- **WHEN** `PULL_ALL` 任一項含 `/`（如 `barney/web`）
- **THEN** 印出錯誤訊息「目前僅支援單一 owner，名字不可含 /」並以非 0 exit code 結束

#### Scenario: 清單為空
- **WHEN** `PULL_ALL` 未設定或解析後為空
- **THEN** 印出提示訊息「.env 未設定 PULL_ALL，無 repo 可 clone」並以 exit code 0 結束

## ADDED Requirements

### Requirement: 從 gh CLI 自動取得 owner
系統 SHALL 執行 `gh api user --jq .login` 取得當前已登入的 GitHub 帳號作為 owner，不再讀取 `PULL_ALL_OWNER` 環境變數或 `.env`。

#### Scenario: gh 已登入
- **WHEN** `gh api user --jq .login` 成功回傳帳號名稱
- **THEN** 系統使用該帳號名稱作為 clone 的 owner

#### Scenario: gh 未登入或 API 失敗
- **WHEN** `gh api user --jq .login` 回傳非 0 exit code
- **THEN** 印出錯誤訊息提示執行 `gh auth login`，以非 0 exit code 結束

## REMOVED Requirements

### Requirement: 解析 PULL_ALL_OWNER 設定
**Reason**: owner 改由 `gh api user --jq .login` 自動取得，消除手動設定需求。
**Migration**: 移除 `.env` 中的 `PULL_ALL_OWNER` 設定；確保 `gh auth login` 已完成。

### Requirement: 沿用掃描根目錄解析（PULL_ALL_ROOT）
**Reason**: `PULL_ALL_ROOT` 已隨掃描根目錄固定化一併移除。
**Migration**: clone 工作目錄固定為 `path.dirname(__dirname)`，即 pull-all repo 的父目錄。
