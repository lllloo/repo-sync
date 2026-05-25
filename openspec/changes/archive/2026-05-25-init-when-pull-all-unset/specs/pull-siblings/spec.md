## MODIFIED Requirements

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取 pull-all repo 根目錄內的 `.env` 或執行環境中的 `PULL_ALL`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 以 `__dirname` 為錨點。`PULL_ALL_INCLUDE` SHALL NOT 再被讀取。當 `PULL_ALL` 未設定（無值或空值）時，工具 SHALL NOT 掃描全部 repo，而是停下並引導使用者執行 `pull-all init`。

#### Scenario: 環境設定存在且清單有效
- **WHEN** `.env` 或執行環境中的 `PULL_ALL` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在時引導 init
- **WHEN** pull-all repo 根目錄內無 `.env`、或 `.env` 無 `PULL_ALL` 那行、或 `PULL_ALL` 為空值，且執行環境亦未設定 `PULL_ALL`
- **THEN** 工具不掃描也不 pull 任何 repo，顯示引導訊息建議執行 `pull-all init` 勾選要追蹤的 repo，並以 exit code 0 結束
