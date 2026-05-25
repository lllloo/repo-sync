## Context

本變更不引入新行為，而是修正「spec 落後／互相矛盾」的文件債。原則是 **code 已是事實來源**：除 A 外，spec 改向實作對齊，不改實作。以下記兩個非顯然的決策。

## Decision A：`-v/--version` 砍承諾，不補功能

`cli-output` 的 `version-flag` 需求只要求「help 文字列出 `-v/--version`」，實作確實列了 → 嚴格說 spec 沒被違反。真正的問題是 help 列了一個 `dispatch()` 不認的旗標，跑 `pull-all -v` 會落到「未知指令」exit 1。

兩條路：

| 方向 | 動作 | 取捨 |
|---|---|---|
| 補功能 | dispatch 讀 `package.json` version | 符合 CLI 慣例，但替一個沒人用的旗標增表面 |
| **砍承諾**（選定） | 移除 help 那行 + 刪 `version-flag` 需求 | 表面最小、不留假承諾；放棄 CLI 慣例功能 |

選砍承諾：此工具是單人本機 CLI，版本號可由 `package.json` 或 `npm` 查得，`-v` 並非剛需。寧可沒有，也不要 help 撒謊。

## Decision D1：gh 前置檢查併入「取得 owner」，而非保留兩個需求

實作用單一 `gh api user --jq .login` 同時涵蓋三件事：gh 可用（exec 失敗→未安裝）、已登入（非 0 exit→未登入）、取得 owner。spec 卻拆成「前置檢查」與「取得 owner」兩個需求，且前者描述了不存在的 `gh --version`/`gh auth status`。

保留兩個需求會讓「同一個指令」被描述兩次 → 製造下一次漂移。故移除「前置檢查」需求，把「此指令同時作為 gh 可用性與登入狀態的前置守門」併入「取得 owner」需求，一個指令對應一個需求。

## Open Questions

無。A 已由使用者拍板（砍承諾）。
