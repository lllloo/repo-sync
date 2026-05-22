## Context

The CLI currently dispatches only `init` and `clone` specially; any other argument falls through to the default sync flow. That means a typo or `--help` can run `git fetch` before the user realizes the command was not recognized.

## Goals / Non-Goals

**Goals:**

- Make command routing explicit for no args, supported subcommands, help flags, and unknown commands.
- Ensure help and unknown commands do not perform repo scanning, `git fetch`, `git pull`, or `gh` checks.
- Keep the zero-dependency CLI shape.

**Non-Goals:**

- No full argument parser.
- No option system for existing commands.
- No changes to `pull-all`, `pull-all init`, or `pull-all clone` behavior beyond dispatch safety.

## Decisions

- Add a small dispatch layer at the bottom of `index.js`.
  Alternative considered: introduce a CLI parser dependency. Rejected because the project is intentionally zero-dependency and this behavior needs only a few exact command checks.

- Treat `help`, `--help`, and `-h` as successful help commands.
  This covers the common spellings without introducing nested help behavior.

- Treat any other first argument as an unknown command and exit non-zero.
  This prevents accidental network/git operations when the user mistypes a subcommand.

## Risks / Trade-offs

- [Risk] A future command name could be blocked by the guard until dispatch is updated. -> Mitigation: command additions should update the routing requirement and dispatch table together.
