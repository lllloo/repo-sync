# cli-output Specification

## Purpose
定義 sync-git CLI 的終端輸出格式規範，包含 help 文字、錯誤訊息、及寫入失敗的處理方式，確保使用者在各種情境下取得清楚的回饋。
## Requirements
### Requirement: fetch-error-message

fetch 失敗時，輸出 MUST 顯示失敗原因（stderr）。

#### Scenario: fetch 失敗顯示錯誤訊息

- **WHEN** 某個 repo 執行 `git fetch` 失敗
- **THEN** 輸出該 repo 名稱並附上 stderr 內容

---

### Requirement: env-write-error-handling

env 檔案寫入失敗時，系統 MUST 顯示錯誤訊息並以非零 exit code 結束。

#### Scenario: env 寫入失敗

- **WHEN** `updateEnvFile()` 的 `writeFileSync` 拋出例外
- **THEN** 以紅色顯示錯誤訊息並以非零 exit code 結束

