## Why

目前 `PULL_ALL` 未設定時，工具靜默 fallback 為「掃描全部兄弟層 repo」。這導致使用者明明只想追蹤幾個 repo，卻在 `.env` 的 key 過時或拼錯時，被無聲地拉去 fetch 一堆不相干的 repo（例如已不存在的 `gsd-project` fetch 失敗刷紅）。「空 = 全部」這個隱性契約讓「沒設定」與「想掃全部」無法區分，使用者也得不到任何提示去修正設定。

## What Changes

- **BREAKING**：移除「`PULL_ALL` 未設定時掃描全部 repo」的 fallback。改為停下並引導使用者執行 `pull-all init`，不掃描任何 repo。
- `pull-all init` 一個 repo 都沒勾選就按 Enter 時，視為取消：不寫入 `.env`、保留原有設定、顯示「未選任何 repo，已取消」。不再寫入 `PULL_ALL=`（空值），「空 = 全部」語意一併移除。
- 統一未設定時的引導訊息措辭（main 與 clone 一致指向 `pull-all init`）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `pull-siblings`：`PULL_ALL` 未設定時不再掃描全部，改為停下引導 `pull-all init`。
- `init-command`：未勾選任何 repo 時視為取消、不寫入 `.env`，移除「空值等同掃描全部」的行為。

## Impact

- `index.js`：`main()` 未設定分支（移除掃全部、改引導 init 後 return）、`runInit()` 全不勾處理（取消不寫入、移除「（全部）」顯示）、`runClone()` 未設定訊息措辭統一。
- `CLAUDE.md` 環境變數表：「空白則掃全部」→「未設定則引導 init」。
- `README.md`：若提及掃全部 fallback 一併同步。
- 行為相容性：既有使用者若依賴「不設定就掃全部」，升級後需改跑一次 `pull-all init` 建立白名單。
