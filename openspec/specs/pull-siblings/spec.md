# pull-siblings Spec

## Purpose
對父目錄下所有兄弟層 git repo 並行執行 `git pull`，支援以 `.env` 白名單篩選同步清單，無設定時 fallback 為掃描全部 repo。
## Requirements
### Requirement: 掃描兄弟層 git repo
工具 SHALL 依下列優先序解析掃描根目錄，並掃描該目錄下所有子資料夾找出含有 `.git` 目錄的 repo：(1) 若 `PULL_ALL_ROOT` 環境變數有值，使用該路徑作為掃描根；(2) 否則使用 `process.cwd()` 的父目錄。工具 MUST NOT 使用 source 檔案位置（如 `__dirname`）作為解析依據。

#### Scenario: 找到多個 git repo
- **WHEN** 解析後的掃描根目錄下有多個包含 `.git` 的子資料夾
- **THEN** 工具列出並處理所有 git repo，跳過非 git 資料夾

#### Scenario: 沒有任何 git repo
- **WHEN** 解析後的掃描根目錄下沒有任何含 `.git` 的子資料夾
- **THEN** 工具顯示「找不到任何 git repo」並結束

#### Scenario: 使用 PULL_ALL_ROOT 覆寫
- **WHEN** 執行環境設定 `PULL_ALL_ROOT=/some/path`
- **THEN** 工具直接掃描 `/some/path` 底下的子資料夾，不再取 cwd 父目錄

#### Scenario: 預設使用 cwd 父目錄
- **WHEN** 未設定 `PULL_ALL_ROOT`，使用者在 `~/code/web/` 執行 `pull-all`
- **THEN** 工具掃描 `~/code/` 底下的子資料夾

#### Scenario: 全域指令在任意目錄執行
- **WHEN** 使用者 `npm link` 後在任意目錄執行 `pull-all`
- **THEN** 工具依 cwd 父目錄（或 `PULL_ALL_ROOT`）解析掃描根，不再指向 npm global lib 目錄

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
工具 SHALL 讀取 pull-all repo 根目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE`，若存在且包含 repo 名稱，則只對該清單內的 repo 執行 pull。`.env` 位置 MUST 以 `__dirname`（pull-all repo 根目錄）為錨點，不跟隨掃描根目錄或 cwd，亦不從掃描根目錄讀取。

#### Scenario: 環境設定存在且清單有效
- **WHEN** pull-all repo 根目錄內的 `.env` 或執行環境中的 `PULL_ALL_INCLUDE` 包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 環境設定不存在（fallback）
- **WHEN** pull-all repo 根目錄內無 `.env` 且執行環境未設定 `PULL_ALL_INCLUDE`
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: 環境設定為空（fallback）
- **WHEN** `PULL_ALL_INCLUDE` 不存在或解析後沒有任何 repo 名稱
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

#### Scenario: init 寫入位置為 pull-all repo 根目錄
- **WHEN** 使用者執行 `pull-all init`
- **THEN** 工具將 `PULL_ALL_INCLUDE` 寫入 pull-all repo 根目錄下的 `.env`（以 `__dirname` 解析），而非掃描根目錄

#### Scenario: 從不同 cwd 呼叫時 `.env` 位置一致
- **WHEN** 使用者以 `npm link` 後在任意目錄、或從 pull-all repo 外以絕對路徑呼叫 `pull-all`
- **THEN** 工具仍從同一處（pull-all repo 根目錄）讀寫 `.env`，不隨 cwd 飄移

#### Scenario: `.env` 位置與掃描根目錄解耦
- **WHEN** 使用者設定 `PULL_ALL_ROOT=/some/other/path`
- **THEN** 工具掃描 `/some/other/path` 底下的子資料夾，但 `.env` 仍從 pull-all repo 根目錄讀取

