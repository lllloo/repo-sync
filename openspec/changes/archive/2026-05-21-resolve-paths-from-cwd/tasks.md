## 1. Path Resolution Helper

- [x] 1.1 在 `index.js` 新增 `resolveRoot()` 函式：優先讀 `PULL_ALL_ROOT`，否則回傳 `path.dirname(process.cwd())`。
- [x] 1.2 將所有 `path.resolve(__dirname, '..')` 替換為 `resolveRoot()` 呼叫（`main` 與 `runInit` 內各一處）。
- [x] 1.3 將 `loadEnvFile()` 內 `path.join(__dirname, '.env')` 改為 `path.join(resolveRoot(), '.env')`。
- [x] 1.4 將 `runInit()` 內 `envPath` 計算改為 `path.join(resolveRoot(), '.env')`。
- [x] 1.5 確認 `index.js` 已無 `__dirname` 殘留（grep 檢查）。

## 2. UX 提示

- [x] 2.1 在 `正在檢查 N 個 repo 狀態...` 訊息前加一行 gray 文字顯示實際解析到的掃描根目錄路徑（讓使用者一眼看出走錯地方）。

## 3. Documentation

- [x] 3.1 更新 `README.md` 安裝與使用章節：說明 `npm link` 後在任意目錄執行的正確用法。
- [x] 3.2 在 README 新增 `PULL_ALL_ROOT` 環境變數說明與範例。
- [x] 3.3 在 README 新增 Migration 段：舊 `pull-all/.env` 需移到掃描根目錄（一行 `mv` 指令）。
- [x] 3.4 更新 `.claude/skills/pull-all/SKILL.md`：移除 hard-code 的 `/Users/barney/code/`，改為 `<root>/<name>` 並在開頭定義 root 解析規則。
- [x] 3.5 更新 `.codex/skills/pull-all/SKILL.md`：同 3.4。

## 4. Verification

- [x] 4.1 情境 A：`cd C:\code\pull-all && node index.js` → 確認仍掃 `C:\code\` 底下兄弟 repo。實測 root 顯示 `C:\code`，8 個 repo。
- [x] 4.2 情境 B：`cd C:\code\` 後執行 `node pull-all/index.js`（或全域 `pull-all`）→ 確認掃 `C:\` 底下（cwd 父目錄）。實測 root 顯示 `C:\`，「找不到任何 git repo」（符合預期）。
- [x] 4.3 情境 C：設 `PULL_ALL_ROOT=C:\code` 後在任意目錄執行 → 確認直接掃 `C:\code\` 底下。實測 cwd 在 `C:\Users\Joe`，root 仍顯示 `C:\code`，掃到 8 repo。
- [x] 4.4 情境 D：執行 `node index.js init`，確認 `.env` 寫入掃描根目錄而非 source。Code path 驗證：`envPath = path.join(resolveRoot(), '.env')`；未實跑以避免覆寫使用者現有 `.env`。
- [x] 4.5 `openspec validate resolve-paths-from-cwd --strict` 通過。
