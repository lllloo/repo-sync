## MODIFIED Requirements

### Requirement: 掃描兄弟層 git repo
工具 SHALL 以 `path.dirname(__dirname)`（sync-git 工具 repo 的父目錄）作為固定掃描根目錄，掃描該目錄下所有子資料夾找出含有 `.git` 目錄的 repo。工具 MUST NOT 使用 `process.cwd()` 或環境變數作為掃描根解析依據。`PULL_ALL_ROOT` 環境變數 SHALL NOT 再被讀取。

#### Scenario: 找到多個 git repo
- **WHEN** `path.dirname(__dirname)` 下有多個包含 `.git` 的子資料夾
- **THEN** 工具列出並處理所有 git repo，跳過非 git 資料夾

#### Scenario: 沒有任何 git repo
- **WHEN** `path.dirname(__dirname)` 下沒有任何含 `.git` 的子資料夾
- **THEN** 工具顯示「找不到任何 git repo」並結束

#### Scenario: 無論 cwd 為何，根目錄固定
- **WHEN** 使用者在任意目錄執行 `sync-git`
- **THEN** 工具永遠掃描 `path.dirname(__dirname)` 底下的子資料夾

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取 sync-git repo 根目錄內的 `.env` 或執行環境中的 `SYNC_REPOS`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 以 `__dirname` 為錨點。`PULL_ALL_INCLUDE` SHALL NOT 再被讀取。當 `SYNC_REPOS` 未設定（無值或空值）時，工具 SHALL NOT 掃描全部 repo，而是停下並引導使用者執行 `sync-git init`。

#### Scenario: 環境設定存在且清單有效
- **WHEN** `.env` 或執行環境中的 `SYNC_REPOS` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在時引導 init
- **WHEN** sync-git repo 根目錄內無 `.env`、或 `.env` 無 `SYNC_REPOS` 那行、或 `SYNC_REPOS` 為空值，且執行環境亦未設定 `SYNC_REPOS`
- **THEN** 工具不掃描也不 pull 任何 repo，顯示引導訊息建議執行 `sync-git init` 勾選要追蹤的 repo，並以 exit code 0 結束
