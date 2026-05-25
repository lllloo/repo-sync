<p align="center">
  <img src="./assets/readme-header.png" alt="pull-all - sync sibling git repos">
</p>

# pull-all

`pull-all` 是一個零相依的 Node.js CLI，用來檢查同一層目錄下的多個 git repo，並只對落後遠端的 repo 執行 `git pull`。

## 為什麼做這個

使用 Codex 時常會同時維護多個專案，每次都要逐一進到各個 repo 執行 `git pull` 很麻煩。`pull-all` 讓你在一個地方檢查同層專案的更新狀態，先確認哪些 repo 落後遠端，再決定是否一次更新。

## 特色

- 一次檢查兄弟層所有 git repo
- 執行 `git fetch` 後先顯示狀態，不會直接 pull
- 只針對 behind 的 repo 詢問是否更新
- `init` 指令：互動式勾選 repo，自動寫入 `.env`
- `clone` 指令：自動 clone `.env` 列了但本機沒有的 repo（透過 `gh` CLI）
- 可用 `.env` 指定要同步的 repo 清單
- 無 npm dependencies，只需要 Node.js 與 git（`clone` 子命令另需 `gh`）

## 安裝

將此 repo 放在要管理的專案同層：

```text
~/code/
  pull-all/
  web/
  common/
  note/
```

確認環境已安裝：

```bash
node --version
git --version
```

建立全域指令（建議）：

```bash
npm link
```

## 使用方式

`pull-all` 的掃描根目錄固定為 **pull-all repo 的父目錄**（`path.dirname(__dirname)`），不受當前工作目錄影響——從哪裡執行都掃同一坨兄弟 repo：

```bash
cd ~/code/web
pull-all
# pull-all 位於 ~/code/pull-all，固定掃 ~/code/ 底下的兄弟 repo
```

未 `npm link` 也可：

```bash
node ~/code/pull-all/index.js   # 一樣掃 ~/code/，與 cwd 無關
npm start                        # 在 pull-all/ 目錄內
```

執行時頂部會印出實際解析的 root 路徑，方便確認沒走錯地方。

## 設定

`.env` 寫在 **pull-all repo 根目錄**（與 `.env.example` 同位置），與「掃描根目錄」解耦。不論在哪個 cwd 呼叫，工具都從同一處讀寫 `.env`。

### 快速初始化（建議）

執行 `init` 指令，互動式勾選要追蹤的 repo，自動寫入 pull-all repo 根目錄下的 `.env`：

```bash
node index.js init
# 或
npm run init
```

```text
選擇要追蹤的 repo（↑↓ 移動，Space 切換，Enter 確認）：

  [x] web
  [x] common
  [ ] old-project
```

若 `.env` 已存在，會自動預選現有清單，方便修改。

### 手動設定

同步清單屬於本機設定，請放在 `.env`，不要提交到 git。

```env
PULL_ALL=web,common,note
```

支援 `parent/child` 格式，用於追蹤放在子目錄裡的 git repo：

```env
PULL_ALL=web,common,obsidian,obsidian/obsidian-deploy,obsidian/obsidian-memory
```

| 設定 | 行為 |
| --- | --- |
| 有 `PULL_ALL` | 只檢查清單內的 repo |
| 無 `.env` 或 `PULL_ALL` 未設定 | 停下並提示執行 `pull-all init` 勾選，不檢查任何 repo |
| 清單內 repo 不存在 | 顯示警告，其他 repo 照常執行（用 `pull-all clone` 補回） |
| 清單內目錄不是 git repo | 跳過該目錄 |

## 執行流程

1. 掃描根目錄（pull-all repo 父目錄）下的 repo，套用 `PULL_ALL` 白名單。
2. 對每個 repo：偵測是否為空 repo（無 commit）→ 並行 `git fetch` → 偵測 default branch（`origin/HEAD` → `main` → `master`）→ 計算 default 與 current 兩條 branch 的 ahead / behind → 偵測 working tree dirty。
3. 列出狀態摘要（緊湊符號，見下方圖例）。
4. 只對「current branch 有 upstream + ⇣ > 0 + working tree clean」的 repo 詢問是否 `git pull`。
5. **dirty repo 永遠不被 pull**：current branch 落後遠端、但 working tree 有未提交變動的 repo，會自動從 pull 名單剔除（顯示 `⊘ 跳過 N 個 dirty repo`），不問也不執行。

## 輸出範例

```text
root: /Users/barney/code
正在檢查 5 個 repo 狀態...

  web      ✓                (main)
  common   ⇣2               (main)
  note     ⇡3               (feat-export †)
  api      ⇣2               (main)
           ⇡1               (feat-x)
  docs     ✓ *              (main)

⊘ 跳過 1 個 dirty repo: docs

1 個 repo 需要更新，要 pull 嗎？[y/N] y

✓ common
```

### 圖例

| 符號 | 意義 |
| --- | --- |
| `✓` | 完全同步且 working tree clean |
| `⇡N` | 本地領先 remote N commits（未上傳） |
| `⇣N` | 本地落後 remote N commits |
| `*` | working tree dirty（modified 或 staged 變動，untracked 不算） |
| `†` | 該 branch 沒有 upstream tracking（從未 push） |
| `(empty)` | repo 無任何 commit |
| `(HEAD@<sha>, detached)` | detached HEAD 狀態 |
| `⚠ 無預設分支` | 找不到 `origin/HEAD`、`main`、`master` 任一 |
| `⊘` | 從 pull 名單剔除（dirty + behind） |
| `✗` | fetch 或 pull 失敗 |

### 行為細節

- 只掃 default branch（main/master）與 current branch 兩條，不掃全部 local branches。
- default branch 的 ahead/behind 是**純資訊**：`git pull` 只動 current branch，工具不會自動更新 default。
- current branch 與 default 同名時，狀態行只顯示一條。
- 兩條 branch 都沒事（`✓`、無 dirty、有 upstream）時，只列 default 一條當代表，抑制雜訊。
- dirty 永遠標在 current branch 那一行（即使 current 本身是 `✓`）。

## 補回缺漏 repo（`pull-all clone`）

`.env` 列了但本機沒有的 repo，可用 `pull-all clone` 自動補回。URL 解析、認證、protocol 全部交給 `gh` CLI 處理。

前置條件：

- 已安裝 [gh CLI](https://cli.github.com/)
- 已執行 `gh auth login`

```bash
node index.js clone
# 或
pull-all clone
```

流程：

1. 檢查 `gh` 已安裝且已登入，任一失敗即報錯結束。
2. 從 `gh api user` 自動取得 GitHub 帳號，讀 `PULL_ALL` 清單。
3. 比對掃描根目錄，對本機不存在的名字並行執行 clone；`parent/child` 格式會自動建立 parent 目錄。
4. 已存在但不是 git repo 的目錄會跳過警告，不覆蓋既有檔案。

限制：

- 只支援 GitHub。GitLab、Bitbucket、自架 Gitea 不在範圍。
- 主 `pull-all` 與 `pull-all init` 不受影響，不需要 `gh`。

## 常用指令

```bash
# 初始化 .env（互動式勾選）
node index.js init
npm run init

# 補回 .env 列了但本機沒有的 repo
node index.js clone

# 顯示用法
node index.js --help

# 執行同步
node index.js
npm start

# 只同步指定 repo（臨時覆蓋）
PULL_ALL=web,common node index.js
```

## 遷移指引

中間有段時間（`resolve-paths-from-cwd` 之後）`.env` 預期放在「掃描根目錄」。現已**改回 pull-all repo 根目錄**，與 `.env.example` 位置一致。從 pull-all repo 內執行：

```bash
mv ../.env .env
```

### 為何 revert

- 當初把 `.env` 搬離 repo 的主要動機是「`npm link` 全域安裝後 `__dirname` 會指向 npm global lib」——查證為**誤判**。`npm link` 走 symlink，Node 預設 resolve symlink，`__dirname` 仍是 source repo。只有 `npm install -g`（從 registry 真實複製檔案）才會落到 global lib，本專案無 publish 計畫。
- `.env.example` 留在 repo 內、`.env` 卻在外面，clone 後第一直覺就會踩到。位置一致才是主訴求。

## 授權

MIT
