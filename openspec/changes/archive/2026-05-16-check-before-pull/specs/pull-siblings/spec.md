## MODIFIED Requirements

### Requirement: 並行執行 git pull
工具 SHALL 在使用者確認後，只對落後 remote 的 repo 並行執行 `git pull`。

#### Scenario: 所有落後 repo pull 成功
- **WHEN** 使用者確認且所有落後 repo 均可正常 pull
- **THEN** 每個 repo 顯示成功狀態，工具以 exit code 0 結束

#### Scenario: 部分 repo pull 失敗
- **WHEN** 某個 repo pull 回傳非 0 exit code
- **THEN** 該 repo 顯示失敗狀態與 stderr 內容，其餘 repo 不受影響繼續執行
