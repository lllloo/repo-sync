## REMOVED Requirements

### Requirement: gh CLI 前置條件檢查

**移除理由**：此需求描述 `gh --version` + `gh auth status` 兩段檢查，但實作從未呼叫這兩個指令。實際以單一 `gh api user --jq .login` 同時涵蓋「gh 可用」與「已登入」的守門，併入下方「從 gh CLI 自動取得 owner」需求（見 design.md Decision D1），避免同一指令被兩個需求重複描述。

### Requirement: 解析 PULL_ALL 並驗證名字格式

**移除理由**：此需求要求「名字含 `/` 視為錯誤並 exit」，與 `nested-repo-clone` 的「支援 `parent/child` 路徑格式」直接相反，兩份 current spec 互相矛盾。實作採 `nested-repo-clone` 行為（含 `/` 視為巢狀路徑）。本需求由下方新增的「解析 PULL_ALL 取得 repo 清單」取代，不再對含 `/` 報錯。

## MODIFIED Requirements

### Requirement: 從 gh CLI 自動取得 owner
系統 SHALL 執行 `gh api user --jq .login` 取得當前已登入的 GitHub 帳號作為 owner，不再讀取 `PULL_ALL_OWNER` 環境變數或 `.env`。此單一指令同時作為 gh CLI 的前置守門：指令失敗（gh 未安裝或未登入）時 MUST 印出指引並以非 0 exit code 結束，不嘗試任何 clone。

#### Scenario: gh 已登入
- **WHEN** `gh api user --jq .login` 成功回傳帳號名稱
- **THEN** 系統使用該帳號名稱作為 clone 的 owner，繼續後續流程

#### Scenario: gh 未安裝或未登入
- **WHEN** `gh api user --jq .login` 回傳非 0 exit code（指令不存在或未登入）
- **THEN** 印出錯誤訊息提示確認 gh 已安裝並執行 `gh auth login`，以非 0 exit code 結束，不嘗試任何 clone

### Requirement: 計算缺漏 repo 清單
系統 SHALL 將 `PULL_ALL` 名字清單與掃描根目錄下實際存在的子資料夾比對，僅對「本機不存在」或「存在但非 git repo」的項目進入後續處理。

#### Scenario: 本機完全不存在
- **WHEN** 名字 `web` 對應的 `<root>/web` 目錄不存在
- **THEN** `web` 列入待 clone 清單

#### Scenario: 本機已存在且為 git repo
- **WHEN** `<root>/web` 存在且含 `.git` 目錄
- **THEN** `web` 跳過，不列入待 clone 清單

#### Scenario: 本機存在但非 git repo
- **WHEN** `<root>/web` 存在但不含 `.git` 目錄
- **THEN** `web` 不列入待 clone 清單，印出警告「<name> 已存在但不是 git repo，跳過」，繼續處理其餘項目

#### Scenario: 無需 clone
- **WHEN** 比對後待 clone 清單為空
- **THEN** 印出訊息「所有 repo 都已存在」並以 exit code 0 結束

## ADDED Requirements

### Requirement: 解析 PULL_ALL 取得 repo 清單
系統 SHALL 讀取 `PULL_ALL` 取得逗號分隔的 repo 名字清單。名字含 `/` SHALL 視為合法的 `parent/child` 巢狀格式（行為見 `nested-repo-clone`），不視為錯誤。

#### Scenario: 名字清單合法
- **WHEN** `PULL_ALL=web,common,note`
- **THEN** 系統取得 `["web", "common", "note"]` 作為候選清單

#### Scenario: 名字含 /（巢狀格式）
- **WHEN** `PULL_ALL` 任一項含 `/`（如 `obsidian/obsidian-deploy`）
- **THEN** 系統接受該項，交由 `nested-repo-clone` 的 parent/child 邏輯處理，不報錯

#### Scenario: 清單為空
- **WHEN** `PULL_ALL` 未設定或解析後為空
- **THEN** 印出引導訊息建議執行 `pull-all init`，並以 exit code 0 結束
