## MODIFIED Requirements

### Requirement: 掃描兄弟層 git repo
工具 SHALL 依下列優先序解析掃描根目錄，並掃描該目錄下所有子資料夾找出含有 `.git` 目錄的 repo：(1) 若 `PULL_ALL_ROOT` 環境變數有值，使用該路徑作為掃描根；(2) 否則使用 `process.cwd()` 的父目錄。工具 MUST NOT 使用 source 檔案位置（如 `__dirname`）作為解析依據。

#### Scenario: 找到多個 git repo
- **WHEN** 解析後的掃描根目錄下有多個包含 `.git` 的子資料夾
- **THEN** 工具列出並處理所有 git repo，跳過非 git 資料夾

#### Scenario: 沒有任何 git repo
- **WHEN** 解析後的掃描根目錄下沒有任何含 `.git` 的子資料夾
- **THEN** 工具顯示「找不到任何 git repo」並結束

#### Scenario: 使用 PULL_ALL_ROOT 覆寫
- **WHEN** 執行環境設定 `PULL_ALL_ROOT=/some/path`
- **THEN** 工具直接掃描 `/some/path` 底下的子資料夾，不再取 cwd 父目錄

#### Scenario: 預設使用 cwd 父目錄
- **WHEN** 未設定 `PULL_ALL_ROOT`，使用者在 `~/code/web/` 執行 `pull-all`
- **THEN** 工具掃描 `~/code/` 底下的子資料夾

#### Scenario: 全域指令在任意目錄執行
- **WHEN** 使用者 `npm link` 後在任意目錄執行 `pull-all`
- **THEN** 工具依 cwd 父目錄（或 `PULL_ALL_ROOT`）解析掃描根，不再指向 npm global lib 目錄

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取掃描根目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 跟隨掃描根目錄解析結果，不再從 source 目錄讀取。

#### Scenario: 環境設定存在且清單有效
- **WHEN** 掃描根目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在（fallback）
- **WHEN** 掃描根目錄內無 `.env` 且執行環境未設定 `PULL_ALL_INCLUDE`
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: 環境設定為空（fallback）
- **WHEN** `PULL_ALL_INCLUDE` 不存在或解析後沒有任何 repo 名稱
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: init 寫入位置跟隨掃描根目錄
- **WHEN** 使用者執行 `pull-all init`
- **THEN** 工具將 `PULL_ALL_INCLUDE` 寫入掃描根目錄下的 `.env`，而非 source 目錄
