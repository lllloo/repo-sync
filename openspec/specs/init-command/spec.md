### Requirement: init subcommand 路由
執行 `pull-all init` 時，系統 SHALL 進入初始化流程而非主要 pull 流程。

#### Scenario: 正確路由
- **WHEN** 使用者執行 `pull-all init`
- **THEN** 系統執行 `runInit()`，不執行 `main()`

---

### Requirement: 掃描 git repo
系統 SHALL 掃描上層目錄所有子目錄，列出含 `.git` 的資料夾作為候選 repo。

#### Scenario: 找到 repo
- **WHEN** 上層目錄有多個含 `.git` 的子目錄
- **THEN** 全部列入 checkbox 候選清單

#### Scenario: 無 repo
- **WHEN** 上層目錄無任何 git repo
- **THEN** 顯示提示訊息並退出

---

### Requirement: 互動式 checkbox UI
系統 SHALL 以 raw mode terminal 顯示可互動的 checkbox 清單。

#### Scenario: 移動 cursor
- **WHEN** 使用者按 ↑ 或 ↓
- **THEN** cursor 移至上一個或下一個項目，並重新渲染清單

#### Scenario: 切換勾選
- **WHEN** 使用者按空白鍵
- **THEN** 當前項目的勾選狀態 toggle，並重新渲染

#### Scenario: 確認送出
- **WHEN** 使用者按 Enter
- **THEN** 回傳目前所有勾選的項目清單

#### Scenario: 取消
- **WHEN** 使用者按 Ctrl+C
- **THEN** 顯示「已取消」並以 exit code 0 結束

#### Scenario: 非 TTY 環境
- **WHEN** stdin 不是 TTY（如管道輸入）
- **THEN** 顯示錯誤訊息「init 需要互動式終端」並退出

---

### Requirement: 預先勾選現有清單
若 `.env` 已存在且包含 `PULL_ALL_INCLUDE`，系統 SHALL 預先勾選對應的 repo。

#### Scenario: .env 已存在
- **WHEN** `.env` 含有 `PULL_ALL_INCLUDE=repo-a,repo-b`
- **THEN** checkbox 清單中 `repo-a` 與 `repo-b` 預設為勾選

#### Scenario: .env 不存在
- **WHEN** `.env` 不存在
- **THEN** 所有 repo 預設為未勾選

---

### Requirement: 寫入 .env
確認後，系統 SHALL 將勾選結果寫入 `.env` 的 `PULL_ALL_INCLUDE`。

#### Scenario: .env 不存在時建立
- **WHEN** `.env` 不存在，使用者確認勾選清單
- **THEN** 建立 `.env` 並寫入 `PULL_ALL_INCLUDE=<comma-separated-list>`

#### Scenario: 更新現有 .env
- **WHEN** `.env` 已存在，使用者確認勾選清單
- **THEN** 僅更新 `PULL_ALL_INCLUDE` 那行，其餘 key 保留不變

#### Scenario: 未勾選任何 repo
- **WHEN** 使用者未勾選任何 repo 並按 Enter
- **THEN** `PULL_ALL_INCLUDE=`（空值），效果等同掃描全部
