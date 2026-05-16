# pull-siblings Spec

## Requirements

### Requirement: 掃描兄弟層 git repo
工具 SHALL 掃描父目錄（執行目錄的上一層）下所有子資料夾，找出含有 `.git` 目錄的 repo。

#### Scenario: 找到多個 git repo
- **WHEN** 父目錄下有多個包含 `.git` 的子資料夾
- **THEN** 工具列出並處理所有 git repo，跳過非 git 資料夾

#### Scenario: 沒有任何 git repo
- **WHEN** 父目錄下沒有任何含 `.git` 的子資料夾
- **THEN** 工具顯示「找不到任何 git repo」並結束

### Requirement: 並行執行 git pull
工具 SHALL 對所有偵測到的 git repo 並行執行 `git pull`。

#### Scenario: 所有 repo pull 成功
- **WHEN** 所有 git repo 均可正常 pull
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

### Requirement: 讀取設定檔指定同步清單
工具 SHALL 讀取專案目錄內的 `pull-all.config.json`，若存在則只對 `include` 清單內的 repo 執行 pull。

#### Scenario: 設定檔存在且清單有效
- **WHEN** `pull-all.config.json` 存在且 `include` 陣列包含有效 repo 名稱
- **THEN** 工具只對清單內的 repo 執行 pull，忽略其他兄弟層資料夾

#### Scenario: 設定檔不存在（fallback）
- **WHEN** `pull-all.config.json` 不存在
- **THEN** 工具對所有偵測到的兄弟層 git repo 執行 pull（原本行為）

### Requirement: 處理設定清單中找不到的 repo
工具 SHALL 對 `include` 清單中不存在於父目錄的項目顯示警告，並繼續處理其他 repo。

#### Scenario: 清單中有不存在的 repo
- **WHEN** `include` 內某個名稱在父目錄找不到對應資料夾
- **THEN** 顯示黃色警告「找不到 xxx」，其餘 repo 正常執行，工具不中斷
