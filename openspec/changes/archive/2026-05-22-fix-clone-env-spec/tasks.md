## 1. Spec Alignment

- [x] 1.1 Update `openspec/specs/clone-command/spec.md` so `PULL_ALL_OWNER` is read from the pull-all repo `.env`, not the scan root.
- [x] 1.2 Update the scan-root requirement so `resolveRoot()` controls clone destination only, while `.env` remains tool-owned.

## 2. Verification

- [x] 2.1 Run OpenSpec validation for `fix-clone-env-spec`.
- [x] 2.2 Confirm no application code changes are needed for this change.
