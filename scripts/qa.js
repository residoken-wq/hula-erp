/*
 * QA runner.
 *   npm run qa          → chỉ kiểm phần bị thay đổi so với origin/main (commit + chưa commit + file mới)
 *   npm run qa:full     → kiểm toàn bộ (dùng trước khi merge vào main)
 *   node scripts/qa.js --base <ref>   → so với ref khác
 *   node scripts/qa.js --verbose      → in toàn bộ log (mặc định chỉ in 1 dòng/bước, log lỗi rút gọn)
 *
 * Thay đổi 2026-09-28 (Chủ dự án: giảm thời gian + log):
 *  - Chỉ chạy bước nặng (tsc/lint/build/jest) cho workspace có file thay đổi.
 *  - Typecheck vẫn chạy cả project, nhưng ở chế độ "changed" chỉ FAIL khi lỗi nằm trong file đã thay đổi
 *    (lỗi cũ có sẵn ở file khác không chặn). qa:full thì FAIL với mọi lỗi mới so với baseline cho phép.
 *  - Lint chỉ chạy trên file thay đổi. Jest dùng --findRelatedTests.
 *  - Các workspace chạy song song, output được gom lại.
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const C = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m' };
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const FULL = args.includes('--full');
const VERBOSE = args.includes('--verbose');
const baseIdx = args.indexOf('--base');
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : 'origin/main';

// Lỗi typecheck có sẵn từ trước, được phép ở chế độ --full (không phải do nhánh hiện tại gây ra).
// Chỉ thêm vào đây khi Claude/Chủ dự án đồng ý; mục tiêu là danh sách rỗng.
const KNOWN_TS_ERRORS = {
  // Frontend: 46 lỗi có sẵn trên main 2026-09-28 (28 ở UnifiedDesignWorkflow.tsx; 1 ở pages/chatbot/ChatbotInboxPage.tsx — P3 sửa).
  // Trước đây QA dùng vite build (không kiểm type) nên không thấy. Giảm số này mỗi khi sửa được lỗi.
  'Frontend (Admin)': 46,
};

const WS = [
  { name: 'Backend', dir: '.', match: (f) => /^(src|test)\//.test(f) || /^(package\.json|tsconfig[^/]*\.json|nest-cli\.json)$/.test(f), tsc: 'npx tsc --noEmit -p tsconfig.json', lint: 'eslint', exts: /\.ts$/ },
  { name: 'Frontend (Admin)', dir: 'frontend', match: (f) => f.startsWith('frontend/'), tsc: 'npx tsc --noEmit -p tsconfig.json', lint: null, exts: /\.(ts|tsx)$/, buildOnFull: 'npm run build' },
  { name: 'CMS', dir: 'hula-web/cms', match: (f) => f.startsWith('hula-web/cms/'), tsc: 'npx tsc --noEmit', lint: 'next', exts: /\.(ts|tsx)$/ },
  { name: 'Website', dir: 'hula-web/website', match: (f) => f.startsWith('hula-web/website/'), tsc: 'npx tsc --noEmit', lint: 'next', exts: /\.(ts|tsx)$/ },
];

function git(cmd) {
  try { return execSync(`git ${cmd}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}

function changedFiles() {
  const mb = git(`merge-base HEAD ${BASE}`) || BASE;
  const set = new Set();
  for (const out of [git(`diff --name-only ${mb}...HEAD`), git('diff --name-only HEAD'), git('ls-files --others --exclude-standard')]) {
    for (const l of out.split(/\r?\n/)) if (l.trim()) set.add(l.trim().replace(/\\/g, '/'));
  }
  return [...set].filter((f) => fs.existsSync(path.join(ROOT, f)) || true);
}

function run(cmd, cwd) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(cmd, { cwd, shell: true });
    let out = '';
    child.stdout.on('data', (d) => { out += d; if (VERBOSE) process.stdout.write(d); });
    child.stderr.on('data', (d) => { out += d; if (VERBOSE) process.stderr.write(d); });
    child.on('close', (code) => resolve({ code, out, ms: Date.now() - t0 }));
    child.on('error', (e) => resolve({ code: 1, out: String(e), ms: Date.now() - t0 }));
  });
}

const results = [];
function record(step, ok, ms, detail) {
  results.push({ step, ok, ms, detail });
  const tag = ok === null ? `${C.yellow}SKIP` : ok ? `${C.green}PASS` : `${C.red}FAIL`;
  console.log(`${tag}${C.reset}  ${step}${ms != null ? ` (${(ms / 1000).toFixed(1)}s)` : ''}${detail ? ` — ${detail}` : ''}`);
}
const tail = (s, n = 30) => s.split(/\r?\n/).filter((l) => l.trim()).slice(-n).join('\n');

// tsc errors: "path/file.ts(12,3): error TS1234: ..." (path tương đối theo cwd của workspace)
function tsErrors(out, wsDir) {
  const errs = [];
  for (const l of out.split(/\r?\n/)) {
    const m = l.match(/^(.+?)\(\d+,\d+\): error TS\d+/);
    if (m) errs.push({ file: path.posix.join(wsDir === '.' ? '' : wsDir, m[1].replace(/\\/g, '/')).replace(/^\//, ''), line: l.trim() });
  }
  return errs;
}

async function checkWorkspace(ws, files) {
  const cwd = path.join(ROOT, ws.dir);
  if (!fs.existsSync(path.join(cwd, 'node_modules'))) {
    record(`${ws.name}: node_modules`, false, null, `chưa cài — chạy npm install trong ${ws.dir}`);
    return;
  }
  const mine = files.filter((f) => ws.exts.test(f) && fs.existsSync(path.join(ROOT, f)));

  // 1. Typecheck
  const t = await run(ws.tsc, cwd);
  const errs = tsErrors(t.out, ws.dir);
  if (FULL) {
    const allowed = KNOWN_TS_ERRORS[ws.name] || 0;
    const crashed = t.code !== 0 && errs.length === 0;
    const ok = errs.length <= allowed && !crashed;
    record(`${ws.name}: typecheck`, ok, t.ms, ok ? (errs.length ? `${errs.length} lỗi có sẵn được phép` : '') : `${errs.length} lỗi (cho phép ${allowed})\n${errs.slice(0, 15).map((e) => e.line).join('\n') || tail(t.out)}`);
  } else {
    const inChanged = errs.filter((e) => mine.includes(e.file));
    const crashed = t.code !== 0 && errs.length === 0; // tsc chết không vì lỗi type (thiếu tsconfig, OOM…)
    record(`${ws.name}: typecheck (file thay đổi)`, inChanged.length === 0 && !crashed, t.ms, inChanged.length ? inChanged.map((e) => e.line).join('\n') : crashed ? tail(t.out) : errs.length ? `${errs.length} lỗi ở file khác, không chặn` : '');
  }

  // 2. Lint (chỉ file thay đổi; --full thì cả workspace)
  if (ws.lint === 'eslint') {
    const targets = FULL ? null : mine.filter((f) => /^(src|test)\//.test(f));
    if (!FULL && targets.length === 0) record(`${ws.name}: lint`, null, null, 'không có file .ts thay đổi');
    else {
      const l = await run(FULL ? 'npm run lint' : `npx eslint ${targets.map((f) => `"${f}"`).join(' ')}`, cwd);
      record(`${ws.name}: lint`, l.code === 0, l.ms, l.code === 0 ? '' : tail(l.out));
    }
  } else if (ws.lint === 'next') {
    const targets = mine.map((f) => f.slice(ws.dir.length + 1)).filter((f) => /^src\//.test(f));
    if (!FULL && targets.length === 0) record(`${ws.name}: lint`, null, null, 'không có file thay đổi');
    else {
      const l = await run(FULL ? 'npx next lint' : `npx next lint ${targets.map((f) => `--file "${f}"`).join(' ')}`, cwd);
      record(`${ws.name}: lint`, l.code === 0, l.ms, l.code === 0 ? '' : tail(l.out));
    }
  }

  // 3. Build production (chỉ --full, vì build Vite mất 1–2 phút)
  if (FULL && ws.buildOnFull) {
    const b = await run(ws.buildOnFull, cwd);
    record(`${ws.name}: build`, b.code === 0, b.ms, b.code === 0 ? '' : tail(b.out));
  }
}

(async () => {
  const t0 = Date.now();
  const files = FULL ? [] : changedFiles();
  console.log(`${C.bold}QA ${FULL ? 'FULL' : `changed vs ${BASE}`}${C.reset}${FULL ? '' : ` — ${files.length} file thay đổi`}`);

  const targets = FULL ? WS : WS.filter((ws) => files.some(ws.match));
  for (const ws of WS) if (!targets.includes(ws)) record(`${ws.name}`, null, null, 'không có thay đổi');

  // Workspace nặng chạy song song
  await Promise.all(targets.map((ws) => checkWorkspace(ws, files)));

  // Kiểm nhanh (vài giây) — luôn chạy
  for (const [name, cmd] of [
    ['RBAC route-matrix', 'node scripts/check-rbac.js'],
    ['RBAC public callers', 'node scripts/rbac/check-public-callers.js'],
    ['Chatbot no secrets', 'node scripts/chatbot/check-no-secrets.js'],
    ['Chatbot no hardcoded name', 'node scripts/chatbot/check-no-hardcoded-name.js'],
  ]) {
    const r = await run(cmd, ROOT);
    record(name, r.code === 0, r.ms, r.code === 0 ? '' : tail(r.out, 20));
  }

  // Jest: chỉ test liên quan file backend thay đổi; --full chạy hết
  const backendTs = files.filter((f) => /^src\/.+\.ts$/.test(f) && fs.existsSync(path.join(ROOT, f)));
  if (FULL || backendTs.length) {
    const j = await run(FULL ? 'npx jest --silent' : `npx jest --silent --passWithNoTests --findRelatedTests ${backendTs.map((f) => `"${f}"`).join(' ')}`, ROOT);
    const sum = (j.out.match(/Tests:\s+.*$/m) || [''])[0];
    record('Backend tests (jest)', j.code === 0, j.ms, j.code === 0 ? sum : tail(j.out));
  } else record('Backend tests (jest)', null, null, 'không có file backend thay đổi');

  const failed = results.filter((r) => r.ok === false);
  console.log(`\n${failed.length ? `${C.red}❌ QA FAIL (${failed.length} bước)` : `${C.green}✅ QA PASS`}${C.reset} — ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  process.exit(failed.length ? 1 : 0);
})();
