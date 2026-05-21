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
  const envPath = path.join(resolveRoot(), '.env');
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

async function getStatus(dir) {
  const { err, stdout } = await sh('git rev-list HEAD..@{u} --count', dir);
  if (err) return { type: 'no-tracking' };
  const behind = parseInt(stdout, 10);
  return { type: behind > 0 ? 'behind' : 'uptodate', behind };
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

async function checkAndPull(target) {
  const { name, fullPath } = target;
  const fetch = await fetchRepo(fullPath);
  if (!fetch.ok) return { name, fullPath, type: 'fetch-failed', stderr: fetch.stderr };
  const status = await getStatus(fullPath);
  return { name, fullPath, ...status };
}

async function pull(fullPath) {
  const { err, stdout, stderr } = await sh('git pull', fullPath);
  return { err, stdout, stderr };
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

  const results = await Promise.all(targets.map(checkAndPull));

  // 顯示摘要
  const maxNameLen = Math.max(...results.map(r => r.name.length));
  const pad = (name) => name.padEnd(maxNameLen);
  for (const r of results) {
    if (r.type === 'fetch-failed') {
      console.log(`${RED}✗ ${pad(r.name)}  fetch 失敗${RESET}`);
      if (r.stderr) console.log(`  ${r.stderr}`);
    } else if (r.type === 'no-tracking') {
      console.log(`${YELLOW}⚠ ${pad(r.name)}  無追蹤分支${RESET}`);
    } else if (r.type === 'behind') {
      console.log(`${YELLOW}  ${pad(r.name)}  ${r.behind} commit${r.behind > 1 ? 's' : ''} behind${RESET}`);
    } else {
      console.log(`${GRAY}  ${pad(r.name)}  up to date${RESET}`);
    }
  }

  const toBePulled = results.filter(r => r.type === 'behind');

  if (toBePulled.length === 0) {
    console.log(`\n${GREEN}所有 repo 已是最新。${RESET}`);
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

  const envPath = path.join(parentDir, '.env');
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

const cmd = process.argv[2];
if (cmd === 'init') runInit();
else if (cmd === 'clone') runClone();
else main();
