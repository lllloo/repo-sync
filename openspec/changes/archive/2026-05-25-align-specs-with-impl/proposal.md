## Why

一次 subagent 審核發現多份 current spec 已落後或與既有正確實作互相矛盾，且兩份 current spec 自己打架。這些漂移不會影響執行，但會誤導維護者「讀到哪份算哪份」：

- `env-config` 仍寫「`PULL_ALL` 未設定 → 掃全部」，但 commit `7e70356` 早已改成「引導 `pull-all init`、不掃描」（`pull-siblings`、README 都更新了，唯獨它漏改）。
- `clone-command` 要求「名字含 `/` 報錯」，但 `nested-repo-clone` 明確支援 `parent/child`，實作站在後者 → 兩份 current spec 直接相反。
- `clone-command` 的 gh 前置檢查寫成 `gh --version` + `gh auth status` 兩段，實作只用單一 `gh api user --jq .login` 涵蓋。
- `clone-command` 一邊宣告 `PULL_ALL_INCLUDE` 廢除，一邊又拿它當需求主詞。
- `cli-output` 把 `-v/--version` 固化成需求，但 `dispatch()` 從未實作 → help 承諾了不存在的功能（`pull-all -v` 會 exit 1）。

## What Changes

本變更以「既有實作為準」收斂文件債，**不改變任何既有正確行為**，唯一的 code 改動是移除一個假承諾：

- **A（cli-output）**：移除 `version-flag` 需求；同步刪除 `printHelp()` 的 `-v, --version` 那一行。承認此功能不存在，不再承諾。
- **C（env-config）**：將「`PULL_ALL` 未設定 → 掃全部」scenario 改為「不掃描、引導 `pull-all init`」，對齊既有實作與 `pull-siblings`。
- **D1（clone-command）**：移除描述不存在步驟的「gh CLI 前置條件檢查」需求，併入既有正確的「從 gh CLI 自動取得 owner」需求（單一 `gh api user --jq .login` 同時作前置檢查與取 owner）。
- **D2（clone-command）**：移除「名字含 `/` 報錯」需求，與 `nested-repo-clone` 對齊（含 `/` 視為 parent/child）。
- **D3（clone-command）**：清掉殘留的 `PULL_ALL_INCLUDE`，統一為 `PULL_ALL`。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `cli-output`：移除 `version-flag` 需求。
- `env-config`：`PULL_ALL` 未設定時不再掃全部，改為引導 `pull-all init`。
- `clone-command`：gh 前置檢查併入取 owner 需求；移除「含 / 報錯」；`PULL_ALL_INCLUDE` 一律改為 `PULL_ALL`。

## Impact

- `index.js`：`printHelp()` 移除 `-v, --version` 那行（唯一 code 改動）。C/D 的實作本就正確，不動。
- `openspec/specs/cli-output/spec.md`、`env-config/spec.md`、`clone-command/spec.md`：依本變更 deltas 收斂。
- 行為相容性：無。`-v/--version` 本就無法運作；其餘皆為文件對齊。
