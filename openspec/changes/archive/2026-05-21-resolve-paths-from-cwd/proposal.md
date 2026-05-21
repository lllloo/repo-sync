## Why

`pull-all` 目前以 `__dirname`（source 檔案所在）為基準解析父目錄與 `.env`。`npm link` 全域安裝後，`__dirname` 指向 npm global 套件目錄（如 `~/.npm-global/lib/node_modules/pull-all`），導致掃描錯誤位置、全域指令實際無法使用。同時 `.env` 也被綁死在 source repo 內，跨機共用同一份 source 時無法保有不同的同步清單。

## What Changes

- 以 `process.cwd()` 為基準解析掃描根目錄：預設掃 `cwd` 的「父目錄」（保留原本「在 code 資料夾任一專案內執行可掃同層 repo」的直覺）。
- 新增 `PULL_ALL_ROOT` 環境變數覆寫：設定後直接掃 `PULL_ALL_ROOT` 底下的子資料夾（不再取父目錄），給「想從任意路徑指定 code 根目錄」的使用者用。
- `.env` 讀取改在 `cwd` 找，不再從 source 目錄讀。
- README 加上遷移指引：使用者需在自己的 code 目錄（或任一兄弟 repo 內）執行 `pull-all`，而不是 `cd pull-all && node index.js`。
- `.claude/skills/pull-all/SKILL.md` 與 `.codex/skills/pull-all/SKILL.md` 內 hard-code 的 `/Users/barney/code/` 改成讀 `PULL_ALL_ROOT` 或從 cwd 推。
- **BREAKING**: 原本「在 `pull-all` 目錄內執行掃描父層」的隱含行為，現在改成「以 cwd 為基準」。若使用者習慣 `cd pull-all && node index.js`，cwd 的父目錄仍是同一個 code 目錄，行為不變；但 `npm link` 後的全域用法現在才會真正可用。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pull-siblings`: 掃描根目錄的解析方式從「source 檔案父目錄」改為「`PULL_ALL_ROOT` 或 cwd 的父目錄」；`.env` 讀取位置從 source 目錄改為 cwd。

## Impact

- `index.js`: `parentDir` 計算、`loadEnvFile()` 路徑、`runInit()` 內 `envPath` / `parentDir` 計算全部改用新解析函式。
- `README.md`: 安裝與使用章節調整，新增 `PULL_ALL_ROOT` 說明與 npm link 後的正確用法、遷移指引。
- `.claude/skills/pull-all/SKILL.md` 與 `.codex/skills/pull-all/SKILL.md`: 移除 hard-code 路徑。
- 既有 `.env` 檔位置：若使用者已有 `pull-all/.env`，需手動移到自己的 code 目錄；README 需指引此遷移。
