## Context

`pull-all` → `sync-git` 的改名已由 commit `0c537b1` 以全域字串替換完成並 push。本 change 是事後補記錄＋修正替換副作用，不是重新執行改名。

## Decisions

### Decision 1：正向用法保持新名，只回退「廢棄變數負面約束」

替換把兩類文字一視同仁地改了，但它們語意相反：

```
  正向用法（要新名）              負面約束（主詞是歷史名）
  ─────────────────              ──────────────────────────
  env('SYNC_REPOS')              `PULL_ALL_INCLUDE` SHALL NOT 再被讀取
  sync-git init                  `PULL_ALL_ROOT`    SHALL NOT 再被讀取
  以 SYNC_REPOS 為唯一變數        `PULL_ALL_OWNER`   SHALL NOT 再被讀取
        │                                  │
        ▼                                  ▼
  指「現在用什麼」→ 新名          指「以前用過、現已廢除」→ 必須是歷史名
```

負面約束的價值是告訴維護者「這些舊變數曾存在、已廢除，別再加回來」。把主詞改成從未存在的 `SYNC_REPOS_*` 會讓這句話同時失真（不存在的東西無所謂讀不讀）又失憶（遺失廢除記錄）。故只回退這幾個主詞，正向用法不動。

### Decision 2：改回 `PULL_ALL_*` 而非刪除整句

兩個選項：(a) 主詞改回 `PULL_ALL_*`；(b) 整句刪除。選 (a)。

理由：`2026-05-25-align-specs-with-impl` task 5.2 已明確評估這些負面約束「屬有效負面約束（明確宣告不讀某變數），非錯誤，不清理」。本 change 只是修復 rename 對它造成的破壞，無權推翻前一個 change 的保留決定。刪除會二次遺失同一份歷史。

### Decision 3：用 MODIFIED 整段取代，body 僅動受污染 token

OpenSpec 的 MODIFIED 以 requirement 標題 match、整段 body 取代。delta 內每個 requirement 都完整複製 current spec 的現有內容（含所有 scenario），**只把負面約束句的 `SYNC_REPOS_*` 換回 `PULL_ALL_*`**，確保 archive 套用後除目標 token 外零變動。標題本身（含 `SYNC_REPOS`）不變——標題講的是正向主變數，是對的。

## Risks / Trade-offs

- **MODIFIED 誤改風險**：若 delta body 與 current spec 有非預期差異，archive 會把差異一併寫入。緩解：delta 逐字複製現有 requirement，僅動列管的 5 個 token；archive 前跑 `openspec validate` 並 diff 主 spec 確認只有預期變動。

## Migration

無資料或行為遷移。純 spec 文字修正，archive 時套回主 specs。
