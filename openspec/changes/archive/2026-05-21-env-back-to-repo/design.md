## Context

`pull-all` 目前以 `resolveRoot()`（`PULL_ALL_ROOT` 或 cwd 父目錄）為基準讀寫 `.env`。此設計源自兩個月前的 `resolve-paths-from-cwd` change（commit `4b985ec`），主要動機是：

1. 「`npm link` 全域安裝後 `__dirname` 會指向 `~/.npm-global/lib/node_modules/pull-all/`，掃到完全不對的位置」
2. 次要：`.env` 綁在 source 目錄，跨機共用 source 時清單也跟著走

之後使用者實際使用一段時間後發現：

- `.env.example` 留在 repo 內，但 `.env` 預期路徑卻在掃描根目錄 — 位置不一致，clone 後第一直覺就會踩到
- 復查當初理由 1：**誤判**。`npm link` 走 symlink，Node 預設 resolve symlink，`__dirname` 在 link 之後仍然是 source repo 路徑。只有 `npm install -g <pkg>`（從 registry 真實複製檔案）才會落到 global lib，本專案無 publish 計畫
- 當初理由 2 中「跨機共用 source 帶走預設清單」的風險，因 `.gitignore` 已含 `.env`，實務上不會被 commit／被 dotfiles 帶走，影響極小

實際使用模式為 `cd C:\code\pull-all && npm run init/start`，此情境下 `cwd === __dirname`，本次變更**對日常使用零行為差異**，只有「設定檔位置」搬家。

## Goals / Non-Goals

**Goals:**

- `.env` 位置與 `.env.example` 對齊（同在 pull-all repo 根目錄）
- 無論呼叫者位於何處（`cd pull-all`、`npm link` 後任意目錄、絕對路徑呼叫），`.env` 都穩定指向同一處 — 跟「工具」走、不跟「cwd」走
- 保留 `resolveRoot()` 與 `PULL_ALL_ROOT` 不動，root 解析與 `.env` 位置完全解耦
- 文件清楚交代「為何 revert」與「如何從 `<root>/.env` 搬回 `<repo>/.env`」

**Non-Goals:**

- 不支援多 root 各自 `.env`（使用者確認無此用例）
- 不引入 `PULL_ALL_ENV_FILE` 之類覆寫變數（避免過度設計）
- 不引入舊位置偵測 / 自動遷移 fallback（一行 `mv` 解決，避免永遠揹著相容層）
- 不改 `runClone`、互動 UI、`.gitignore`、root 解析邏輯

## Decisions

### 錨點選擇：`__dirname`，而非相對路徑

`loadEnvFile()` 與 `runInit()` 中 envPath 改用：

```js
const envPath = path.join(__dirname, '.env');
```

**替代方案：相對路徑 `'.env'`（相對於 `process.cwd()`）。**

| 呼叫方式 | `__dirname` 結果 | 相對路徑結果 |
|---------|-----------------|-------------|
| `cd pull-all && npm run init` | `pull-all/.env` ✓ | `pull-all/.env` ✓ |
| `cd code && node pull-all/index.js init` | `pull-all/.env` ✓ | `code/.env` ✗ |
| `npm link` 後任意目錄 `pull-all init` | `pull-all/.env` ✓ | 任意目錄/.env ✗ |
| CI 絕對路徑呼叫 | `pull-all/.env` ✓ | 隨 cwd 飄 ✗ |

選 `__dirname` 的理由：**一個字成本買到「.env 屬於工具」的語意完整性**。即便日常用法相對路徑也能跑，但 README 明文提到 `npm link` 全域用法、未來 alias / 從外部呼叫都會踩到。診斷訊息（`✓ 已寫入 ${envPath}`）也會印絕對路徑、可診斷性較佳。

### 不引入 `PULL_ALL_ENV_FILE`

使用者明確表示無「同台機器多 root」用例。若未來真有需求，加環境變數覆寫的成本仍是 3 行，現在不預先佈線。

### `resolveRoot()` 與 `PULL_ALL_ROOT` 保留

`.env` 位置與「掃描哪個 root」是兩個正交問題。把 `.env` 搬回 repo 不影響：

- 使用者仍可 `PULL_ALL_ROOT=D:\projects pull-all` 掃別處
- `.env` 內 `PULL_ALL_INCLUDE=web,common,note` 仍適用於任何 root（前提是 root 下有同名 repo）

### 遷移策略：一行 `mv`，不做相容 fallback

不偵測舊位置（`<root>/.env`）也不複製。理由：

- 本機 `C:\code\.env` 並不存在 → 零成本
- 加 fallback 等於永遠揹著相容程式碼，與當初 `resolve-paths-from-cwd` design 拒絕雙位置 fallback 的理由一致
- README 提供一行 `mv ../.env .env`（從 pull-all repo 內執行）

## Risks / Trade-offs

- **[Risk] 失去「同台機器多 root 各自 `.env`」能力** → Mitigation: 使用者確認無此用例；若未來需要，加 `PULL_ALL_ENV_FILE` 成本極低
- **[Risk] 跨機共用 source 時預設清單跟著走** → Mitigation: `.env` 在 `.gitignore` 中，不會被 commit；dotfiles 手動複製 `.env` 是罕見場景，使用者意識到即可避免
- **[Trade-off] 兩個月內第二次調整 `.env` 位置，看起來搖擺** → Mitigation: README 與 change 文件清楚交代「當初理由是誤判 + 範例位置一致性才是主訴求」，避免讀者困惑
- **[Risk] 既有外部使用者（若有）的 `<root>/.env` 失效** → Mitigation: README Migration 段提供一行 `mv` 指令；本機影響為零

## Migration Plan

1. 實作 `index.js` 兩處改錨點（`loadEnvFile`、`runInit`）
2. 更新 `openspec/specs/pull-siblings/spec.md` 對 `.env` 位置的 requirement
3. README 改寫：
   - 安裝/使用章節：`.env` 位置從「掃描根目錄」改回「pull-all repo 根目錄」
   - Migration 段反向改寫：`mv <root>/.env <repo>/.env`
   - 補一段「為何 revert」說明（誤判 + 範例位置一致性）
4. 同步 `.claude/skills/pull-all/SKILL.md`、`.codex/skills/pull-all/SKILL.md` 路徑描述
5. 本地實測：
   - `cd C:\code\pull-all && npm run init` 寫入 `C:\code\pull-all\.env` ✓
   - `cd C:\code\pull-all && npm run start` 讀取同位置 ✓
   - 設 `PULL_ALL_ROOT=D:\test`（若有測試環境）確認 root 解析仍走環境變數 ✓
