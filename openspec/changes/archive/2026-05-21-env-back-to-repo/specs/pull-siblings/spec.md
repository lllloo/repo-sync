## MODIFIED Requirements

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取 pull-all repo 根目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 以 `__dirname`（pull-all repo 根目錄）為錨點，不跟隨掃描根目錄或 cwd，亦不從掃描根目錄讀取。

#### Scenario: 環境設定存在且清單有效
- **WHEN** pull-all repo 根目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在（fallback）
- **WHEN** pull-all repo 根目錄內無 `.env` 且執行環境未設定 `PULL_ALL_INCLUDE`
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: 環境設定為空（fallback）
- **WHEN** `PULL_ALL_INCLUDE` 不存在或解析後沒有任何 repo 名稱
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: init 寫入位置為 pull-all repo 根目錄
- **WHEN** 使用者執行 `pull-all init`
- **THEN** 工具將 `PULL_ALL_INCLUDE` 寫入 pull-all repo 根目錄下的 `.env`（以 `__dirname` 解析），而非掃描根目錄

#### Scenario: 從不同 cwd 呼叫時 `.env` 位置一致
- **WHEN** 使用者以 `npm link` 後在任意目錄、或從 pull-all repo 外以絕對路徑呼叫 `pull-all`
- **THEN** 工具仍從同一處（pull-all repo 根目錄）讀寫 `.env`，不隨 cwd 飄移

#### Scenario: `.env` 位置與掃描根目錄解耦
- **WHEN** 使用者設定 `PULL_ALL_ROOT=/some/other/path`
- **THEN** 工具掃描 `/some/other/path` 底下的子資料夾，但 `.env` 仍從 pull-all repo 根目錄讀取
