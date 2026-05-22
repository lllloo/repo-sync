## Why

Unknown CLI arguments currently fall through to the main sync flow, so commands like `pull-all --help` or `pull-all typo` can unexpectedly fetch repos and prompt for pull. The CLI should fail or display help before doing network or git work.

## What Changes

- Add explicit handling for `help`, `--help`, and `-h`.
- Add an unknown-command guard that prints a concise error and exits non-zero.
- Keep existing no-argument, `init`, and `clone` behavior unchanged.

## Capabilities

### New Capabilities

- `cli-command-routing`: command dispatch behavior for supported, help, and unknown CLI arguments.

### Modified Capabilities

- None.

## Impact

- Affected code: `index.js`
- Affected docs: README command usage if implementation adds user-facing help text
- Dependencies: none
