## MODIFIED Requirements

### Requirement: 單一環境變數 SYNC_REPOS 管理 repo 清單
系統 SHALL 以 `SYNC_REPOS` 作為唯一設定 repo 清單的環境變數，格式為逗號分隔的 repo 名稱。`PULL_ALL_INCLUDE`、`PULL_ALL_ROOT`、`PULL_ALL_OWNER` 三個舊變數 SHALL NOT 再被系統讀取。當 `SYNC_REPOS` 未設定（無值或空值）時，系統 SHALL NOT 掃描全部 repo，而是停下並引導使用者執行 `sync-git init`。

#### Scenario: SYNC_REPOS 設定有效清單
- **WHEN** `.env` 或執行環境設定 `SYNC_REPOS=repo1,repo2,repo3`
- **THEN** 系統解析出 `["repo1", "repo2", "repo3"]` 作為目標清單

#### Scenario: SYNC_REPOS 未設定（引導 init）
- **WHEN** `.env` 與執行環境皆未設定 `SYNC_REPOS`（或解析後為空）
- **THEN** 系統不掃描也不操作任何 repo，顯示引導訊息建議執行 `sync-git init`，並以 exit code 0 結束

#### Scenario: process.env 優先於 .env
- **WHEN** `.env` 含 `SYNC_REPOS=a,b`，且執行環境 `SYNC_REPOS=c,d`
- **THEN** 系統使用 `["c", "d"]`（process.env 優先）
