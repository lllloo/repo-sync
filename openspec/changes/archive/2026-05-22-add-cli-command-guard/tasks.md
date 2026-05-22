## 1. Command Dispatch

- [x] 1.1 Add a small command dispatcher for no argument, `init`, `clone`, help aliases, and unknown commands.
- [x] 1.2 Add concise help output for `help`, `--help`, and `-h`.
- [x] 1.3 Ensure unknown commands print an error and exit non-zero before any repo scanning or git/gh command.

## 2. Documentation

- [x] 2.1 Update README command examples to mention help usage if needed.

## 3. Verification

- [x] 3.1 Verify `node --check index.js`.
- [x] 3.2 Verify `node index.js --help` exits 0 without running repo checks.
- [x] 3.3 Verify `node index.js unknown-command` exits non-zero without running repo checks.
- [x] 3.4 Run OpenSpec validation for `add-cli-command-guard`.
