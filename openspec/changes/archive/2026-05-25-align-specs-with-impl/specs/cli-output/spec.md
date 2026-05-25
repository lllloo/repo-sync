## REMOVED Requirements

### Requirement: version-flag

**移除理由**：此需求要求 help 列出 `-v/--version`，但 `dispatch()` 從未實作該旗標，`pull-all -v` 會落到「未知指令」並 exit 1。需求把一個不存在的功能固化成承諾。經決策（見 design.md Decision A）採「砍承諾」：同步移除 `printHelp()` 的 `-v, --version` 那一行，help 不再列出此旗標。
