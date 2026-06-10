# nested-repo-discovery Specification

## Purpose
定義 `runInit()` 掃描巢狀 git repo 的邏輯，包含 parent/child 格式的選單顯示、縮排規則、以及 `SYNC_REPOS` 寫入格式，讓使用者能在 init 選單中看到並選取巢狀的 repo。

## Requirements
### Requirement: init 掃描一層巢狀 git repo
`runInit()` 掃描 `parentDir` 第一層目錄時，只處理**是** git repo 的目錄。對每個第一層 git repo，繼續往下一層掃描，將發現的 git repo 以 `parent/child` 格式加入選單。非 git 的第一層目錄完全跳過（不加入選單，不掃子目錄）。

#### Scenario: 發現巢狀 repo（父目錄本身是 git repo）
- **WHEN** parentDir 下有目錄 `obsidian/`（是 git repo），且其中有子目錄 `obsidian-deploy/`（是 git repo）
- **THEN** init 選單同時出現 `obsidian` 與 `obsidian/obsidian-deploy` 項目

#### Scenario: 非 git 父目錄不掃描
- **WHEN** parentDir 下有目錄 `test/`（非 git repo），且其中有子目錄 `test/`（是 git repo）
- **THEN** init 選單不出現 `test/test`

### Requirement: checkbox 縮排顯示階層
選單中 `parent/child` 格式的項目SHALL以縮排兩格方式呈現，視覺上區隔父子關係。

#### Scenario: 縮排顯示
- **WHEN** 選單同時包含 `obsidian` 和 `obsidian/obsidian-deploy`
- **THEN** `obsidian/obsidian-deploy` 顯示時前綴兩個空格，`obsidian` 無縮排

### Requirement: 寫入 SYNC_REPOS 格式一致
選取後寫入 `.env` 的 `SYNC_REPOS` 值，`parent/child` 項目以完整字串儲存（含 `/`）。

#### Scenario: 寫入含 / 的名稱
- **WHEN** 使用者在 init 中勾選 `obsidian/obsidian-deploy`
- **THEN** `.env` 的 `SYNC_REPOS` 包含 `obsidian/obsidian-deploy`（含斜線）

### Requirement: preselected 與現有 SYNC_REPOS 相容
init 啟動時，若 `SYNC_REPOS` 已含 `parent/child` 字串，SHALL自動預選對應項目。

#### Scenario: 預選巢狀 repo
- **WHEN** 現有 `SYNC_REPOS=obsidian/obsidian-deploy,repo-sync`
- **THEN** init 選單中 `obsidian/obsidian-deploy` 與 `repo-sync` 預設為已選取
