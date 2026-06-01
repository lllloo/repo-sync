## 1. 確認改名正向用法已對齊（核對，無 code 改動）

- [x] 1.1 `package.json`：`name` / `bin` / `scripts` 為 `sync-git`、`node index.js`
- [x] 1.2 `index.js`：`env('SYNC_REPOS')`、help、訊息皆為新名，無殘留 `PULL_ALL`
- [x] 1.3 `.env.example`：`SYNC_REPOS=...`
- [x] 1.4 README 正文為新名；舊名僅存於「遷移指引」章節（刻意保留）
- [x] 1.5 git remote 已更新為 `github.com/lllloo/sync-git.git`（連線驗證通過）

## 2. spec delta：負面約束主詞改回 PULL_ALL_*

- [x] 2.1 `env-config`：MODIFIED「單一環境變數 SYNC_REPOS 管理 repo 清單」，`SYNC_REPOS_INCLUDE/ROOT/OWNER` → `PULL_ALL_INCLUDE/ROOT/OWNER`
- [x] 2.2 `clone-command`：MODIFIED「從 gh CLI 自動取得 owner」，`SYNC_REPOS_OWNER` → `PULL_ALL_OWNER`
- [x] 2.3 `clone-command`：MODIFIED「掃描根目錄固定化」，`SYNC_REPOS_ROOT` → `PULL_ALL_ROOT`
- [x] 2.4 `pull-siblings`：MODIFIED「掃描兄弟層 git repo」，`SYNC_REPOS_ROOT` → `PULL_ALL_ROOT`
- [x] 2.5 `pull-siblings`：MODIFIED「讀取環境設定指定同步清單」，`SYNC_REPOS_INCLUDE` → `PULL_ALL_INCLUDE`

## 3. 驗證與歸檔

- [x] 3.1 `openspec validate 2026-06-01-rename-pull-all-to-sync-git --strict` 通過
- [x] 3.2 `openspec archive` 套 delta 後，diff 三份主 spec：確認僅負面約束的 5 個 token 變動，正向 `SYNC_REPOS` / `sync-git` 不受影響
- [x] 3.3 archive 後重掃 current specs：`SYNC_REPOS_INCLUDE|ROOT|OWNER` 命中為 0
