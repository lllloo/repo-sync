## Context

現有 `index.js` 直接對目標 repo 執行 `git pull`，無預覽階段。此變更在 pull 前插入 fetch + status 檢查，並透過 `readline` 詢問使用者是否繼續。

## Goals / Non-Goals

**Goals:**
- 並行 `git fetch` 所有目標 repo
- 顯示狀態摘要（落後幾個 commit / 最新 / 無追蹤分支 / fetch 失敗）
- 若有 repo 需要更新，詢問一次 [y/N]
- 只 pull 落後的 repo

**Non-Goals:**
- 不支援逐個 repo 確認
- 不顯示 diff 或 commit 詳情
- 不處理 push 或其他 git 操作

## Decisions

**使用 `git fetch` 而非 `git remote update`**
- `git fetch` 語意精確，只更新 remote tracking refs
- 搭配 `git rev-list HEAD..@{u} --count` 計算落後數

**互動確認使用 Node.js 內建 `readline`**
- 無需新增外部套件
- 替代方案：第三方套件（inquirer）— 過重，不值得為單一 y/N 引入

**主流程改為序列兩階段**
```
階段一（並行）：git fetch × N repos
     ↓
階段二：顯示摘要 + readline 確認
     ↓
階段三（並行）：git pull × 落後的 repos
```

**無追蹤分支：顯示警告跳過**
- `git rev-list HEAD..@{u}` 在無追蹤分支時會報錯 → catch 後顯示 `⚠ 無追蹤分支`

## Risks / Trade-offs

- [網路延遲] fetch 階段需等所有 repo 完成才顯示摘要 → 可接受，本來 pull 也要等
- [全部最新] 若全部 repo 都是最新，不顯示確認問題，直接結束 → 避免多餘互動

## Open Questions

（無）
