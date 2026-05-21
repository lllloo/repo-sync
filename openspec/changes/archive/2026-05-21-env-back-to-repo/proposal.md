## Why

`.env.example` 在 pull-all repo 內，但實際 `.env` 預期路徑卻在掃描根目錄（`resolveRoot()`），位置不一致違反直覺：使用者 clone 後最自然會跟著範例檔在 repo 內建 `.env`，卻會被工具忽略。當初 `resolve-paths-from-cwd` 把 `.env` 搬離 repo 的主要動機（「`npm link` 後 `__dirname` 會指向 npm global lib」）經查證為誤判 — `npm link` 走 symlink，Node 預設 resolve symlink，`__dirname` 仍是 source repo。

## What Changes

- `.env` 讀取／寫入位置從 `resolveRoot()` 改為 `__dirname`（pull-all repo 根目錄）
- `loadEnvFile()`、`runInit()` 兩處 envPath 計算改錨點
- `resolveRoot()` 與 `PULL_ALL_ROOT` 保持原樣 — root 解析與 `.env` 位置正交，CI / 多人場景仍可覆寫 root
- 不新增 `PULL_ALL_ENV_FILE` 環境變數（確認無 multi-root 用例，避免過度設計）
- **BREAKING**：使用者既有的 `<root>/.env` 不再被讀取，需手動搬到 `<repo>/.env`（實務上目前 `C:\code\.env` 並不存在，本機影響為零；其他環境需 migration 一行）

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `pull-siblings`：`.env` 位置的 requirement 從「掃描根目錄」改為「pull-all repo 根目錄（以 `__dirname` 為錨）」

## Impact

- **程式**：`index.js`（`loadEnvFile`、`runInit` 共 2 處）
- **文件**：`README.md`（安裝/使用章節 + Migration 段反向改寫，需交代為何 revert）
- **Skill 檔**：`.claude/skills/pull-all/SKILL.md`、`.codex/skills/pull-all/SKILL.md` 路徑描述同步
- **Spec**：`openspec/specs/pull-siblings/spec.md` 對 `.env` 位置的 requirement 更新
- **無影響**：`resolveRoot()`、`PULL_ALL_ROOT`、`runClone`、互動 UI、`.gitignore`（已含 `.env`）
- **歷史脈絡**：兩個月前 `resolve-paths-from-cwd` 的部分決策被反向，需在文件清楚交代差異與理由
