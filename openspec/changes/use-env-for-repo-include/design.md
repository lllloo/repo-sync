## Context

目前 `pull-all` 會讀取專案目錄內的 `pull-all.config.json`，並使用 `include` 陣列決定要同步哪些兄弟層 repo。這份設定包含使用者本機資料夾名稱，若放進 git 會混入個人環境資訊。

Node.js 本身可以讀取 `process.env`，但不會自動載入 `.env` 檔。本專案目前無外部套件，因此實作應保持零依賴，直接解析簡單的 `KEY=value` 格式即可。

## Goals / Non-Goals

**Goals:**

- 將 repo 白名單移到 `.env` 的 `PULL_ALL_INCLUDE`。
- 讓 `.env` 成為本機檔案，不進 git。
- 提供 `.env.example` 作為可提交範例。
- 保留無設定時掃描父層所有 git repo 的 fallback 行為。

**Non-Goals:**

- 不新增 dotenv 或其他 npm dependency。
- 不支援複雜 `.env` 語法，例如 multiline value、variable expansion。
- 不改變 fetch、status check、pull confirmation 的既有流程。

## Decisions

1. **使用 `.env` + `PULL_ALL_INCLUDE` 作為設定來源**

   Repo 白名單是環境相依設定，放在 `.env` 比放在 JSON 設定檔更符合本機設定語意。格式採逗號分隔：

   ```env
   PULL_ALL_INCLUDE=sync-ai,obsidian-memory,bmad-project
   ```

2. **自行解析簡單 `.env`，不新增 dependency**

   目前專案沒有 dependencies，為了維持安裝簡單，實作只需要支援：

   - 空行
   - `#` 註解
   - `KEY=value`
   - value 前後空白 trim
   - 以 `,` 分隔並 trim repo 名稱

3. **`process.env` 可覆蓋或補足 `.env`**

   讀取順序建議為：

   - 先讀 `.env`，取得 `PULL_ALL_INCLUDE`
   - 若 shell 已設定 `process.env.PULL_ALL_INCLUDE`，以 shell 環境變數為準

   這讓使用者可以臨時執行：

   ```bash
   PULL_ALL_INCLUDE=repo-a,repo-b node index.js
   ```

4. **停止依賴 `pull-all.config.json`**

   這是刻意的 breaking change，避免未來又把本機 repo 清單 commit。實作後應移除目前 tracked 的 `pull-all.config.json`，並在 README 指向 `.env.example`。

## Risks / Trade-offs

- **既有使用者仍有 `pull-all.config.json`** → README 明確說明遷移到 `.env`。
- **手寫 parser 不支援完整 dotenv 語法** → 本需求只需要簡單逗號清單，文件限定支援格式。
- **`.env` 缺失或變數為空** → 沿用現有 fallback：掃描父層所有 git repo。
- **repo 名稱含逗號** → 不支援；一般資料夾名稱不應使用逗號作為同步清單項目。
