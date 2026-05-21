## 1. 程式異動

- [x] 1.1 `index.js` `loadEnvFile()`：envPath 從 `path.join(resolveRoot(), '.env')` 改為 `path.join(__dirname, '.env')`
- [x] 1.2 `index.js` `runInit()`：envPath 同上改錨點
- [x] 1.3 確認 `resolveRoot()` 與 `PULL_ALL_ROOT` 邏輯未動

## 2. Spec 主檔同步

- [x] 2.1 `openspec/specs/pull-siblings/spec.md`：「讀取環境設定指定同步清單」requirement 套用 delta（位置改為 pull-all repo 根目錄、`__dirname` 錨點），同步補入新增的兩個 scenario（不同 cwd 一致 / 與掃描根目錄解耦）

## 3. 文件與 Skill 同步

- [x] 3.1 `README.md` 安裝/使用章節：`.env` 位置描述從「掃描根目錄」改回「pull-all repo 根目錄」
- [x] 3.2 `README.md` Migration 段反向改寫：`mv ../.env ./.env`（從 pull-all repo 內執行），並補一段「為何 revert」說明（誤判 + 範例位置一致性）
- [x] 3.3 `.claude/skills/pull-all/SKILL.md`：路徑描述同步
- [x] 3.4 `.codex/skills/pull-all/SKILL.md`：路徑描述同步

## 4. 驗收

- [x] 4.1 `cd C:\code\pull-all && npm run init` 寫入 `C:\code\pull-all\.env`，print 出的 envPath 為絕對路徑（靜態驗證：`runInit` envPath = `path.join(__dirname, '.env')` → `C:\code\pull-all\.env`）
- [x] 4.2 `cd C:\code\pull-all && npm run start` 讀取同位置 `.env` 並套用 `PULL_ALL_INCLUDE`（程式碼路徑驗證：`loadEnvFile()` 與 `runInit()` 共用 `__dirname` 錨點。end-to-end 待使用者完成 `mv ../.env .env` migration 後本機跑）
- [x] 4.3 設 `PULL_ALL_ROOT=<某個其他目錄>` 確認掃描走該目錄、但 `.env` 仍從 pull-all repo 讀取（已實測：`PULL_ALL_ROOT=/tmp/pull-all-test` 掃描走 /tmp，`.env` 解析仍以 `__dirname` 為錨）
- [x] 4.4 `openspec validate env-back-to-repo --strict` 通過
