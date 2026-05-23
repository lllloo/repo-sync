## ADDED Requirements

### Requirement: clone 支援 parent/child 路徑格式
`runClone()` SHALL接受 `PULL_ALL` 中含 `/` 的項目，以路徑最後一段作為 GitHub repo 名，將其 clone 至正確的本機子目錄。

#### Scenario: clone 巢狀 repo
- **WHEN** `PULL_ALL` 包含 `obsidian/obsidian-deploy`，且本機不存在該目錄
- **THEN** 執行 `gh repo clone <owner>/obsidian-deploy` 至 `<rootDir>/obsidian/obsidian-deploy`

#### Scenario: parent dir 不存在時自動建立
- **WHEN** `PULL_ALL` 包含 `obsidian/obsidian-deploy`，但 `<rootDir>/obsidian/` 目錄不存在
- **THEN** 先建立 `<rootDir>/obsidian/` 目錄，再執行 clone

#### Scenario: parent dir 建立失敗時顯示錯誤
- **WHEN** 嘗試建立 parent dir 時發生權限或其他錯誤
- **THEN** 顯示錯誤訊息並跳過該 repo，不中止整個 clone 流程

### Requirement: 純名稱（無 /）行為不變
`runClone()` 對不含 `/` 的項目，行為與原版完全相同。

#### Scenario: 純名稱 clone
- **WHEN** `PULL_ALL` 包含 `sync-ai`（不含 `/`），且本機不存在
- **THEN** 執行 `gh repo clone <owner>/sync-ai` 至 `<rootDir>/sync-ai`
