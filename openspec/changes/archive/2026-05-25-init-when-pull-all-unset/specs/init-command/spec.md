## MODIFIED Requirements

### Requirement: 寫入 .env
確認後，系統 SHALL 將勾選結果寫入 `.env` 的 `PULL_ALL`。當使用者未勾選任何 repo 時，系統 SHALL 視為取消，不寫入 `.env`，並保留任何既有設定不變。

#### Scenario: .env 不存在時建立
- **WHEN** `.env` 不存在，使用者確認勾選清單（至少一個 repo）
- **THEN** 建立 `.env` 並寫入 `PULL_ALL=<comma-separated-list>`

#### Scenario: 更新現有 .env
- **WHEN** `.env` 已存在，使用者確認勾選清單（至少一個 repo）
- **THEN** 僅更新 `PULL_ALL` 那行，其餘 key 保留不變

#### Scenario: 未勾選任何 repo 視為取消
- **WHEN** 使用者未勾選任何 repo 並按 Enter
- **THEN** 系統不寫入也不修改 `.env`（既有設定保留），顯示「未選任何 repo，已取消」，並以 exit code 0 結束
