## ADDED Requirements

### Requirement: init 掃描一層巢狀 git repo
`runInit()` 在掃描 `parentDir` 第一層目錄後，對**不是** git repo 的目錄繼續往下一層掃描，將發現的 git repo 以 `parent/child` 格式加入選單。

#### Scenario: 發現巢狀 repo
- **WHEN** parentDir 下有目錄 `obsidian/`（非 git repo），且其中有子目錄 `obsidian-deploy/`（是 git repo）
- **THEN** init 選單出現 `obsidian/obsidian-deploy` 項目

#### Scenario: 第一層已是 git repo 則不下探
- **WHEN** parentDir 下有目錄 `pull-all/`（是 git repo），且其中有子目錄 `sub/`（是 git repo）
- **THEN** init 選單出現 `pull-all` 但不出現 `pull-all/sub`

### Requirement: checkbox 縮排顯示階層
選單中 `parent/child` 格式的項目SHALL以縮排兩格方式呈現，視覺上區隔父子關係。

#### Scenario: 縮排顯示
- **WHEN** 選單同時包含 `obsidian` 和 `obsidian/obsidian-deploy`
- **THEN** `obsidian/obsidian-deploy` 顯示時前綴兩個空格，`obsidian` 無縮排

### Requirement: 寫入 PULL_ALL 格式一致
選取後寫入 `.env` 的 `PULL_ALL` 值，`parent/child` 項目以完整字串儲存（含 `/`）。

#### Scenario: 寫入含 / 的名稱
- **WHEN** 使用者在 init 中勾選 `obsidian/obsidian-deploy`
- **THEN** `.env` 的 `PULL_ALL` 包含 `obsidian/obsidian-deploy`（含斜線）

### Requirement: preselected 與現有 PULL_ALL 相容
init 啟動時，若 `PULL_ALL` 已含 `parent/child` 字串，SHALL自動預選對應項目。

#### Scenario: 預選巢狀 repo
- **WHEN** 現有 `PULL_ALL=obsidian/obsidian-deploy,pull-all`
- **THEN** init 選單中 `obsidian/obsidian-deploy` 與 `pull-all` 預設為已選取
