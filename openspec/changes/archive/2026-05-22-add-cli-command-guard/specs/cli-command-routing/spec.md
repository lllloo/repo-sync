## ADDED Requirements

### Requirement: CLI command dispatch
系統 SHALL 根據第一個 CLI argument 明確選擇流程。未帶 argument 時 SHALL 執行主要 pull 流程；`init` SHALL 執行初始化流程；`clone` SHALL 執行 clone 流程；help 指令 SHALL 顯示說明；未知指令 MUST 在任何 repo 掃描、`git fetch`、`git pull`、或 `gh` 檢查前停止。

#### Scenario: 未帶 argument
- **WHEN** 使用者執行 `pull-all`
- **THEN** 系統執行主要 pull 流程

#### Scenario: init command
- **WHEN** 使用者執行 `pull-all init`
- **THEN** 系統執行初始化流程

#### Scenario: clone command
- **WHEN** 使用者執行 `pull-all clone`
- **THEN** 系統執行 clone 流程

#### Scenario: help command
- **WHEN** 使用者執行 `pull-all help`、`pull-all --help`、或 `pull-all -h`
- **THEN** 系統顯示 CLI 用法並以 exit code 0 結束，且不執行 repo 掃描、`git fetch`、`git pull`、或 `gh` 檢查

#### Scenario: unknown command
- **WHEN** 使用者執行未支援的子命令，例如 `pull-all typo`
- **THEN** 系統顯示未知指令錯誤與簡短用法，並以非 0 exit code 結束，且不執行 repo 掃描、`git fetch`、`git pull`、或 `gh` 檢查
