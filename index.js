#!/usr/bin/env node

const { execFile } = require('child_process');
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

// 以參數陣列經 execFile 執行，繞過 shell 解析——repo/branch 名等可控字串放進
// args 不會被 cmd.exe / sh 當元字元解析，徹底消除命令注入（C-5）。
// maxBuffer 提高至 64MB，避免大量 fetch/pull/status 輸出被截斷誤判失敗（C-7）。
function run(file, args, dir) {
  return new Promise((resolve) => {
    execFile(file, args, { cwd: dir, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ err, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

const resolveRoot = () => path.dirname(__dirname);

let _env = null;
function loadEnv() {
  if (_env) return _env;
  _env = {};
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return _env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    // 容忍 `export KEY=` 前綴（C-4）
    let key = trimmed.slice(0, eq).trim();
    if (key.startsWith('export ')) key = key.slice('export '.length).trim();
    // 重複 key 採「先到先得」，與 updateEnvFile 改寫第一筆的語意一致（C-2）
    if (key && !(key in _env)) _env[key] = stripQuotes(trimmed.slice(eq + 1).trim());
  }
  return _env;
}

// 前後為成對的引號（同為 " 或同為 '）時剝除一層，避免誤剝單邊或值內引號（C-3）
function stripQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' || first === "'") && first === last) {
      return value.slice(1, -1);
    }
  }
  return value;
}

const env = (k) => process.env[k] || loadEnv()[k] || null;

function parseInclude(value) {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function parseStatus(stdout) {
  const lines = stdout.split('\n');
  const hdr = {};
  for (const line of lines) {
    if (!line.startsWith('# ')) break;
    const sp = line.indexOf(' ', 2);
    const key = line.slice(2, sp);
    hdr[key] = line.slice(sp + 1);
  }
  const headName = hdr['branch.head'];
  const detached = headName === '(detached)';
  const sha = (hdr['branch.oid'] || '').slice(0, 7);
  const hasUpstream = 'branch.upstream' in hdr;
  let ahead = 0, behind = 0;
  const ab = hdr['branch.ab'];
  if (ab) {
    const m = ab.match(/\+(\d+) -(\d+)/);
    if (m) { ahead = +m[1]; behind = +m[2]; }
  }
  const dirty = lines.some(l => /^[12u] /.test(l));
  return { detached, name: detached ? null : headName, sha, hasUpstream, ahead, behind, dirty };
}

async function getDefaultBranch(dir) {
  const { err, stdout } = await run('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], dir);
  if (!err && stdout) {
    const idx = stdout.indexOf('/');
    const name = idx === -1 ? stdout : stdout.slice(idx + 1);
    const { err: noLocal } = await run('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`], dir);
    return { name, localExists: !noLocal };
  }
  const { err: noMain } = await run('git', ['rev-parse', '--verify', '--quiet', 'refs/heads/main'], dir);
  if (!noMain) return { name: 'main', localExists: true };
  const { err: noMaster } = await run('git', ['rev-parse', '--verify', '--quiet', 'refs/heads/master'], dir);
  if (!noMaster) return { name: 'master', localExists: true };
  return null;
}

async function getBranchStatus(dir, branch, localExists = true) {
  // 三條 return 一律帶齊 { ahead, behind, hasUpstream, localMissing }，呼叫端不靠 undefined 隱性語意（Q-3）
  if (!localExists) return { ahead: 0, behind: 0, hasUpstream: false, localMissing: true };
  const upstreamRes = await run('git', ['rev-parse', '--verify', '--quiet', `${branch}@{u}`], dir);
  const hasUpstream = !upstreamRes.err;
  if (!hasUpstream) {
    const { stdout } = await run('git', ['rev-list', branch, '--not', '--remotes', '--count'], dir);
    return { ahead: parseInt(stdout, 10) || 0, behind: 0, hasUpstream, localMissing: false };
  }
  const [aheadRes, behindRes] = await Promise.all([
    run('git', ['rev-list', `${branch}@{u}..${branch}`, '--count'], dir),
    run('git', ['rev-list', `${branch}..${branch}@{u}`, '--count'], dir),
  ]);
  const ahead = parseInt(aheadRes.stdout, 10) || 0;
  const behind = parseInt(behindRes.stdout, 10) || 0;
  return { ahead, behind, hasUpstream, localMissing: false };
}

async function checkRepo({ name, fullPath }) {
  const { err: emptyErr } = await run('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], fullPath);
  if (emptyErr) return { name, fullPath, type: 'empty' };

  const { err: fetchErr, stderr } = await run('git', ['fetch'], fullPath);
  if (fetchErr) return { name, fullPath, type: 'fetch-failed', stderr };

  const [statusRes, defaultBranchInfo] = await Promise.all([
    run('git', ['status', '--porcelain=v2', '--branch'], fullPath),
    getDefaultBranch(fullPath),
  ]);

  if (statusRes.err) return { name, fullPath, type: 'fetch-failed', stderr: statusRes.stderr };

  const current = parseStatus(statusRes.stdout);

  // current ahead 的單一權威來源：依 status-check spec line 144-145，非 detached 時
  // 一律以 `git rev-list <current> --not --remotes --count`（不在任何 remote 的 commit 數）
  // 覆寫 ahead。此語意同時涵蓋有/無 upstream，不需分支邏輯——既根治無 upstream 時
  // porcelain 不輸出 branch.ab 而落 0（N-1），也根治 upstream config 殘留但 remote-tracking
  // ref 已不存在（遠端 branch 被刪、本機未 prune）時 porcelain 印 branch.upstream 卻無
  // branch.ab、ahead 落 0 而誤報同步（O-1）。behind 仍取自 porcelain branch.ab
  // （--not --remotes 算不出 behind）。detached 時 current.name 為 null，短路不呼叫。
  if (!current.detached) {
    const { stdout } = await run('git', ['rev-list', current.name, '--not', '--remotes', '--count'], fullPath);
    current.ahead = parseInt(stdout, 10) || 0;
  }

  const defaultBranch = defaultBranchInfo ? defaultBranchInfo.name : null;
  const sameAsCurrent = !current.detached && defaultBranch === current.name;

  let defaultStatus = null;
  if (defaultBranchInfo && !sameAsCurrent) {
    defaultStatus = await getBranchStatus(fullPath, defaultBranchInfo.name, defaultBranchInfo.localExists);
  }

  return {
    name,
    fullPath,
    type: 'normal',
    current,
    defaultBranch,
    sameAsCurrent,
    noDefault: defaultBranch === null,
    currentStatus: current.detached ? null : {
      ahead: current.ahead,
      behind: current.behind,
      hasUpstream: current.hasUpstream,
    },
    defaultStatus,
    dirty: current.dirty,
  };
}

async function pull(fullPath) {
  const { err, stdout, stderr } = await run('git', ['pull'], fullPath);
  return { err, stdout, stderr };
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
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      console.error(`${RED}init 需要互動式終端${RESET}`);
      process.exit(1);
    }

    const selected = new Set(preselected);
    let cursor = 0;

    function render() {
      const lines = items.map((item, i) => {
        const check = selected.has(item) ? 'x' : ' ';
        const indent = item.includes('/') ? '  ' : '';
        const line = `  [${check}] ${indent}${item}`;
        return i === cursor ? `${INVERT}${line}${RESET}` : line;
      });
      process.stdout.write(lines.join('\n'));
    }

    function redraw() {
      // 上移「清單行數 - 1」回到首行；單項清單時為 0，\x1b[0A 會被視為上移 1 行
      // 而蓋掉提示文字，故僅在 > 0 時送 CUU，否則只 \r 回行首重畫該行（Q-4）。
      const up = items.length - 1;
      if (up > 0) process.stdout.write(`\x1b[${up}A`);
      process.stdout.write('\r');
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

// 一般 branch 行的共用渲染（current 與 default 三處共用）（Q-1）。
// status 須帶 { ahead, behind, hasUpstream, localMissing? }；localMissing 走「本機無此分支」特例。
function renderBranchLine({ col, status, dirty, name }) {
  if (status.localMissing) {
    return `${GRAY}  ${col}  (本機無此分支)  (${name})${RESET}`;
  }
  const { ahead, behind, hasUpstream } = status;
  const seg = formatBranchSegment({ ahead, behind, dirty });
  const color = pickColor({ behind, dirty, ahead, hasUpstream });
  return `${color}  ${col}  ${seg}  ${branchLabel(name, hasUpstream)}${RESET}`;
}

// detached HEAD 行的共用渲染，兩條路徑統一縮排（branch 欄對齊 segment 欄）（Q-2）。
function renderDetachedLine(col, sha, dirty) {
  return `  ${col}  (HEAD@${sha}, detached)${dirty ? ' *' : ''}`;
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

  let defaultHasEvent = false;
  if (r.defaultStatus) {
    const { ahead, behind, hasUpstream, localMissing } = r.defaultStatus;
    defaultHasEvent = localMissing || ahead > 0 || behind > 0 || !hasUpstream;
  }

  // detached 視為「永遠要顯示」的事件：detached 行承載 sha 與 dirty `*`，
  // 不可在 default 存在路徑被吞掉（C-1）。
  let currentHasEvent = false;
  if (r.current.detached) {
    currentHasEvent = true;
  } else if (r.currentStatus) {
    const { ahead, behind, hasUpstream } = r.currentStatus;
    currentHasEvent = ahead > 0 || behind > 0 || !hasUpstream || r.dirty;
  }

  if (r.sameAsCurrent) {
    lines.push(renderBranchLine({
      col: pad(r.name), status: r.currentStatus, dirty: r.dirty, name: r.current.name,
    }));
    return lines;
  }

  if (r.noDefault) {
    lines.push(`${YELLOW}⚠ ${pad(r.name)}  無預設分支${RESET}`);
    if (r.current.detached) {
      lines.push(renderDetachedLine(blank, r.current.sha, r.dirty));
    } else if (r.currentStatus) {
      lines.push(renderBranchLine({
        col: blank, status: r.currentStatus, dirty: r.dirty, name: r.current.name,
      }));
    }
    return lines;
  }

  const showCurrent = currentHasEvent;
  const showDefault = defaultHasEvent || !showCurrent;
  let firstLine = true;
  const repoCol = () => (firstLine ? pad(r.name) : blank);

  if (showDefault && r.defaultStatus) {
    lines.push(renderBranchLine({
      col: repoCol(), status: r.defaultStatus, dirty: false, name: r.defaultBranch,
    }));
    firstLine = false;
  }

  if (showCurrent) {
    if (r.current.detached) {
      lines.push(renderDetachedLine(repoCol(), r.current.sha, r.dirty));
    } else if (r.currentStatus) {
      lines.push(renderBranchLine({
        col: repoCol(), status: r.currentStatus, dirty: r.dirty, name: r.current.name,
      }));
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

function updateEnvFile(envPath, key, value) {
  let lines = [];
  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  }

  const keyPrefix = `${key}=`;
  // 與 loadEnv 對稱辨識 `KEY=` 與 `export KEY=` 兩種形式，避免改寫後殘留的 export 舊行
  // 被 loadEnv「先到先得」讀回（審核 A）
  const matchesKey = (l) => {
    const t = l.trim();
    const body = t.startsWith('export ') ? t.slice('export '.length).trimStart() : t;
    return body.startsWith(keyPrefix);
  };
  const idx = lines.findIndex(matchesKey);
  const newLine = `${key}=${value}`;

  if (idx !== -1) {
    lines[idx] = newLine;
    // 移除其餘同名行（含 export 形式），避免 loadEnv「先到先得」讀到後方殘留的舊值（C-2 / 審核 A）
    lines = lines.filter((l, i) => i === idx || !matchesKey(l));
  } else {
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines[lines.length - 1] = newLine;
      lines.push('');
    } else {
      lines.push(newLine);
    }
  }

  try {
    fs.writeFileSync(envPath, lines.join('\n'));
  } catch (e) {
    console.error(`${RED}✗ 無法寫入 ${envPath}：${e.message}${RESET}`);
    process.exit(1);
  }
}

async function main() {
  const parentDir = resolveRoot();
  console.log(`${GRAY}root: ${parentDir}${RESET}`);

  const include = parseInclude(env('SYNC_REPOS'));
  if (include.length === 0) {
    console.log(`${YELLOW}⚠ 尚未設定要追蹤的 repo。${RESET}`);
    console.log(`  請執行 ${BOLD}repo-sync init${RESET} 勾選，或在 .env 設定 SYNC_REPOS=repo1,repo2`);
    return;
  }

  const targets = [];
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

async function runInit() {
  const parentDir = resolveRoot();
  console.log(`${GRAY}root: ${parentDir}${RESET}`);

  const entries = fs.readdirSync(parentDir, { withFileTypes: true }).filter(e => e.isDirectory());
  const repos = [];
  for (const e of entries) {
    const fullPath = path.join(parentDir, e.name);
    if (!isGitRepo(fullPath)) continue;
    repos.push(e.name);
    try {
      const children = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(c => c.isDirectory() && isGitRepo(path.join(fullPath, c.name)));
      for (const child of children) repos.push(`${e.name}/${child.name}`);
    } catch (_) {}
  }
  repos.sort();

  if (repos.length === 0) {
    console.log('找不到任何 git repo。');
    return;
  }

  const envPath = path.join(__dirname, '.env');
  const preselected = parseInclude(env('SYNC_REPOS')).filter(name => repos.includes(name));

  const chosen = await checkbox(repos, preselected);

  if (chosen.length === 0) {
    console.log(`${YELLOW}未選任何 repo，已取消。${RESET}`);
    return;
  }

  updateEnvFile(envPath, 'SYNC_REPOS', chosen.join(','));
  console.log(`${GREEN}✓ 已寫入 ${envPath}${RESET}`);
  console.log(`  SYNC_REPOS=${chosen.join(', ')}`);
}

// GitHub repo 名（含 parent/child 巢狀分隔）白名單：每段僅允許英數與 . _ -，且不以 - 開頭。
// 阻擋以 - 開頭的名稱被 gh/git 當成選項旗標（argument injection 防禦深度；shell 注入已由 execFile 消除）（審核 B）。
// 另逐段拒絕 `.` 與 `..`：原字元集允許 `.` 開頭，故 `../x` 這類段能通過字元檢查，
// path.join 會解析成跳出 root 的目錄（path traversal 防禦深度）（審核 C）。
const isValidRepoName = (n) => {
  if (typeof n !== 'string' || n === '') return false;
  return n.split('/').every(
    (s) => s !== '.' && s !== '..' && /^[A-Za-z0-9_.][A-Za-z0-9._-]*$/.test(s)
  );
};

async function runClone() {
  const rootDir = resolveRoot();
  console.log(`${GRAY}root: ${rootDir}${RESET}`);

  const { err: ownerErr, stdout: ownerOut, stderr: ownerStderr } = await run('gh', ['api', 'user', '--jq', '.login']);
  if (ownerErr) {
    console.error(`${RED}無法取得 GitHub 帳號。請確認 gh CLI 已安裝並執行：gh auth login${RESET}`);
    if (ownerStderr) console.error(`${GRAY}${ownerStderr}${RESET}`);
    process.exit(1);
  }
  const owner = ownerOut;

  const include = parseInclude(env('SYNC_REPOS'));
  if (include.length === 0) {
    console.log(`${YELLOW}尚未設定要追蹤的 repo，請先執行 repo-sync init 勾選。${RESET}`);
    return;
  }

  const toClone = [];
  const skipped = [];
  const invalid = [];
  for (const name of include) {
    if (!isValidRepoName(name)) {
      invalid.push(name);
      continue;
    }
    const fullPath = path.join(rootDir, name);
    if (fs.existsSync(fullPath)) {
      if (!isGitRepo(fullPath)) skipped.push(name);
      continue;
    }
    toClone.push(name);
  }

  for (const name of invalid) {
    console.log(`${YELLOW}⚠ ${name} 含不合法字元，跳過（僅允許英數與 . _ - / 且各段不以 - 開頭）${RESET}`);
  }
  for (const name of skipped) {
    console.log(`${YELLOW}⚠ ${name} 已存在但不是 git repo，跳過${RESET}`);
  }

  if (toClone.length === 0) {
    console.log(`${GREEN}所有 repo 都已存在。${RESET}`);
    return;
  }

  console.log(`正在 clone ${toClone.length} 個 repo...\n`);

  const results = await Promise.all(
    toClone.map(async (name) => {
      const segments = name.split('/');
      const repoName = segments[segments.length - 1];
      const cloneDir = segments.length > 1
        ? path.join(rootDir, ...segments.slice(0, -1))
        : rootDir;
      if (segments.length > 1) {
        try {
          fs.mkdirSync(cloneDir, { recursive: true });
        } catch (e) {
          return { name, ok: false, stderr: `無法建立目錄 ${cloneDir}：${e.message}` };
        }
      }
      const { err, stderr } = await run('gh', ['repo', 'clone', `${owner}/${repoName}`], cloneDir);
      return { name, ok: !err, stderr };
    })
  );

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
  write(`Usage: repo-sync [command]

Commands:
  repo-sync          檢查兄弟層 git repo，必要時詢問是否 pull
  repo-sync init     互動式勾選 repo，寫入 .env
  repo-sync clone    clone .env 列了但本機沒有的 repo
  repo-sync help     顯示此說明

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
