## Why

專案已從 `pull-all` 改名為 `sync-git`（commit `0c537b1`），環境變數 `PULL_ALL` → `SYNC_REPOS`、CLI 指令名 `pull-all` → `sync-git`。`package.json`、`index.js`、README、當前 specs 的**正向用法**都已對齊，但這次改名是直接以全域字串替換完成，**沒有對應的 OpenSpec change 留下軌跡**，且替換過程誤傷了一處不該動的東西：

- **無歸檔軌跡**：rename 直接 commit，沒有 proposal → archive，維護者無從在 OpenSpec 看到「何時、為何改名、影響哪些 capability」。
- **負面約束被連帶改名（真正的 bug）**：4 份 current spec 各有一句「廢棄的舊變數 SHALL NOT 再被讀取」，其主詞是**歷史變數** `PULL_ALL_INCLUDE` / `PULL_ALL_ROOT` / `PULL_ALL_OWNER`。全域替換把它們改成 `SYNC_REPOS_INCLUDE` / `SYNC_REPOS_ROOT` / `SYNC_REPOS_OWNER`，導致：
  - 這三個 `SYNC_REPOS_*` 變數從未存在，宣告「不讀一個不存在的變數」是空話；
  - 原本要保留的「`PULL_ALL_*` 已廢除、別再加回來」警示消失了。
  - 此負面約束是 `2026-05-25-align-specs-with-impl` task 5.2 特地判定「有效、非錯誤、不清理」而保留的，不該被 rename 抹掉。

## What Changes

本變更**補記錄**這次改名並**修正上述污染**，不改變任何既有執行行為（`index.js` 的正向 `SYNC_REPOS` 用法本就正確，不動）：

- 把 4 份 current spec 中「廢棄舊變數負面約束」的主詞改回歷史名 `PULL_ALL_INCLUDE` / `PULL_ALL_ROOT` / `PULL_ALL_OWNER`，恢復其原意。
- 正向用法（`SYNC_REPOS`、`sync-git` 指令名）一律維持新名，不回退。

涉及 5 處（跨 3 個 capability、共 4 份 spec 檔的 4 個 requirement）：

| capability | requirement | 修正 |
|---|---|---|
| env-config | 單一環境變數 SYNC_REPOS 管理 repo 清單 | `SYNC_REPOS_INCLUDE/ROOT/OWNER` → `PULL_ALL_INCLUDE/ROOT/OWNER` |
| clone-command | 從 gh CLI 自動取得 owner | `SYNC_REPOS_OWNER` → `PULL_ALL_OWNER` |
| clone-command | 掃描根目錄固定化 | `SYNC_REPOS_ROOT` → `PULL_ALL_ROOT` |
| pull-siblings | 掃描兄弟層 git repo | `SYNC_REPOS_ROOT` → `PULL_ALL_ROOT` |
| pull-siblings | 讀取環境設定指定同步清單 | `SYNC_REPOS_INCLUDE` → `PULL_ALL_INCLUDE` |

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `env-config`：負面約束的舊變數主詞改回 `PULL_ALL_*`。
- `clone-command`：「自動取得 owner」與「掃描根目錄固定化」兩條的廢棄變數主詞改回 `PULL_ALL_*`。
- `pull-siblings`：「掃描兄弟層」與「讀取環境設定」兩條的廢棄變數主詞改回 `PULL_ALL_*`。

## Impact

- `openspec/specs/env-config/spec.md`、`clone-command/spec.md`、`pull-siblings/spec.md`：依本變更 deltas 收斂（archive 時套用）。
- `index.js`、`package.json`、README、`.env.example`：無改動（正向改名本就正確）。
- 行為相容性：無影響。被修正的全是「描述已不讀取之變數」的負面約束文字，不影響任何執行路徑。
- 歷史歸檔 `openspec/changes/archive/**` 一律不動——其中的 `pull-all` / `PULL_ALL` 是當時事實。
