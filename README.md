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
- 可用 `.env` 指定要同步的 repo 清單
- 無 npm dependencies，只需要 Node.js 與 git

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

可直接執行，也可用 `npm link` 建立全域指令：

```bash
npm link
```

## 使用方式

在 `pull-all` 目錄內執行：

```bash
node index.js
```

或使用 npm script：

```bash
npm start
```

若已執行 `npm link`：

```bash
pull-all
```

## 設定

### 快速初始化（建議）

執行 `init` 指令，互動式勾選要追蹤的 repo，自動寫入 `.env`：

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
PULL_ALL_INCLUDE=web,common,note
```

| 設定 | 行為 |
| --- | --- |
| 有 `PULL_ALL_INCLUDE` | 只檢查清單內的 repo |
| 無 `.env` 或 `PULL_ALL_INCLUDE` 為空 | 檢查父目錄下所有 git repo |
| 清單內 repo 不存在 | 顯示警告，其他 repo 照常執行 |
| 清單內目錄不是 git repo | 跳過該目錄 |

也可以臨時用 shell 環境變數覆蓋 `.env`：

```bash
PULL_ALL_INCLUDE=web,common node index.js
```

## 執行流程

1. 掃描父目錄或 `PULL_ALL_INCLUDE` 指定的 repo。
2. 對每個 repo 執行 `git fetch`。
3. 用 `git rev-list HEAD..@{u} --count` 判斷是否落後追蹤分支。
4. 列出狀態摘要。
5. 只有存在 behind repo 時，才詢問是否執行 `git pull`。

## 輸出範例

```text
正在檢查 3 個 repo 狀態...

  web  up to date
  common  2 commits behind
⚠ note  無追蹤分支

1 個 repo 需要更新，要 pull 嗎？[y/N] y

✓ common
```

## 常用指令

```bash
# 初始化 .env（互動式勾選）
node index.js init
npm run init

# 執行同步
node index.js
npm start

# 只同步指定 repo（臨時覆蓋）
PULL_ALL_INCLUDE=web,common node index.js
```

## 授權

MIT
