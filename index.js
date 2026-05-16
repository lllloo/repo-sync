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

function loadConfig() {
  const configPath = path.join(__dirname, 'pull-all.config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    console.error(`${YELLOW}⚠ 無法解析 pull-all.config.json${RESET}`);
    return null;
  }
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

async function checkAndPull(target) {
  const { name, fullPath } = target;
  const fetch = await fetchRepo(fullPath);
  if (!fetch.ok) return { name, state: 'fetch-failed', stderr: fetch.stderr };
  const status = await getStatus(fullPath);
  return { name, fullPath, ...status };
}

async function pull(fullPath) {
  const { err, stdout, stderr } = await sh('git pull', fullPath);
  return { err, stdout, stderr };
}

async function main() {
  const parentDir = path.resolve(__dirname, '..');
  const entries = fs.readdirSync(parentDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  const config = loadConfig();
  let targets = [];

  if (config && Array.isArray(config.include)) {
    for (const name of config.include) {
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
  for (const r of results) {
    if (r.state === 'fetch-failed') {
      console.log(`${RED}✗ ${r.name}  fetch 失敗${RESET}`);
      if (r.stderr) console.log(`  ${r.stderr}`);
    } else if (r.type === 'no-tracking') {
      console.log(`${YELLOW}⚠ ${r.name}  無追蹤分支${RESET}`);
    } else if (r.type === 'behind') {
      console.log(`${YELLOW}  ${r.name}  ${r.behind} commit${r.behind > 1 ? 's' : ''} behind${RESET}`);
    } else {
      console.log(`${GRAY}  ${r.name}  up to date${RESET}`);
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

main();
