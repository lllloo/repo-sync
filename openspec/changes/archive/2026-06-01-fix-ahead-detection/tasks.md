## 1. 修改 getDefaultBranch

- [x] 1.1 回傳型別從 `string | null` 改為 `{ name: string, localExists: boolean } | null`
- [x] 1.2 原有三條偵測路徑（`origin/HEAD`、`refs/heads/main`、`refs/heads/master`）皆保留，`refs/heads/main` / `refs/heads/master` 路徑因本機有該 ref 才走到，故 `localExists: true`
- [x] 1.3 `origin/HEAD` 路徑取得名稱後，額外執行 `git rev-parse --verify --quiet refs/heads/<name>` 確認本機是否存在，據此設定 `localExists`

## 2. 修改 getBranchStatus

- [x] 2.1 新增 `localExists` 參數（或調整呼叫簽名）；`localExists: false` 時直接回傳 `{ ahead: 0, behind: 0, hasUpstream: false, localMissing: true }`，不執行任何 git rev-list
- [x] 2.2 `localExists: true` 且有 upstream 時，ahead 改為 `git rev-list ${branch}@{u}..${branch} --count`（與 behind 對稱）
- [x] 2.3 `localExists: true` 且無 upstream 時，ahead 維持 `git rev-list ${branch} --not --remotes --count`（無 `@{u}` 可用，沿用現行邏輯）

## 3. 更新 checkRepo 呼叫端

- [x] 3.1 `checkRepo` 收到 `getDefaultBranch` 的新物件格式，解構 `{ name, localExists }` 後傳給 `getBranchStatus`
- [x] 3.2 確認 `defaultBranch` 為 `null`（無預設分支）的既有處理路徑不受影響

## 4. 更新 renderRepo 顯示

- [x] 4.1 `renderRepo` 收到 `localMissing: true` 時，default branch 行顯示 `(本機無此分支)` 而非 `⇡0 ⇣0` 或 `✓`
- [x] 4.2 `localMissing: true` 的 repo 不列入 pull 候選（應已由三條件篩選自然排除，但需確認）
