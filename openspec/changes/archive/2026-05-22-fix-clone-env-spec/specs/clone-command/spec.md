## MODIFIED Requirements

### Requirement: 解析 PULL_ALL_OWNER 設定
系統 SHALL 從 `PULL_ALL_OWNER` 環境變數或 pull-all repo 根目錄下的 `.env` 讀取 GitHub owner，未設定 MUST 以非 0 exit code 結束並印出指引。`.env` 位置 MUST 與 `PULL_ALL_INCLUDE` 使用相同規則：以 pull-all 工具 repo 根目錄為錨點，不跟隨掃描根目錄或 cwd。

#### Scenario: 從 .env 讀取
- **WHEN** pull-all repo 根目錄下 `.env` 含 `PULL_ALL_OWNER=barney` 且環境變數未覆寫
- **THEN** 系統使用 `barney` 作為 owner

#### Scenario: 環境變數覆寫 .env
- **WHEN** `.env` 與 `process.env` 同時設定 `PULL_ALL_OWNER`，且兩者值不同
- **THEN** 系統使用 `process.env.PULL_ALL_OWNER` 的值（與 `PULL_ALL_INCLUDE` 的優先序一致）

#### Scenario: 未設定 owner
- **WHEN** pull-all repo 根目錄下 `.env` 與 `process.env` 皆未設定 `PULL_ALL_OWNER`
- **THEN** 印出錯誤訊息指引設定 `PULL_ALL_OWNER`，以非 0 exit code 結束

#### Scenario: owner 為空字串
- **WHEN** `PULL_ALL_OWNER` 存在但值為空白或空字串
- **THEN** 視同未設定，依「未設定 owner」場景處理

### Requirement: 沿用掃描根目錄解析
系統 SHALL 沿用既有 `resolveRoot()` 規則解析掃描根目錄，優先序為 `PULL_ALL_ROOT` 環境變數 → `process.cwd()` 父目錄。掃描根目錄 SHALL 用於比對本機 repo 與作為 `gh repo clone` 工作目錄；`.env` 位置 MUST 不由掃描根目錄決定。

#### Scenario: 使用 PULL_ALL_ROOT
- **WHEN** 環境變數 `PULL_ALL_ROOT=/srv/projects` 已設定
- **THEN** 系統將 clone 工作目錄設為 `/srv/projects`，並仍從 pull-all repo 根目錄下 `.env` 讀取設定

#### Scenario: 預設使用 cwd 父目錄
- **WHEN** 未設定 `PULL_ALL_ROOT`，使用者在 `~/code/web/` 執行 `pull-all clone`
- **THEN** 系統將 clone 工作目錄設為 `~/code/`，並仍從 pull-all repo 根目錄下 `.env` 讀取設定
