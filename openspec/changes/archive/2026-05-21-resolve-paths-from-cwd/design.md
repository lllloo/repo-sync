## Context

`pull-all` 是零相依 Node.js CLI，目前所有路徑（掃描根目錄、`.env` 位置）都用 `__dirname` 解析。這在「`cd pull-all && node index.js`」的用法下沒問題，但 README 已寫明可 `npm link` 全域安裝，全域用法下 `__dirname` 會指向 npm global lib 目錄（如 `~/.npm-global/lib/node_modules/pull-all/`），完全不是使用者想掃的位置。

另一個次要痛點：`.env` 綁在 source 目錄，跨機共用 source（透過 dotfiles、git clone 到多台機器）時，同步清單也跟著被綁。

## Goals / Non-Goals

**Goals:**
- `npm link` 後 `pull-all` 在任意目錄可用，且實際掃對地方。
- 支援使用者透過環境變數明確指定掃描根目錄。
- `.env` 跟著「使用者執行情境」走（cwd 為準），而非 source 位置。
- 維持「在 pull-all 目錄內 `node index.js`」的舊習慣仍可運作（cwd 父目錄 = source 父目錄）。

**Non-Goals:**
- 不支援多個 root 同時掃描（單一 root，要切換就改環境變數）。
- 不支援遞迴深度掃描（仍只看一層）。
- 不引入 global config 檔（如 `~/.pull-allrc`）；保持「零相依、本機 .env」的定位。

## Decisions

### 路徑解析優先序

1. 若 `process.env.PULL_ALL_ROOT` 有值 → 視為「直接掃這個目錄底下的子資料夾」。
2. 否則 → 取 `path.dirname(process.cwd())`（cwd 的父目錄）。

**為何 ROOT 不取父目錄？** 因為「我已經告訴你 root 在哪」的意圖很明確，再多一層 dirname 反直覺。`PULL_ALL_ROOT=/Users/barney/code` 應該掃 `code/` 底下，不是 `Users/` 底下。

**為何 cwd 取父目錄？** 沿用原本「在某個 repo 內執行可掃同層」的直覺：使用者在 `~/code/web/` 跑 `pull-all`，自然期望掃 `~/code/` 底下的兄弟 repo。

**替代方案：永遠取 cwd 不取父。** 缺點：使用者必須先 `cd ~/code/` 才能跑，比目前體驗倒退。

### `.env` 位置

`.env` 從**掃描根目錄**（上述解析後的結果）讀取，不是從 cwd 讀。理由：同步清單跟「要掃哪一坨 repo」綁在一起最直覺；同一台機器若維護兩個 root（如 work / personal），各自的 `.env` 各管各的清單。

`init` 指令也寫入同一位置。

### Hard-code 路徑遷移

`.claude/skills/pull-all/SKILL.md` 跟 `.codex/skills/pull-all/SKILL.md` 內 `/Users/barney/code/<name>` 全部改成 `<root>/<name>`，並在 skill 開頭加一段：「root = `PULL_ALL_ROOT` 或當前工作目錄的父目錄」。

### Breaking change 影響評估

- 舊用法「`cd pull-all && node index.js`」：cwd = `…/pull-all`，父目錄 = `…/code`，與舊行為 `__dirname` 父目錄一致。**不會壞**。
- 舊用法「在 `pull-all/` 外執行（例如別 alias 到絕對路徑）」：行為改變，需依 cwd 重新理解。**會壞**，README 標註。
- 既有 `.env` 仍在 source repo 內：因為「`cd pull-all` → cwd = source」，新規則下 `.env` 從 source 父目錄（= code 目錄）找 → **找不到舊 .env**。需在 README 提供一行 `mv pull-all/.env ../.env` 的遷移指引。

## Risks / Trade-offs

- **[Risk] 使用者在錯誤目錄執行（如家目錄）→ 掃到一堆非 repo 子資料夾** → Mitigation: 既有「找不到任何 git repo」訊息已有保護；可額外在 fetch 前印出實際解析到的 root 路徑，讓使用者一眼看出走錯地方。
- **[Risk] CI 或腳本環境用 `node /path/to/pull-all/index.js` 呼叫，cwd 不可預測** → Mitigation: 文件明確說 CI 場景請設 `PULL_ALL_ROOT`。
- **[Trade-off] 使用者要把 `.env` 從 `pull-all/.env` 搬到 `../.env`** → 一行 mv 解決，README 寫清楚；不做自動偵測舊位置與複製，避免新增 fallback 邏輯（會永遠揹著）。

## Migration Plan

1. 實作新路徑解析（單一 helper：`resolveRoot()`）。
2. 全檔搜尋 `__dirname` 改用 `resolveRoot()`。
3. README 加 Migration 段：說明 `npm link` 後的正確用法、`PULL_ALL_ROOT` 用法、舊 `.env` 搬遷指引。
4. 更新 SKILL.md 兩份。
5. 本地實測四種情境：(a) `cd pull-all && node index.js` (b) 全域 `pull-all` 在某 repo 內 (c) 全域 `pull-all` 在 home (d) 設 `PULL_ALL_ROOT` 後在任意目錄。
