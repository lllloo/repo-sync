## Context

`pull-all` 既有三個指令面向：

- `pull-all`：對掃描根目錄底下的 repo 並行 `git fetch` + 互動式 `git pull`。
- `pull-all init`：互動式 checkbox，把要追蹤的 repo 寫進 `.env` 的 `PULL_ALL_INCLUDE`。
- 掃描根目錄解析優先序：`PULL_ALL_ROOT` env var → `process.cwd()` 的父目錄。

`.env` 目前只記名字（如 `web,common,note`），不含 URL。`PULL_ALL_INCLUDE` 列了但本機不存在時，主流程列印「⚠ 找不到 xxx」後跳過。對換機、新人 onboarding、補回被刪除的工作目錄等情境，使用者需逐一手動 `git clone`。

探索階段討論過三種補 URL 路線（`.env` 多個 `PULL_ALL_URL_*`、外接 `pull-all.repos` manifest、外包給 `gh`），最後敲定走 `gh` 路線：URL 不本機維護，交給 `gh` CLI 解析。設定面只多 `PULL_ALL_OWNER` 一個鍵，跨機 onboarding 等同 `gh auth login` + 既有 `.env`。

## Goals / Non-Goals

**Goals:**

- 在不動主 `pull-all` 與 `pull-all init` 行為前提下，新增獨立 `pull-all clone` 子命令。
- 用 `gh repo clone` 完成 clone，URL 解析、認證、protocol（ssh/https）全部交由 `gh` 處理，與使用者既有 `gh` 設定對齊。
- 維持「主流程零外部相依」精神：`gh` 只是 `clone` 子命令的前置條件，未裝 / 未登入時主 `pull-all` 不受影響。
- 嚴格 fail-fast：缺前置條件、缺設定、格式錯誤一律明確報錯離開，不嘗試 fallback。
- 並行 clone，沿用既有 `Promise.all` 模式，行為與 `pull` 子命令一致。

**Non-Goals:**

- 不支援多 owner（跨 org）或自訂 URL。所有 `PULL_ALL_INCLUDE` 名字共用同一 `PULL_ALL_OWNER`。
- 不支援 GitHub 以外的 git host（GitLab、Bitbucket、自架 Gitea）。
- 不在 clone 後自動執行 `npm install`、`pull-all`、或其他生命週期鉤子。
- 不修改 `pull-all init` 行為（不加 `--from-gh` 選項，不從 `gh` 列 repo）。
- 不修改主 `pull-all` 對「找不到 repo」的警告處理（仍維持黃色警告後跳過）。
- 不互動：clone 子命令不問 URL、不問 owner、不要 TTY。設定全靠 `.env` / env vars。

## Decisions

### Decision: 外包 URL 解析給 `gh` 而非本機維護 manifest

**選擇**：用 `gh repo clone <OWNER>/<name>` 取代自建 URL manifest。

**理由**：

- `.env` 通常不進版控，本機維護 URL 在換機時等於沒寫；外包給 `gh` 後 onboarding 只剩 `gh auth login`。
- `gh` 已是使用者既有工作流的一部分（push/PR 都靠它），認證、protocol、private repo 可見性都已對齊。
- 工具本身設定面減少（只多 `PULL_ALL_OWNER` 一鍵），不增加格式遷移成本。

**替代方案**：

- 擴充 `.env` 為 `PULL_ALL_URL_<name>=...` — 換機痛點未解，且 key 數量隨 repo 線性增長。
- 另開 `pull-all.repos` git-tracked manifest — 解決換機問題但多一個檔且要自己解析，沒比 `gh` 簡。
- 互動式問 URL → 寫回 manifest — 第一次最痛，且強制 TTY 與 `pull-all clone` 應屬 batch 操作的直覺相違。

### Decision: 單一 owner 政策（`PULL_ALL_OWNER`），名字不可含 `/`

**選擇**：`.env` 加 `PULL_ALL_OWNER=<owner>`，`PULL_ALL_INCLUDE` 仍只放純名字（如 `web,common,note`），名字含 `/` 一律報錯。

**理由**：

- 與 `pull-all init` / 主 `pull-all` 對 repo 名字（純資料夾名）的使用方式一致，掃描與比對邏輯不用改。
- 大多數使用者場景是「同一 GitHub 帳號下的多個個人 repo」，多 owner 屬少數情境。
- 名字含 `/` 留作未來擴充入口（如果有人提出多 owner 需求），現在 fail-fast 避免歧義。

**替代方案**：

- `PULL_ALL_INCLUDE=barney/web,my-org/common` 支援混合 — 更彈性但 init/主流程的「資料夾名」與 clone 的「owner/name」對應變複雜，且本次明確 scope 為單一 owner。

### Decision: `gh` 缺失嚴格報錯，不互動 fallback

**選擇**：`pull-all clone` 啟動時偵測 `gh` 是否存在（`gh --version`）與是否登入（`gh auth status`），任一失敗即印出指引並以 exit code 非 0 結束。

**理由**：

- 維持工具「設定即真相」的單向資料流，避免出現「`.env` 沒指定 owner 但互動補一下也行」這類隱性路徑。
- 互動 fallback 等於把 manifest 路線拉回來，違背 Decision 1。
- 主 `pull-all` 與 `pull-all init` 仍維持零外部相依，`gh` 只是 `clone` 子命令的局部相依，不污染整體。

**替代方案**：

- 缺 `gh` 時 fallback 互動式問 URL 並寫進本機 manifest — 評估後與「外包 URL 給 gh」的核心決策衝突，已排除。

### Decision: 已存在但非 git repo 的目錄跳過警告

**選擇**：clone 目標路徑（`<root>/<name>`）若已存在且不是 git repo，跳過該名字、印警告、繼續處理其餘項目，不覆蓋既有檔案。

**理由**：

- clone 不該有「意外覆蓋本機檔案」的風險，這是不可逆操作。
- 已存在且是 git repo 表示其實「沒缺」，不應出現在缺漏清單裡（前置比對階段就過濾掉）。
- 已存在但不是 git repo 屬使用者本機狀態與 `.env` 設定衝突，由使用者自行處理（刪資料夾或改名）。

### Decision: 並行 clone，沿用既有 `Promise.all`

**選擇**：對所有缺漏 repo 並行執行 `gh repo clone`，結果收集後一次性印出摘要。

**理由**：

- 與既有 `pull` 子命令的並行 fetch / 並行 pull 模式一致。
- 多個 clone 主要瓶頸是網路，並行能明顯縮短總時間。
- 個別失敗（權限、repo 不存在）不影響其他項目，與既有 pull 失敗處理一致。

## Risks / Trade-offs

- **[GitHub-only 限制]** → 在 README 明確標示「`pull-all clone` 需要 `gh` CLI、只支援 GitHub」，主 `pull-all` 仍支援任意 git remote 不受影響。
- **[單一 owner 限制]** → 在 README 明示，名字含 `/` 時 fail 訊息引導使用者目前不支援；未來若需求出現，名字格式有保留空間擴充。
- **[`gh repo clone` 預設行為相依]** → 接受其 protocol 選擇與 clone 行為（含 default branch 等）。若 `gh` 行為日後變更，clone 子命令會跟著走，這是刻意取捨。
- **[資料夾名 ≠ repo 名 的情境]** → 例如 GitHub 上叫 `web-app` 但本機 alias 成 `web`，目前不支援。屬已知限制，靠單一 owner 政策的延伸（資料夾名 = repo 名）規範。
- **[並行 clone 對網路頻寬的影響]** → 與既有並行 fetch 風險同級，未額外限流；若數十個 repo 同時 clone 造成壓力，未來可加 `--concurrency` 旗標。
