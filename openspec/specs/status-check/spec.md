# status-check Spec

## Purpose
在 `git pull` 之前先並行 `git fetch` 並顯示各 repo 的同步狀態，包含 current 與 default 兩條 branch 的 ahead/behind、working tree dirty、以及 branch 是否有 upstream。讓使用者在 pull 前同時掌握「需要更新」與「有未上傳變動」兩個維度，避免無謂的網路操作、意外更新與 dirty 工作被攪動。

## Requirements

### Requirement: 並行 fetch 所有目標 repo
工具 SHALL 在顯示狀態前，對所有目標 repo 並行執行 `git fetch`。空 repo（無任何 commit）SHALL 跳過 fetch 與所有後續狀態比較。

#### Scenario: fetch 成功
- **WHEN** 目標 repo 可正常連線至 remote
- **THEN** 工具取得最新 remote 資訊，繼續進行狀態比較

#### Scenario: fetch 失敗
- **WHEN** `git fetch` 回傳非 0 exit code（如網路錯誤、remote 不存在）
- **THEN** 該 repo 顯示紅色「✗ fetch 失敗」，跳過後續狀態比較與 pull

#### Scenario: 空 repo 跳過 fetch
- **WHEN** 在 repo 內執行 `git rev-parse --verify --quiet HEAD` 回傳非 0 exit code（無任何 commit）
- **THEN** 工具顯示灰色「(empty)」，不執行 fetch、不顯示任何 branch 行、不列入 pull 詢問

### Requirement: 顯示各 repo 狀態摘要
工具 SHALL 在確認 pull 前，顯示每個目標 repo 的狀態，包含 current branch 與 default branch 的 ahead/behind、working tree dirty 標示、branch 沒 upstream 的標示，並依「顯示策略」決定列出哪些 branch。

顯示符號定義：
- `⇡N` 表示本地領先 upstream N 個 commit
- `⇣N` 表示本地落後 upstream N 個 commit
- `*` 表示 working tree dirty（modified 或 staged 變動，untracked 不算）
- `†` 表示該 branch 沒有 upstream tracking
- `✓` 表示完全同步且 working tree clean
- `(本機無此分支)` 表示 default branch 僅存在於 remote，本機未 checkout

顯示策略：
- 任一 branch「有事」（`⇡⇣` 非零、dirty、或無 upstream）SHALL 列出該 branch 一行
- 兩條 branch（current 與 default）都沒事時 SHALL 只列 default branch 一條當代表
- dirty 標記 SHALL 標於 current branch 行（即使 current 本身 ahead/behind 皆為 0）
- 當 current == default 時 SHALL 只列一條，不重複

#### Scenario: current branch 完全同步且 clean
- **WHEN** current branch 對 upstream 既不 ahead 也不 behind，且 working tree clean
- **THEN** 顯示「<repo>  ✓  (<current-branch>)」

#### Scenario: current branch 落後 upstream
- **WHEN** `git rev-list HEAD..@{u} --count` 回傳 N > 0
- **THEN** 顯示「<repo>  ⇣N  (<current-branch>)」

#### Scenario: current branch 領先 upstream（有 upstream）
- **WHEN** current branch 有 upstream 且 `git rev-list @{u}..HEAD --count` 回傳 N > 0
- **THEN** 顯示「<repo>  ⇡N  (<current-branch>)」

#### Scenario: current branch 同時 ahead 與 behind
- **WHEN** current branch 對 upstream ahead = N > 0 且 behind = M > 0
- **THEN** 顯示「<repo>  ⇡N ⇣M  (<current-branch>)」

#### Scenario: current branch 沒有 upstream
- **WHEN** current branch 無對應 upstream tracking
- **THEN** 顯示「<repo>  ⇡N  (<current-branch> †)」，其中 N 為 branch 上不在任何 remote 的 commit 數

#### Scenario: working tree dirty 但 current 無 ahead/behind
- **WHEN** `git status --porcelain` 在排除以 `??` 開頭的行後仍有輸出，且 current branch 對 upstream 完全同步
- **THEN** 顯示「<repo>  ✓ *  (<current-branch>)」

#### Scenario: working tree dirty 且 current 有 ahead/behind
- **WHEN** working tree dirty 且 current branch 有 ahead 或 behind
- **THEN** 在 current branch 行尾加上 `*`，例如「<repo>  ⇣2 *  (<current-branch>)」

#### Scenario: default branch ≠ current 且 default 有事
- **WHEN** default branch 對其 upstream 有 ahead 或 behind，且 default ≠ current
- **THEN** 列出 default branch 一行；若 current 也有事或 dirty，current 另起一行縮排對齊

#### Scenario: default 與 current 同名
- **WHEN** current branch 名稱與 default branch 相同
- **THEN** 只列出一條，不重複顯示

#### Scenario: 無法判定 default branch
- **WHEN** `origin/HEAD`、`refs/heads/main`、`refs/heads/master` 三者皆不存在
- **THEN** 顯示「⚠ 無預設分支」並僅對 current branch 做狀態檢查與顯示

#### Scenario: detached HEAD
- **WHEN** `git symbolic-ref --short HEAD` 失敗（工作目錄處於 detached HEAD 狀態）
- **THEN** branch 欄顯示「(HEAD@<short-sha>, detached)」，跳過 current branch 的 ahead/behind/upstream 檢查，仍對 default branch 進行狀態檢查（若存在）

#### Scenario: 空 repo
- **WHEN** repo 無任何 commit
- **THEN** 顯示灰色「<repo>  (empty)」，不顯示任何 branch 符號

#### Scenario: default branch 本機不存在
- **WHEN** `getDefaultBranch` 判定 default branch 名稱，但本機無對應的 `refs/heads/<name>`（即從 `origin/HEAD` 得知名稱，但使用者從未 checkout）
- **THEN** default branch 行顯示「<default-branch>  (本機無此分支)」，不顯示 `⇡⇣` 數字，不誤判為同步，不列入 pull 候選

### Requirement: 詢問使用者是否 pull
工具 SHALL 在顯示摘要後，僅對同時滿足三項條件的 repo 詢問是否 pull：(1) current branch 有 upstream；(2) current branch ⇣ > 0；(3) working tree clean（依本 spec 之 dirty 定義）。default branch 的 behind SHALL NOT 觸發 pull 詢問。

#### Scenario: 有 repo 需要更新且 clean
- **WHEN** 至少一個 repo 同時滿足「current 有 upstream + ⇣ > 0 + clean」
- **THEN** 顯示「N 個 repo 需要更新，要 pull 嗎？[y/N]」並等待輸入（N 僅算符合上述三條件者）

#### Scenario: 使用者輸入 y
- **WHEN** 使用者輸入 `y` 或 `Y`
- **THEN** 工具對符合三條件的 repo 並行執行 `git pull`

#### Scenario: 使用者輸入 N 或其他
- **WHEN** 使用者輸入非 `y`/`Y` 的任何字元或直接按 Enter
- **THEN** 工具顯示「已取消」並結束，不執行任何 pull

#### Scenario: dirty repo 從 pull 名單剔除
- **WHEN** repo 之 current branch ⇣ > 0 但 working tree dirty
- **THEN** 該 repo SHALL NOT 列入 pull 詢問之 N，工具 SHALL 顯示「⊘ 跳過 K 個 dirty repo」並列出受影響 repo 名稱

#### Scenario: 僅 default branch behind
- **WHEN** 某 repo 唯一的「需要更新」訊號是 default branch（≠ current）的 behind
- **THEN** 工具 SHALL NOT 將該 repo 列入 pull 詢問，僅在摘要中顯示其資訊

#### Scenario: 所有 repo 都不需要 pull
- **WHEN** 沒有任何 repo 同時滿足三條件（包含全部 clean、無 behind、或全 dirty）
- **THEN** 顯示「所有 repo 已是最新」並直接結束，不詢問

### Requirement: 偵測 default branch
工具 SHALL 對每個非空 repo 嘗試判定 default branch，依下列順序：(1) `git symbolic-ref --short refs/remotes/origin/HEAD` 成功，取其指向的 branch 名；(2) `git rev-parse --verify --quiet refs/heads/main` 成功；(3) `git rev-parse --verify --quiet refs/heads/master` 成功；(4) 三者皆失敗則無 default branch。

工具在判定出 default branch 名後，SHALL 進一步確認本機是否存在對應的 `refs/heads/<name>`，並將結果（名稱 + 本機是否存在）一併傳給狀態計算層，使其能區分「本機有此分支」與「僅 remote 有」。

#### Scenario: origin/HEAD 已設且本機有對應分支
- **WHEN** `git symbolic-ref --short refs/remotes/origin/HEAD` 成功，且本機有 `refs/heads/<name>`
- **THEN** 以該名稱作為 default branch，`localExists: true`

#### Scenario: origin/HEAD 已設但本機無對應分支
- **WHEN** `git symbolic-ref --short refs/remotes/origin/HEAD` 成功，但本機無 `refs/heads/<name>`（從未 checkout）
- **THEN** 以該名稱作為 default branch，`localExists: false`

#### Scenario: 無 origin/HEAD，有本機 main
- **WHEN** `origin/HEAD` 無法解析，但 `refs/heads/main` 存在
- **THEN** 以 `main` 作為 default branch，`localExists: true`

#### Scenario: 無 origin/HEAD，有本機 master
- **WHEN** `origin/HEAD` 無法解析，`refs/heads/main` 不存在，但 `refs/heads/master` 存在
- **THEN** 以 `master` 作為 default branch，`localExists: true`

#### Scenario: 三者皆不存在
- **WHEN** `origin/HEAD`、`refs/heads/main`、`refs/heads/master` 三者皆不存在
- **THEN** 無 default branch（回傳 null）

### Requirement: 偵測 current branch ahead
工具 SHALL 對每個非空、非 detached 的 repo 計算 current branch 的 ahead 數，使用 `git rev-list <current-branch> --not --remotes --count`。此語意同時涵蓋「有 upstream」與「無 upstream（從未 push）」兩種情況，不需分支邏輯。

#### Scenario: 有 upstream 且本地領先
- **WHEN** current branch 有 upstream，且 local 有 commit 尚未推至任何 remote
- **THEN** ahead = N > 0，顯示 `⇡N`

#### Scenario: 從未 push 過的 branch
- **WHEN** current branch 無 upstream
- **THEN** ahead = branch 上所有不在任何 remote 的 commit 數，並加上 `†` 標記

#### Scenario: 完全同步
- **WHEN** branch 上所有 commit 都已存在於某個 remote tracking ref 中
- **THEN** ahead = 0，不顯示 `⇡` 符號

### Requirement: 偵測 working tree dirty
工具 SHALL 對每個非空 repo 判定 working tree 是否 dirty，依據 `git status --porcelain` 輸出。判定規則：排除以 `??` 開頭的 untracked 行後仍有任何輸出即視為 dirty。

#### Scenario: 有 modified 變動
- **WHEN** 已追蹤檔案被修改（porcelain 輸出第二欄非空且非 `?`）
- **THEN** repo 視為 dirty

#### Scenario: 有 staged 變動
- **WHEN** 有變動已加入 index（porcelain 輸出第一欄非空且非 `?`）
- **THEN** repo 視為 dirty

#### Scenario: 僅有 untracked 檔案
- **WHEN** `git status --porcelain` 輸出僅包含以 `??` 開頭的行
- **THEN** repo SHALL NOT 視為 dirty

#### Scenario: 完全 clean
- **WHEN** `git status --porcelain` 無任何輸出
- **THEN** repo 視為 clean

### Requirement: 偵測 default branch 的 ahead/behind
工具 SHALL 對非空 repo 的 default branch（依「偵測 default branch」requirement 判定）計算其對 upstream 的 ahead 與 behind。default branch 的 ahead/behind SHALL 視為純資訊，SHALL NOT 觸發 pull 詢問。

#### Scenario: default branch behind
- **WHEN** `git rev-list <default>..<default>@{u} --count` 回傳 N > 0
- **THEN** 在摘要中標示「⇣N (<default-branch>)」，不列入 pull 詢問

#### Scenario: default branch ahead
- **WHEN** `git rev-list <default> --not --remotes --count` 回傳 N > 0
- **THEN** 在摘要中標示「⇡N (<default-branch>)」，不列入 pull 詢問

#### Scenario: default branch 沒有 upstream
- **WHEN** default branch 無 upstream tracking
- **THEN** 在摘要中標示「⇡N (<default-branch> †)」

#### Scenario: default branch 與 current 同名
- **WHEN** default branch 名稱與 current branch 相同
- **THEN** 由 current branch 那條 scenario 代表，不重複列出
