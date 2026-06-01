# env-config Spec

## Purpose
集中管理 sync-git 工具的環境變數讀取邏輯，提供單一 `SYNC_REPOS` 環境變數作為 repo 清單設定，並確保 `.env` 位置固定錨定於 sync-git repo 根目錄。

## Requirements
### Requirement: 單一環境變數 SYNC_REPOS 管理 repo 清單
系統 SHALL 以 `SYNC_REPOS` 作為唯一設定 repo 清單的環境變數，格式為逗號分隔的 repo 名稱。`SYNC_REPOS_INCLUDE`、`SYNC_REPOS_ROOT`、`SYNC_REPOS_OWNER` 三個舊變數 SHALL NOT 再被系統讀取。當 `SYNC_REPOS` 未設定（無值或空值）時，系統 SHALL NOT 掃描全部 repo，而是停下並引導使用者執行 `sync-git init`。

#### Scenario: SYNC_REPOS 設定有效清單
- **WHEN** `.env` 或執行環境設定 `SYNC_REPOS=repo1,repo2,repo3`
- **THEN** 系統解析出 `["repo1", "repo2", "repo3"]` 作為目標清單

#### Scenario: SYNC_REPOS 未設定（引導 init）
- **WHEN** `.env` 與執行環境皆未設定 `SYNC_REPOS`（或解析後為空）
- **THEN** 系統不掃描也不操作任何 repo，顯示引導訊息建議執行 `sync-git init`，並以 exit code 0 結束

#### Scenario: process.env 優先於 .env
- **WHEN** `.env` 含 `SYNC_REPOS=a,b`，且執行環境 `SYNC_REPOS=c,d`
- **THEN** 系統使用 `["c", "d"]`（process.env 優先）

### Requirement: env 讀取 lazy cache
系統 SHALL 只讀取一次 `.env` 檔案，結果快取於記憶體中供同一次執行的所有讀取共用。`.env` 位置 MUST 以 `__dirname` 為錨點。

#### Scenario: 多處讀取同一 key
- **WHEN** 程式在同一次執行中多次呼叫 env 讀取函式
- **THEN** `.env` 檔案只被讀取、解析一次

#### Scenario: .env 不存在
- **WHEN** `__dirname` 下沒有 `.env` 檔案
- **THEN** 系統不報錯，以空物件作為 file env，fallback 至 process.env
