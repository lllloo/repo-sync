## 1. Configuration Loading

- [x] 1.1 Replace `pull-all.config.json` loading with `.env` / `process.env.PULL_ALL_INCLUDE` loading.
- [x] 1.2 Parse `PULL_ALL_INCLUDE` as a comma-separated repo name list with trimming and empty-item filtering.
- [x] 1.3 Preserve fallback behavior when no include list is configured or the parsed list is empty.
- [x] 1.4 Keep existing warnings for configured repo names that do not exist or are not git repos.

## 2. Local Files and Documentation

- [x] 2.1 Add `.env` to `.gitignore`.
- [x] 2.2 Add `.env.example` with a sample `PULL_ALL_INCLUDE` value.
- [x] 2.3 Remove tracked `pull-all.config.json` from the project.
- [x] 2.4 Update `README.md` to document `.env`, `PULL_ALL_INCLUDE`, fallback behavior, and migration from `pull-all.config.json`.

## 3. Verification

- [x] 3.1 Run the CLI with no `.env` and verify it falls back to scanning sibling git repos.
- [x] 3.2 Run the CLI with `PULL_ALL_INCLUDE` set and verify it only checks the configured repo names.
- [x] 3.3 Run `openspec status --change use-env-for-repo-include` and confirm the change is apply-ready.
