## Context

`pull-all` 是 zero-dependency CLI，透過 `.env` 的 `PULL_ALL_INCLUDE` 控制要追蹤的 repo 清單。目前使用者需手動建立 `.env`，無引導流程。

## Goals / Non-Goals

**Goals:**
- 新增 `pull-all init` subcommand
- 以純 terminal UI（raw mode + ANSI）實作 checkbox 勾選
- 寫入或更新 `.env` 的 `PULL_ALL_INCLUDE`，保留其他 key
- `.env` 已存在時預先勾選對應 repo

**Non-Goals:**
- 不支援全選快捷鍵
- 不管理 `.env` 以外的設定

## Decisions

### D1：subcommand routing

在 `index.js` 最底部的呼叫點改為 router：

```js
const cmd = process.argv[2];
if (cmd === 'init') runInit();
else main();
```

**理由**：最小侵入，現有 `main()` 完全不動。

---

### D2：checkbox UI 用 raw mode + ANSI

```
選擇要追蹤的 repo（↑↓ 移動，Space 切換，Enter 確認）：

  [x] claude-code
  [x] pull-all       ← cursor（highlight）
  [ ] old-project
```

實作要點：
- `process.stdin.setRawMode(true)` 逐字元讀
- `\x1b[A` / `\x1b[B`：上下移動 cursor
- `\x20`（空白）：toggle 當前項目
- `\r`（Enter）：送出
- `\x03`（Ctrl+C）：取消並 exit
- Re-render：`process.stdout.write('\x1b[' + n + 'A')` 上移 n 行後整塊重畫

**理由**：不引入任何 dependency，與現有風格一致。

---

### D3：`.env` 更新策略

讀取現有 `.env` → 解析所有 key-value → 替換 `PULL_ALL_INCLUDE` → 序列化回寫。

```
# 其他 key 保留
FOO=bar
PULL_ALL_INCLUDE=repo-a,repo-b   ← 只動這行
```

若原本不存在 `PULL_ALL_INCLUDE`，直接 append。

## Risks / Trade-offs

- **raw mode 下 Ctrl+C 要自己攔**（不然 process 不會結束）→ 監聽 `\x03` 並呼叫 `process.exit(0)`
- **TTY 假設**：若 stdin 非 TTY（如 pipe），`setRawMode` 會丟例外 → 加 `process.stdin.isTTY` guard，非 TTY 環境提示錯誤後退出
