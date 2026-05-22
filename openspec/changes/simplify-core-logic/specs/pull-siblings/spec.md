## MODIFIED Requirements

### Requirement: 掃描兄弟層 git repo
工具 SHALL 以 `path.dirname(__dirname)`（pull-all 工具 repo 的父目錄）作為固定掃描根目錄，掃描該目錄下所有子資料夾找出含有 `.git` 目錄的 repo。工具 MUST NOT 使用 `process.cwd()` 或環境變數作為掃描根解析依據。`PULL_ALL_ROOT` 環境變數 SHALL NOT 再被讀取。

#### Scenario: 找到多個 git repo
- **WHEN** `path.dirname(__dirname)` 下有多個包含 `.git` 的子資料夾
- **THEN** 工具列出並處理所有 git repo，跳過非 git 資料夾

#### Scenario: 沒有任何 git repo
- **WHEN** `path.dirname(__dirname)` 下沒有任何含 `.git` 的子資料夾
- **THEN** 工具顯示「找不到任何 git repo」並結束

#### Scenario: 無論 cwd 為何，根目錄固定
- **WHEN** 使用者在任意目錄執行 `pull-all`
- **THEN** 工具永遠掃描 `path.dirname(__dirname)` 底下的子資料夾

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取 pull-all repo 根目錄內的 `.env` 或執行環境中的 `PULL_ALL`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 以 `__dirname` 為錨點。`PULL_ALL_INCLUDE` SHALL NOT 再被讀取。

#### Scenario: 環境設定存在且清單有效
- **WHEN** `.env` 或執行環境中的 `PULL_ALL` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在（fallback）
- **WHEN** pull-all repo 根目錄內無 `.env` 且執行環境未設定 `PULL_ALL`
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull

#### Scenario: init 寫入新變數名稱
- **WHEN** 使用者執行 `pull-all init`
- **THEN** 工具將選擇結果寫入 `.env` 的 `PULL_ALL` key，不再寫 `PULL_ALL_INCLUDE`

## REMOVED Requirements

### Requirement: 使用 PULL_ALL_ROOT 覆寫掃描根目錄
**Reason**: 掃描根目錄改為固定取 `path.dirname(__dirname)`，消除 cwd 依賴，不再需要 override 機制。
**Migration**: 若曾設定 `PULL_ALL_ROOT`，可移除；工具固定掃描 pull-all repo 的父目錄。
