# pull-all

對兄弟層所有 git repo 執行 `git pull`，一次同步所有專案。

## 安裝

無需安裝額外套件，只需 Node.js 與 git。

```bash
# 將此 repo clone 到與其他專案同層的目錄
# 例如：~/code/pull-all/
```

## 使用方式

```bash
node index.js
```

## 設定檔

同步清單屬於本機設定，請放在 `.env`，不要提交到 git。

可以先複製範例：

```bash
cp .env.example .env
```

再編輯 `.env`：

```env
PULL_ALL_INCLUDE=web,common,note
```

- **有 `PULL_ALL_INCLUDE`**：只 pull 清單內的 repo
- **無 `.env` 或 `PULL_ALL_INCLUDE` 為空**：pull 父目錄下所有 git repo
- **找不到的 repo**：顯示黃色警告，其他 repo 正常執行

也可以臨時用 shell 環境變數覆蓋 `.env`：

```bash
PULL_ALL_INCLUDE=web,common node index.js
```

### 從舊設定遷移

舊版 `pull-all.config.json`：

```json
{
  "include": ["web", "common", "note"]
}
```

改成 `.env`：

```env
PULL_ALL_INCLUDE=web,common,note
```

## 輸出範例

```
正在檢查 3 個 repo 狀態...

  web  up to date
  common  2 commits behind
⚠ note  無追蹤分支

1 個 repo 需要更新，要 pull 嗎？[y/N] y

✓ common
```
