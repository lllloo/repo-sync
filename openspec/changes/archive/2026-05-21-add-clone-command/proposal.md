## Why

目前 `pull-all` 只同步本機已存在的 repo，`.env` 列了但本機不存在的項目只能顯示警告後跳過。換機、新人 onboarding、補回被刪除的工作目錄等情境，使用者得逐一手動 `git clone`。新增 `pull-all clone` 子命令，把 `.env` 已列名單裡缺漏的 repo 自動拉下來，補完整個工作區同步閉環。

## What Changes

- 新增 `pull-all clone` 子命令，比對 `.env` 的 `PULL_ALL_INCLUDE` 與掃描根目錄底下實際存在的目錄，對缺漏的項目執行 `gh repo clone <OWNER>/<name>`。
- 新增 `.env` 設定鍵 `PULL_ALL_OWNER`，指定 GitHub owner（個人或 org 帳號）。單一 owner 政策：所有名字共用同一 owner。
- 名字含 `/` 視為錯誤格式（保留給未來擴充，目前 fail-fast）。
- 嚴格相依 `gh` CLI：`pull-all clone` 啟動時若 `gh` 不存在或未登入，列印安裝/登入指引後以非 0 exit code 結束。主 `pull-all` 與 `pull-all init` 不受影響。
- 目標目錄已存在但非 git repo 時跳過並警告，不覆蓋既有檔案。
- 並行執行多個 clone，沿用既有 `pull` 子命令的 `Promise.all` 模式。
- README 補上 `pull-all clone` 使用方式、`PULL_ALL_OWNER` 設定、與 `gh` 前置條件。

## Capabilities

### New Capabilities
- `clone-command`: `pull-all clone` 子命令的行為與設定契約，含 gh 前置檢查、名單比對、單一 owner 解析、並行 clone 與錯誤回報。

### Modified Capabilities
<!-- 不修改既有 spec：pull-siblings 的「找不到 repo」警告行為維持不變，clone-command 是另一條獨立路徑。init-command 也不動。 -->

## Impact

- **新增程式碼**：`index.js` 新增 `runClone()` 路由與相依輔助函式（gh 偵測、缺漏比對、並行 clone）。
- **新增設定**：`.env` 多一個鍵 `PULL_ALL_OWNER`；既有 `PULL_ALL_INCLUDE` 行為不變。
- **外部相依**：`pull-all clone` 子命令相依 `gh` CLI 已安裝且已登入；主流程仍維持零相依。
- **文件**：README 新增 clone 章節、`PULL_ALL_OWNER` 說明、`gh` 前置條件。
- **不影響**：`pull-all`、`pull-all init`、現有 `.env` 格式（純新增 key）、`PULL_ALL_ROOT` 行為。
