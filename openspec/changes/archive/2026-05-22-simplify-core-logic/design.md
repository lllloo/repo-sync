## Context

`index.js` 是單一入口，621 行，純 Node.js stdlib。目前痛點：
- 三個 env 變數使用者需記憶
- `loadEnvFile()` 在 `loadIncludeList()` 和 `loadOwner()` 各自呼叫一次
- 每個 repo 最多 15 次序列 git call（主因：hasUpstream / getAhead / getBehind 各自獨立執行）
- `getCurrentBranch` / `isDirty` / `hasUpstream` / `getAhead` / `getBehind` 資訊可由單一 git 命令取得

## Goals / Non-Goals

**Goals:**
- 三個 env 變數壓縮為一個（`PULL_ALL`）
- git call 數量：每 repo 最多 15 → 4–5
- 函式數 25 → ~14，行數 621 → ~420
- 使用者操作介面不變

**Non-Goals:**
- 新增功能
- 引入外部 npm 依賴
- 修改 `checkbox()` TTY 互動邏輯

## Decisions

### D1：`git status --porcelain=v2 --branch` 取代五個函式

現狀：`getCurrentBranch` + `isDirty` + `hasUpstream` + `getAhead` + `getBehind` = 5–7 次 git call。

新作法：單一 `git status --porcelain=v2 --branch` 輸出包含：
```
# branch.head <name>          ← getCurrentBranch
# branch.upstream <upstream>  ← hasUpstream
# branch.ab +<a> -<b>         ← getAhead / getBehind
1 .M ...                      ← isDirty（非 ? 開頭的行）
```

解析為 `parseStatus(stdout)` → `{ name, detached, sha, hasUpstream, ahead, behind, dirty }`。

替代方案：逐步合併函式（維持多次呼叫）→ 放棄，徒增複雜度而無效能改善。

### D2：`checkRepo` 內 fetch 後並行

fetch 完後 remote refs 已更新，`git status` 才能取得正確 behind 值，故 fetch 必須先跑。fetch 完後 `git status` 與 `getDefaultBranch` 互相獨立，改為 `Promise.all`：

```
fetch → Promise.all([parseStatus, getDefaultBranch]) → (若需要) getBranchStatus(default)
```

### D3：`loadEnv` lazy singleton

```js
let _env = null;
const loadEnv = () => { if (!_env) _env = parseEnvFile(); return _env; };
const env = (k) => process.env[k] || loadEnv()[k] || null;
```

`loadIncludeList()` → `parseIncludeList(env('PULL_ALL'))`
`loadOwner()` → 完全刪除，`runClone` 改用 `gh api user --jq .login`

### D4：root 固定為 `path.dirname(__dirname)`

`PULL_ALL_ROOT` override 存在的原因是「從非 pull-all 目錄執行時 cwd 不對」。固定用 `__dirname`（pull-all repo 本身位置）的父層，不受 cwd 影響，且行為可預期。

代價：無法動態覆蓋 root。評估後此使用情境不存在。

## Risks / Trade-offs

- `git status --porcelain=v2` 需 git ≥ 2.11（2016 年，可接受）→ 無需版本檢查
- `PULL_ALL_INCLUDE` → `PULL_ALL` 為 breaking change → `runInit` 寫入新名稱，使用者首次跑 `init` 後自動遷移；`.env.example` 同步更新
- `path.dirname(__dirname)` 在開發時（`node /abs/path/index.js`）行為一致，無 edge case

## Migration Plan

1. `init` 子命令寫入 `PULL_ALL`（新名稱）
2. `.env.example` 更新
3. `CLAUDE.md` 環境變數說明更新
4. 無需 rollback 策略（純本機工具，git 可還原）
