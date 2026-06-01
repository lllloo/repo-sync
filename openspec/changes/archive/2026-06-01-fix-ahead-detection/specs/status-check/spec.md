## MODIFIED Requirements

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
- **THEN** 顯示「<repo>  ⇡N  (<current-branch> †)」，其中 N 為 `git rev-list HEAD --not --remotes --count` 的結果

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


## MODIFIED Requirements

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
