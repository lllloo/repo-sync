# env-config Spec

## Purpose
集中管理 pull-all 工具的環境變數讀取邏輯，提供單一 `PULL_ALL` 環境變數作為 repo 清單設定，並確保 `.env` 位置固定錨定於 pull-all repo 根目錄。

## Requirements
### Requirement: 單一環境變數 PULL_ALL 管理 repo 清單
系統 SHALL 以 `PULL_ALL` 作為唯一設定 repo 清單的環境變數，格式為逗號分隔的 repo 名稱。`PULL_ALL_INCLUDE`、`PULL_ALL_ROOT`、`PULL_ALL_OWNER` 三個舊變數 SHALL NOT 再被系統讀取。

#### Scenario: PULL_ALL 設定有效清單
- **WHEN** `.env` 或執行環境設定 `PULL_ALL=repo1,repo2,repo3`
- **THEN** 系統解析出 `["repo1", "repo2", "repo3"]` 作為目標清單

#### Scenario: PULL_ALL 未設定（fallback 掃全部）
- **WHEN** `.env` 與執行環境皆未設定 `PULL_ALL`
- **THEN** 系統對掃描根目錄下所有 git repo 執行操作

#### Scenario: process.env 優先於 .env
- **WHEN** `.env` 含 `PULL_ALL=a,b`，且執行環境 `PULL_ALL=c,d`
- **THEN** 系統使用 `["c", "d"]`（process.env 優先）

### Requirement: env 讀取 lazy cache
系統 SHALL 只讀取一次 `.env` 檔案，結果快取於記憶體中供同一次執行的所有讀取共用。`.env` 位置 MUST 以 `__dirname` 為錨點。

#### Scenario: 多處讀取同一 key
- **WHEN** 程式在同一次執行中多次呼叫 env 讀取函式
- **THEN** `.env` 檔案只被讀取、解析一次

#### Scenario: .env 不存在
- **WHEN** `__dirname` 下沒有 `.env` 檔案
- **THEN** 系統不報錯，以空物件作為 file env，fallback 至 process.env
