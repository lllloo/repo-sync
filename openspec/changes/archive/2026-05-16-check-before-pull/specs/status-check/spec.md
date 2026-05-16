## ADDED Requirements

### Requirement: 並行 fetch 所有目標 repo
工具 SHALL 在顯示狀態前，對所有目標 repo 並行執行 `git fetch`。

#### Scenario: fetch 成功
- **WHEN** 目標 repo 可正常連線至 remote
- **THEN** 工具取得最新 remote 資訊，繼續進行狀態比較

#### Scenario: fetch 失敗
- **WHEN** `git fetch` 回傳非 0 exit code（如網路錯誤、remote 不存在）
- **THEN** 該 repo 顯示紅色「✗ fetch 失敗」，跳過後續狀態比較與 pull

### Requirement: 顯示各 repo 狀態摘要
工具 SHALL 在確認 pull 前，顯示每個目標 repo 的狀態。

#### Scenario: repo 落後 remote
- **WHEN** `git rev-list HEAD..@{u} --count` 回傳 N > 0
- **THEN** 顯示「repo 名稱  N commits behind」

#### Scenario: repo 已是最新
- **WHEN** `git rev-list HEAD..@{u} --count` 回傳 0
- **THEN** 顯示「repo 名稱  up to date」

#### Scenario: repo 無追蹤分支
- **WHEN** `git rev-list HEAD..@{u}` 因無追蹤分支而報錯
- **THEN** 顯示黃色「⚠ repo 名稱  無追蹤分支」，跳過該 repo

### Requirement: 詢問使用者是否 pull
工具 SHALL 在顯示摘要後，若有落後的 repo，詢問使用者一次是否繼續 pull。

#### Scenario: 有 repo 需要更新
- **WHEN** 至少一個 repo 落後 remote
- **THEN** 顯示「N 個 repo 需要更新，要 pull 嗎？[y/N]」並等待輸入

#### Scenario: 使用者輸入 y
- **WHEN** 使用者輸入 `y` 或 `Y`
- **THEN** 工具對落後的 repo 執行並行 git pull

#### Scenario: 使用者輸入 N 或其他
- **WHEN** 使用者輸入非 `y`/`Y` 的任何字元或直接按 Enter
- **THEN** 工具顯示「已取消」並結束，不執行任何 pull

#### Scenario: 所有 repo 都是最新
- **WHEN** 沒有任何 repo 落後 remote
- **THEN** 顯示「所有 repo 已是最新」並直接結束，不顯示確認問題
