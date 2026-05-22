## Why

`clone-command` spec still says `PULL_ALL_OWNER` and `.env` are read from the scan root, but the current implementation and README define `.env` as belonging to the pull-all tool repo. This creates a stale contract that can mislead future changes back toward the older behavior.

## What Changes

- Update `clone-command` requirements so clone reads `.env` from the pull-all repo root, using the same `__dirname` anchor as `PULL_ALL_INCLUDE`.
- Clarify that scan root resolution is still only for locating and cloning sibling repos.
- No runtime behavior change is intended.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `clone-command`: align `.env` / `PULL_ALL_OWNER` requirements with current tool-owned config behavior.

## Impact

- Affected artifacts: `openspec/specs/clone-command/spec.md`
- Affected code: none expected
- Dependencies: none
