## Context

The project intentionally separates two concepts:

- scan root: where sibling repos are discovered and cloned
- tool config: `.env` stored beside `index.js` in the pull-all repo

`pull-siblings`, README, and `index.js` already reflect this split. `clone-command` still contains wording from the earlier scan-root `.env` design, so this change updates the spec contract only.

## Goals / Non-Goals

**Goals:**

- Align `clone-command` requirements with the current `loadEnvFile()` / `loadOwner()` behavior.
- Make it clear that `PULL_ALL_ROOT` affects repo discovery and clone destination, not `.env` location.

**Non-Goals:**

- No application code changes.
- No config format changes.
- No change to clone command UX or `gh` usage.

## Decisions

- Keep `.env` anchored to the pull-all repo root.
  Alternative considered: move clone config back to scan root. Rejected because it would conflict with the already-archived env-back-to-repo decision and current README.

- Update existing `clone-command` requirements instead of adding a new capability.
  The behavior is already part of `clone-command`; the problem is stale requirement text, not a new feature.

## Risks / Trade-offs

- [Risk] Specs can still drift if future config-location decisions touch only one capability. -> Mitigation: explicitly mention that clone uses the same tool-owned `.env` rule as `PULL_ALL_INCLUDE`.
