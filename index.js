#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GRAY = '\x1b[90m';
const BOLD = '\x1b[1m';
const INVERT = '\x1b[7m';

function sh(cmd, dir) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: dir }, (err, stdout, stderr) => {
      resolve({ err, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

function resolveRoot() {
  if (process.env.PULL_ALL_ROOT) return path.resolve(process.env.PULL_ALL_ROOT);
  return path.dirname(process.cwd());
}

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};

  const env = {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (key) env[key] = value;
  }

  return env;
}

function parseIncludeList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);
}

function loadIncludeList() {
  const fileEnv = loadEnvFile();
  const includeValue = process.env.PULL_ALL_INCLUDE || fileEnv.PULL_ALL_INCLUDE;
  return parseIncludeList(includeValue);
}

async function fetchRepo(dir) {
  const { err, stderr } = await sh('git fetch', dir);
  return { ok: !err, stderr };
}

async function isEmptyRepo(dir) {
  const { err } = await sh('git rev-parse --verify --quiet HEAD', dir);
  return !!err;
}

async function getCurrentBranch(dir) {
  const { err, stdout } = await sh('git symbolic-ref --short HEAD', dir);
  if (!err && stdout) return { detached: false, name: stdout };
  const { stdout: sha } = await sh('git rev-parse --short HEAD', dir);
  return { detached: true, sha };
}

async function getDefaultBranch(dir) {
  const { err, stdout } = await sh('git symbolic-ref --short refs/remotes/origin/HEAD', dir);
  if (!err && stdout) {
    const idx = stdout.indexOf('/');
    return idx === -1 ? stdout : stdout.slice(idx + 1);
  }
  const { err: noMain } = await sh('git rev-parse --verify --quiet refs/heads/main', dir);
  if (!noMain) return 'main';
  const { err: noMaster } = await sh('git rev-parse --verify --quiet refs/heads/master', dir);
  if (!noMaster) return 'master';
  return null;
}

async function getAhead(dir, branch) {
  const { err, stdout } = await sh(`git rev-list ${branch} --not --remotes --count`, dir);
  if (err) return 0;
  const n = parseInt(stdout, 10);
  return Number.isFinite(n) ? n : 0;
}

async function hasUpstream(dir, branch) {
  const { err } = await sh(`git rev-parse --verify --quiet ${branch}@{u}`, dir);
  return !err;
}

async function getBehind(dir, branch) {
  if (!(await hasUpstream(dir, branch))) return null;
  const { err, stdout } = await sh(`git rev-list ${branch}..${branch}@{u} --count`, dir);
  if (err) return null;
  const n = parseInt(stdout, 10);
  return Number.isFinite(n) ? n : 0;
}

async function getBranchStatus(dir, branch) {
  const upstream = await hasUpstream(dir, branch);
  const ahead = await getAhead(dir, branch);
  const behind = upstream ? (await getBehind(dir, branch)) ?? 0 : 0;
  return { ahead, behind, hasUpstream: upstream };
}

async function isDirty(dir) {
  const { err, stdout } = await sh('git status --porcelain', dir);
  if (err || !stdout) return false;
  const lines = stdout.split(/\r?\n/).filter(l => l && !l.startsWith('??'));
  return lines.length > 0;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function checkbox(items, preselected = []) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      console.error(`${RED}init 需要互動式終端${RESET}`);
      process.exit(1);
    }

    const selected = new Set(preselected);
    let cursor = 0;

    function render() {
      const lines = items.map((item, i) => {
        const check = selected.has(item) ? 'x' : ' ';
        const line = `  [${check}] ${item}`;
        return i === cursor ? `${INVERT}${line}${RESET}` : line;
      });
      process.stdout.write(lines.join('\n'));
    }

    function redraw() {
      process.stdout.write(`\x1b[${items.length - 1}A\r`);
      render();
    }

    process.stdout.write(`選擇要追蹤的 repo（${BOLD}↑↓${RESET} 移動，${BOLD}Space${RESET} 切換，${BOLD}Enter${RESET} 確認）：\n\n`);
    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function onData(key) {
      if (key === '\x03') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        console.log('已取消。');
        process.exit(0);
      } else if (key === '\x1b[A') {
        cursor = (cursor - 1 + items.length) % items.length;
        redraw();
      } else if (key === '\x1b[B') {
        cursor = (cursor + 1) % items.length;
        redraw();
      } else if (key === '\x20') {
        const item = items[cursor];
        if (selected.has(item)) selected.delete(item);
        else selected.add(item);
        redraw();
      } else if (key === '\r') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n\n');
        resolve([...selected]);
      }
    });
  });
}

function loadOwner() {
  const fileEnv = loadEnvFile();
  const raw = process.env.PULL_ALL_OWNER || fileEnv.PULL_ALL_OWNER || '';
  const owner = raw.trim();
  return owner || null;
}

async function checkGhAvailable() {
  const { err } = await sh('gh --version');
  if (err) {
    console.error(`${RED}找不到 gh CLI。請先安裝：https://cli.github.com/${RESET}`);
    return false;
  }
  return true;
}

async function checkGhAuth() {
  const { err, stderr } = await sh('gh auth status');
  if (err) {
    console.error(`${RED}gh 尚未登入，請執行：gh auth login${RESET}`);
    if (stderr) console.error(`${GRAY}${stderr}${RESET}`);
    return false;
  }
  return true;
}

async function cloneRepo(owner, name, rootDir) {
  const { err, stderr } = await sh(`gh repo clone ${owner}/${name}`, rootDir);
  return { name, ok: !err, stderr };
}

async function checkRepo(target) {
  const { name, fullPath } = target;

  if (await isEmptyRepo(fullPath)) {
    return { name, fullPath, type: 'empty' };
  }

  const fetch = await fetchRepo(fullPath);
  if (!fetch.ok) {
    return { name, fullPath, type: 'fetch-failed', stderr: fetch.stderr };
  }

  const current = await getCurrentBranch(fullPath);
  const defaultBranch = await getDefaultBranch(fullPath);
  const dirty = await isDirty(fullPath);

  let currentStatus = null;
  if (!current.detached) {
    currentStatus = await getBranchStatus(fullPath, current.name);
  }

  let defaultStatus = null;
  const sameAsCurrent = !current.detached && defaultBranch === current.name;
  if (defaultBranch && !sameAsCurrent) {
    defaultStatus = await getBranchStatus(fullPath, defaultBranch);
  }

  return {
    name,
    fullPath,
    type: 'normal',
    current,
    defaultBranch,
    sameAsCurrent,
    noDefault: defaultBranch === null,
    currentStatus,
    defaultStatus,
    dirty,
  };
}

async function pull(fullPath) {
  const { err, stdout, stderr } = await sh('git pull', fullPath);
  return { err, stdout, stderr };
}

function formatBranchSegment({ ahead, behind, dirty }) {
  const parts = [];
  if (ahead > 0) parts.push(`⇡${ahead}`);
  if (behind > 0) parts.push(`⇣${behind}`);
  if (parts.length === 0) parts.push('✓');
  if (dirty) parts.push('*');
  return parts.join(' ');
}

function branchLabel(name, hasUpstream) {
  return hasUpstream ? `(${name})` : `(${name} †)`;
}

function pickColor({ behind, dirty, ahead, hasUpstream }) {
  if (behind > 0) return YELLOW;
  if (dirty || ahead > 0 || !hasUpstream) return '';
  return GRAY;
}

function renderRepo(r, maxNameLen) {
  const pad = (s) => s.padEnd(maxNameLen);
  const blank = ' '.repeat(maxNameLen);

  if (r.type === 'empty') {
    return [`${GRAY}  ${pad(r.name)}  (empty)${RESET}`];
  }
  if (r.type === 'fetch-failed') {
    const out = [`${RED}✗ ${pad(r.name)}  fetch 失敗${RESET}`];
    if (r.stderr) out.push(`  ${r.stderr}`);
    return out;
  }

  const lines = [];

  // 判斷 default / current 是否「有事」
  let defaultHasEvent = false;
  if (r.defaultStatus) {
    const { ahead, behind, hasUpstream } = r.defaultStatus;
    defaultHasEvent = ahead > 0 || behind > 0 || !hasUpstream;
  }

  let currentHasEvent = false;
  if (!r.current.detached && r.currentStatus) {
    const { ahead, behind, hasUpstream } = r.currentStatus;
    currentHasEvent = ahead > 0 || behind > 0 || !hasUpstream || r.dirty;
  }

  // current == default：只列一條
  if (r.sameAsCurrent) {
    const { ahead, behind, hasUpstream } = r.currentStatus;
    const seg = formatBranchSegment({ ahead, behind, dirty: r.dirty });
    const color = pickColor({ behind, dirty: r.dirty, ahead, hasUpstream });
    lines.push(`${color}  ${pad(r.name)}  ${seg}  ${branchLabel(r.current.name, hasUpstream)}${RESET}`);
    return lines;
  }

  // 無 default branch
  if (r.noDefault) {
    lines.push(`${YELLOW}⚠ ${pad(r.name)}  無預設分支${RESET}`);
    if (r.current.detached) {
      lines.push(`  ${blank}  (HEAD@${r.current.sha}, detached)${r.dirty ? ' *' : ''}`);
    } else if (r.currentStatus) {
      const { ahead, behind, hasUpstream } = r.currentStatus;
      const seg = formatBranchSegment({ ahead, behind, dirty: r.dirty });
      const color = pickColor({ behind, dirty: r.dirty, ahead, hasUpstream });
      lines.push(`${color}  ${blank}  ${seg}  ${branchLabel(r.current.name, hasUpstream)}${RESET}`);
    }
    return lines;
  }

  // current ≠ default：兩條都可能要列
  const showCurrent = currentHasEvent;
  const showDefault = defaultHasEvent || !showCurrent;
  let firstLine = true;
  const repoCol = () => (firstLine ? pad(r.name) : blank);

  if (showDefault && r.defaultStatus) {
    const { ahead, behind, hasUpstream } = r.defaultStatus;
    const seg = formatBranchSegment({ ahead, behind, dirty: false });
    const color = pickColor({ behind, dirty: false, ahead, hasUpstream });
    lines.push(`${color}  ${repoCol()}  ${seg}  ${branchLabel(r.defaultBranch, hasUpstream)}${RESET}`);
    firstLine = false;
  }

  if (showCurrent) {
    if (r.current.detached) {
      const dirtyMark = r.dirty ? ' *' : '';
      lines.push(`${GRAY}  ${repoCol()}     (HEAD@${r.current.sha}, detached)${dirtyMark}${RESET}`);
    } else if (r.currentStatus) {
      const { ahead, behind, hasUpstream } = r.currentStatus;
      const seg = formatBranchSegment({ ahead, behind, dirty: r.dirty });
      const color = pickColor({ behind, dirty: r.dirty, ahead, hasUpstream });
      lines.push(`${color}  ${repoCol()}  ${seg}  ${branchLabel(r.current.name, hasUpstream)}${RESET}`);
    }
    firstLine = false;
  }

  return lines;
}

function formatSkippedNames(names) {
  const shown = names.slice(0, 3).join(', ');
  const more = names.length > 3 ? ` +${names.length - 3} more` : '';
  return `${shown}${more}`;
}

async function main() {
  const parentDir = resolveRoot();
  console.log(`${GRAY}root: ${parentDir}${RESET}`);
  const entries = fs.readdirSync(parentDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  const include = loadIncludeList();
  let targets = [];

  if (include.length > 0) {
    for (const name of include) {
      const fullPath = path.join(parentDir, name);
      if (!fs.existsSync(fullPath)) {
        console.log(`${YELLOW}⚠ 找不到 ${name}${RESET}`);
        continue;
      }
      if (!isGitRepo(fullPath)) {
        console.log(`${GRAY}— ${name} 不是 git repo，跳過${RESET}`);
        continue;
      }
      targets.push({ name, fullPath });
    }
  } else {
    targets = entries
      .map(name => ({ name, fullPath: path.join(parentDir, name) }))
      .filter(({ fullPath }) => isGitRepo(fullPath));
  }

  if (targets.length === 0) {
    console.log('找不到任何 git repo。');
    return;
  }

  console.log(`正在檢查 ${targets.length} 個 repo 狀態...\n`);

  const results = await Promise.all(targets.map(checkRepo));

  const maxNameLen = Math.max(...results.map(r => r.name.length));
  for (const r of results) {
    for (const line of renderRepo(r, maxNameLen)) {
      console.log(line);
    }
  }

  const isPullCandidate = (r) =>
    r.type === 'normal'
    && !r.current.detached
    && r.currentStatus
    && r.currentStatus.hasUpstream
    && r.currentStatus.behind > 0;

  const toBePulled = results.filter(r => isPullCandidate(r) && !r.dirty);
  const skippedDirty = results.filter(r => isPullCandidate(r) && r.dirty);

  if (skippedDirty.length > 0) {
    const names = skippedDirty.map(r => r.name);
    console.log(`\n${YELLOW}⊘ 跳過 ${skippedDirty.length} 個 dirty repo: ${formatSkippedNames(names)}${RESET}`);
  }

  if (toBePulled.length === 0) {
    if (skippedDirty.length > 0) {
      console.log(`${GRAY}沒有可 pull 的 repo（dirty 已跳過）。${RESET}`);
    } else {
      console.log(`\n${GREEN}所有 repo 已是最新。${RESET}`);
    }
    return;
  }

  const ans = await ask(`\n${toBePulled.length} 個 repo 需要更新，要 pull 嗎？[y/N] `);

  if (ans.toLowerCase() !== 'y') {
    console.log('已取消。');
    return;
  }

  console.log('');
  const pullResults = await Promise.all(
    toBePulled.map(r => pull(r.fullPath).then(res => ({ name: r.name, ...res })))
  );

  for (const { name, err, stdout, stderr } of pullResults) {
    if (err) {
      console.log(`${RED}✗ ${name}${RESET}`);
      if (stderr) console.log(`  ${stderr}`);
    } else {
      console.log(`${GREEN}✓ ${name}${RESET}`);
      if (stdout && stdout !== 'Already up to date.') console.log(`  ${stdout}`);
    }
  }
}

function updateEnvFile(envPath, key, value) {
  let lines = [];
  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  }

  const keyPrefix = `${key}=`;
  const idx = lines.findIndex(l => l.startsWith(keyPrefix));
  const newLine = `${key}=${value}`;

  if (idx !== -1) {
    lines[idx] = newLine;
  } else {
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines[lines.length - 1] = newLine;
      lines.push('');
    } else {
      lines.push(newLine);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n'));
}

async function runInit() {
  const parentDir = resolveRoot();
  console.log(`${GRAY}root: ${parentDir}${RESET}`);
  const repos = fs.readdirSync(parentDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && isGitRepo(path.join(parentDir, e.name)))
    .map(e => e.name)
    .sort();

  if (repos.length === 0) {
    console.log('找不到任何 git repo。');
    return;
  }

  const envPath = path.join(__dirname, '.env');
  const fileEnv = loadEnvFile();
  const currentInclude = parseIncludeList(process.env.PULL_ALL_INCLUDE || fileEnv.PULL_ALL_INCLUDE);
  const preselected = currentInclude.filter(name => repos.includes(name));

  const chosen = await checkbox(repos, preselected);

  const value = chosen.join(',');
  updateEnvFile(envPath, 'PULL_ALL_INCLUDE', value);

  const display = chosen.length > 0 ? chosen.join(', ') : '（全部）';
  console.log(`${GREEN}✓ 已寫入 ${envPath}${RESET}`);
  console.log(`  PULL_ALL_INCLUDE=${display}`);
}

async function runClone() {
  const rootDir = resolveRoot();
  console.log(`${GRAY}root: ${rootDir}${RESET}`);

  const ghReady = (await checkGhAvailable()) && (await checkGhAuth());
  if (!ghReady) process.exit(1);

  const owner = loadOwner();
  if (!owner) {
    console.error(`${RED}未設定 PULL_ALL_OWNER。請在 .env 加上 PULL_ALL_OWNER=<github-owner>${RESET}`);
    process.exit(1);
  }

  const include = loadIncludeList();
  if (include.length === 0) {
    console.log('.env 未設定 PULL_ALL_INCLUDE，無 repo 可 clone。');
    return;
  }

  const invalid = include.filter(name => name.includes('/'));
  if (invalid.length > 0) {
    console.error(`${RED}目前僅支援單一 owner，名字不可含 /：${invalid.join(', ')}${RESET}`);
    process.exit(1);
  }

  const toClone = [];
  const skipped = [];
  for (const name of include) {
    const fullPath = path.join(rootDir, name);
    if (fs.existsSync(fullPath)) {
      if (!isGitRepo(fullPath)) {
        skipped.push(name);
      }
      continue;
    }
    toClone.push(name);
  }

  for (const name of skipped) {
    console.log(`${YELLOW}⚠ ${name} 已存在但不是 git repo，跳過${RESET}`);
  }

  if (toClone.length === 0) {
    console.log(`${GREEN}所有 repo 都已存在。${RESET}`);
    return;
  }

  console.log(`正在 clone ${toClone.length} 個 repo...\n`);

  const results = await Promise.all(toClone.map(name => cloneRepo(owner, name, rootDir)));

  for (const { name, ok, stderr } of results) {
    if (ok) {
      console.log(`${GREEN}✓ ${name}${RESET}`);
    } else {
      console.log(`${RED}✗ ${name}${RESET}`);
      if (stderr) console.log(`  ${stderr}`);
    }
  }

  if (results.some(r => !r.ok)) process.exit(1);
}

function printHelp(write = console.log) {
  write(`Usage: pull-all [command]

Commands:
  pull-all          檢查兄弟層 git repo，必要時詢問是否 pull
  pull-all init     互動式勾選 repo，寫入 .env
  pull-all clone    clone .env 列了但本機沒有的 repo
  pull-all help     顯示此說明

Options:
  -h, --help        顯示此說明`);
}

function dispatch(cmd) {
  if (!cmd) return main();
  if (cmd === 'init') return runInit();
  if (cmd === 'clone') return runClone();
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return undefined;
  }

  console.error(`${RED}未知指令：${cmd}${RESET}`);
  printHelp(console.error);
  process.exit(1);
}

dispatch(process.argv[2]);
