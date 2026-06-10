# pull-siblings Spec

## Purpose
對父目錄下所有兄弟層 git repo 並行執行 `git pull`，以 `.env` 的 `SYNC_REPOS` 白名單指定同步清單；未設定時停下並引導執行 `repo-sync init`，不掃描任何 repo。
## Requirements
### Requirement: 掃描兄弟層 git repo
工具 SHALL 以 `path.dirname(__dirname)`（repo-sync 工具 repo 的父目錄）作為固定掃描根目錄，掃描該目錄下所有子資料夾找出含有 `.git` 目錄的 repo。工具 MUST NOT 使用 `process.cwd()` 或環境變數作為掃描根解析依據。`PULL_ALL_ROOT` 環境變數 SHALL NOT 再被讀取。

#### Scenario: 找到多個 git repo
- **WHEN** `path.dirname(__dirname)` 下有多個包含 `.git` 的子資料夾
- **THEN** 工具列出並處理所有 git repo，跳過非 git 資料夾

#### Scenario: 沒有任何 git repo
- **WHEN** `path.dirname(__dirname)` 下沒有任何含 `.git` 的子資料夾
- **THEN** 工具顯示「找不到任何 git repo」並結束

#### Scenario: 無論 cwd 為何，根目錄固定
- **WHEN** 使用者在任意目錄執行 `repo-sync`
- **THEN** 工具永遠掃描 `path.dirname(__dirname)` 底下的子資料夾

### Requirement: 並行執行 git pull
工具 SHALL 在使用者確認後，只對落後 remote 的 repo 並行執行 `git pull`。

#### Scenario: 所有落後 repo pull 成功
- **WHEN** 使用者確認且所有落後 repo 均可正常 pull
- **THEN** 每個 repo 顯示成功狀態，工具以 exit code 0 結束

#### Scenario: 部分 repo pull 失敗
- **WHEN** 某個 repo pull 回傳非 0 exit code
- **THEN** 該 repo 顯示失敗狀態與 stderr 內容，其餘 repo 不受影響繼續執行

### Requirement: 顯示執行結果
工具 SHALL 以清楚的格式顯示每個 repo 的執行結果。

#### Scenario: 成功結果
- **WHEN** `git pull` 成功
- **THEN** 顯示綠色成功標記與 repo 名稱

#### Scenario: 失敗結果
- **WHEN** `git pull` 失敗
- **THEN** 顯示紅色失敗標記、repo 名稱，以及錯誤訊息

#### Scenario: 跳過非 git 資料夾
- **WHEN** 子資料夾不含 `.git`
- **THEN** 顯示灰色跳過標記與資料夾名稱（或完全略過不顯示）

### Requirement: 處理設定清單中找不到的 repo
工具 SHALL 對 `include` 清單中不存在於父目錄的項目顯示警告，並繼續處理其他 repo。

#### Scenario: 清單中有不存在的 repo
- **WHEN** `include` 內某個名稱在父目錄找不到對應資料夾
- **THEN** 顯示黃色警告「找不到 xxx」，其餘 repo 正常執行，工具不中斷

### Requirement: 讀取環境設定指定同步清單
工具 SHALL 讀取 repo-sync repo 根目錄內的 `.env` 或執行環境中的 `SYNC_REPOS`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 以 `__dirname` 為錨點。`PULL_ALL_INCLUDE` SHALL NOT 再被讀取。當 `SYNC_REPOS` 未設定（無值或空值）時，工具 SHALL NOT 掃描全部 repo，而是停下並引導使用者執行 `repo-sync init`。

#### Scenario: 環境設定存在且清單有效
- **WHEN** `.env` 或執行環境中的 `SYNC_REPOS` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在時引導 init
- **WHEN** repo-sync repo 根目錄內無 `.env`、或 `.env` 無 `SYNC_REPOS` 那行、或 `SYNC_REPOS` 為空值，且執行環境亦未設定 `SYNC_REPOS`
- **THEN** 工具不掃描也不 pull 任何 repo，顯示引導訊息建議執行 `repo-sync init` 勾選要追蹤的 repo，並以 exit code 0 結束

