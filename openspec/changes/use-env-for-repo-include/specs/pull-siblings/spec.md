## MODIFIED Requirements

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取專案目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。

#### Scenario: 環境設定存在且清單有效
- **WHEN** `.env` 或執行環境中的 `PULL_ALL_INCLUDE` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在（fallback）
- **WHEN** `.env` 不存在且執行環境未設定 `PULL_ALL_INCLUDE`
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: 環境設定為空（fallback）
- **WHEN** `PULL_ALL_INCLUDE` 不存在或解析後沒有任何 repo 名稱
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

## REMOVED Requirements

### Requirement: 讀取設定檔指定同步清單
**Reason**: 同步 repo 清單是本機偏好，使用 tracked JSON 設定檔容易把個人資料夾名稱提交到 git。
**Migration**: 將 `pull-all.config.json` 的 `include` 陣列改寫成 `.env` 中的 `PULL_ALL_INCLUDE=repo-a,repo-b`。
