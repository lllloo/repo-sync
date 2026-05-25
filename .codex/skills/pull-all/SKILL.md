---
name: pull-all
description: 檢查並更新掃描根目錄底下所有 git repo。fetch 後顯示誰落後，詢問確認後 pull。觸發關鍵詞：pull all、同步 repo、更新所有 repo、/pull-all。
license: MIT
metadata:
  author: barney
  version: "1.1"
---

你是 pull-all 工具。執行以下步驟，不要跳過確認流程。

## 0. 解析掃描根目錄（root）

`<root>` 固定為 **pull-all repo 的父目錄**，不受當前工作目錄影響（對應工具 `index.js` 的 `path.dirname(__dirname)`）。

定位方式：本 SKILL.md 位於 `<pull-all-repo>/.claude/skills/pull-all/`（Codex 版為 `.codex/skills/pull-all/`），故 pull-all repo 是本檔案目錄往上第 3 層，`<root>` 是 pull-all repo 的父目錄。

執行前先告知使用者 `root: <root>`，方便確認沒走錯地方。後續所有 `<root>` 與 `<name>` 一律以此為準。

## 1. 讀取設定

讀 pull-all repo 根目錄下的 `.env`（與 `.env.example` 同位置；以 pull-all 工具自身的 `__dirname` 為錨，與 `<root>` 解耦），取得 `PULL_ALL`（逗號分隔的 repo 名稱清單，支援 `parent/child` 格式）。

若 `.env` 不存在或 `PULL_ALL` 為空，不掃描任何 repo，提示使用者執行 `pull-all init`（或在 `.env` 設定 `PULL_ALL=repo1,repo2`）後結束。

## 2. Fetch（並行）

對每個目標 repo 執行：

```bash
git -C <root>/<name> fetch 2>&1
```

記錄失敗的 repo。

## 3. 檢查狀態（並行）

對每個 fetch 成功的 repo 執行：

```bash
git -C <root>/<name> rev-list HEAD..@{u} --count 2>&1
```

- 數字 > 0 → behind（需要 pull）
- 數字 = 0 → up to date
- 指令失敗 → no-tracking

## 4. 顯示摘要

用這個格式輸出：

```
📋 狀態摘要

✗ <name>  fetch 失敗
⚠ <name>  無追蹤分支
  <name>  <N> commit(s) behind   ← 需要更新
  <name>  up to date
```

若所有 repo 都是 up to date，輸出「所有 repo 已是最新。」然後結束。

## 5. 確認

若有需要 pull 的 repo，直接問使用者：

> 有 N 個 repo 需要更新（列出名稱）。要 pull 嗎？

等待使用者回覆。若使用者不同意，輸出「已取消。」然後結束。

## 6. Pull（並行）

對需要更新的 repo 執行：

```bash
git -C <root>/<name> pull 2>&1
```

輸出結果：

```
✓ <name>
✗ <name>  <錯誤訊息>
```
