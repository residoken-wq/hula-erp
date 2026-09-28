#!/usr/bin/env node
/*
 * Chatbot P1 acceptance harness — written by Claude (audit). THIS FILE IS THE CONTRACT.
 * Antigravity: make it pass; do not edit. Report suspected harness bugs in REPORT_P1 §4.
 *
 * Env: CB_BASE (default http://localhost:3999/api), CB_DB (default hula_db),
 *      CB_PSQL (default C:/pg15/pgsql/bin/psql.exe), CB_PGHOST/CB_PGUSER/CB_PGPASSWORD.
 * Backend must run with NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true on a FRESHLY pgenv-reset DB (one run per reset).
 * Exit code 0 = all PASS, 1 = any FAIL/BLOCKED.
 */
const { execFileSync } = require('child_process');

const BASE = process.env.CB_BASE || 'http://localhost:3999/api';
const DB = process.env.CB_DB || 'hula_db';
const PSQL = process.env.CB_PSQL || 'C:/pg15/pgsql/bin/psql.exe';
const PG = { host: process.env.CB_PGHOST || '127.0.0.1', user: process.env.CB_PGUSER || 'hula_user', pass: process.env.CB_PGPASSWORD || 'hula_password' };
const T = 'cbtest' + Date.now().toString(36); // unique token for this run
const KB = '/chatbot/admin/kb';

const results = [];
const log = (...a) => console.log(...a);
const sqlRaw = (q) =>
  execFileSync(PSQL, ['-h', PG.host, '-U', PG.user, '-d', DB, '-At', '-c', q], { env: { ...process.env, PGPASSWORD: PG.pass }, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
const sql = (q) => { try { return sqlRaw(q); } catch (e) { return 'SQLERR'; } };
const j = (x) => JSON.stringify(x);
const short = (x) => j(x).slice(0, 200);

async function req(method, path, { token, body } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : j(body) });
  const t = await r.text();
  let b;
  try { b = JSON.parse(t); } catch { b = t; }
  return { s: r.status, b };
}
async function login(u) {
  const r = await req('POST', '/auth/login', { body: { username: u, password: 'test-local' } });
  if (!r.b || !r.b.access_token) throw new Error(`login ${u} failed: ${r.s} ${short(r.b)}`);
  return r.b.access_token;
}
function check(id, ok, detail) {
  results.push({ id, ok });
  log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail || ''}`);
}
async function step(id, fn) {
  try { await fn(); } catch (e) { check(id, false, 'ERROR ' + String((e && e.message) || e).split(/\r?\n/)[0]); }
}
const errCode = (r) => (r.b && (r.b.code || (r.b.message && r.b.message.code))) || (r.b && r.b.message);
const preview = (tok, tool, args, ignore = true) => req('POST', `${KB}/preview`, { token: tok, body: { tool, args, ignore_feature_flag: ignore } });
const vn = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d); // YYYY-MM-DD
const today = vn(new Date());
const yesterday = vn(new Date(Date.now() - 86400000));
const tomorrow = vn(new Date(Date.now() + 86400000));

(async () => {
  log(`=== accept-p1 ${new Date().toISOString()} base=${BASE} db=${DB} token=${T}`);

  // --- setup: CHATBOT_KB VCU-- for Planning Manager (lou); Sales has none
  const gid = sql("select id from user_groups where name='Planning Manager'");
  sql(`delete from group_permissions where group_id=${gid} and module_code='CHATBOT_KB'`);
  sql(`insert into group_permissions (group_id, module_code, can_view, can_create, can_update, can_delete, view_cost_price) values (${gid},'CHATBOT_KB',true,true,true,false,false)`);
  const salesGid = sql("select id from user_groups where name='Sales'");
  sql(`delete from group_permissions where group_id=${salesGid} and module_code='CHATBOT_KB'`);
  const admin = await login('admin');
  const lou = await login('lou');
  const sales = await login('sales01');

  // CB1-01 seed
  await step('CB1-01', async () => {
    const c = await req('GET', `${KB}/conflicts`, { token: admin });
    const codes = (c.b.items || []).map((x) => x.code).sort();
    const want = Array.from({ length: 16 }, (_, i) => 'D' + String(i + 1).padStart(2, '0'));
    const open = (c.b.items || []).filter((x) => x.status === 'open').length;
    const nConf = sql('select count(*) from chatbot_conflicts');
    const spec = sql("select count(*) from chatbot_knowledge_items where topic like 'product.spec.%' and status='needs_review' and public_allowed=false");
    const scripts = sql("select count(*) from chatbot_knowledge_items where topic like 'script.%' and status='draft'");
    const seedKey = sql("select count(*) from system_configs where key='CHATBOT_KB_SEED_V1'");
    const src = await req('GET', `${KB}/sources`, { token: admin });
    const srcCodes = (src.b.items || []).map((x) => x.code);
    check('CB1-01', c.s === 200 && j(codes) === j(want) && open === 16 && nConf === '16' && Number(spec) === 0 && Number(scripts) === 0 /* AUDIT_P3 M3 (2026-09-28): seed V1 = sources + conflicts only; knowledge comes from kb-v2.json import */ && seedKey === '1' && ['S1', 'S2', 'S3', 'S4', 'A1', 'SPEC'].every((s) => srcCodes.includes(s)),
      `conflicts=${codes.length} open=${open} spec_rows=${spec} scripts=${scripts} seedKey=${seedKey} sources=${srcCodes.join(',')}`);
  });

  // CB1-02 permissions (real enforcement even in SHADOW)
  let lk = {};
  await step('CB1-02', async () => {
    const anon = await req('GET', `${KB}/knowledge`);
    const s403 = await req('GET', `${KB}/knowledge`, { token: sales });
    const lGet = await req('GET', `${KB}/knowledge`, { token: lou });
    const lCreate = await req('POST', `${KB}/knowledge`, { token: lou, body: { topic: `faq.${T}`, question: `hỏi ${T}`, answer: `Trả lời kiểm thử ${T} nệm giặt máy`, public_allowed: true } });
    lk = lCreate.b || {};
    const lPub = await req('POST', `${KB}/knowledge/${lk && lk.id}/publish`, { token: lou });
    const sPrev = await req('POST', `${KB}/preview`, { token: sales, body: { tool: 'searchKnowledge', args: { query: T } } });
    const unknownType = await req('GET', `${KB}/nope`, { token: admin });
    check('CB1-02', anon.s === 401 && s403.s === 403 && lGet.s === 200 && lCreate.s === 201 && lk.status === 'draft' && lk.version === 1 && lPub.s === 403 && sPrev.s === 403 && unknownType.s === 400,
      `anon=${anon.s} sales=${s403.s} louGet=${lGet.s} louCreate=${lCreate.s}/${lk && lk.status} louPublish=${lPub.s} salesPreview=${sPrev.s} badType=${unknownType.s}`);
  });

  // CB1-03 lifecycle + publicScope + versioning + kb_version
  await step('CB1-03', async () => {
    const v0 = (await req('GET', `${KB}/version`, { token: admin })).b.kb_version;
    const q1 = await preview(admin, 'searchKnowledge', { query: T });
    const sub = await req('POST', `${KB}/knowledge/${lk.id}/submit`, { token: lou });
    const q2 = await preview(admin, 'searchKnowledge', { query: T });
    const pub = await req('POST', `${KB}/knowledge/${lk.id}/publish`, { token: admin });
    const q3 = await preview(admin, 'searchKnowledge', { query: T });
    const v1 = (await req('GET', `${KB}/version`, { token: admin })).b.kb_version;
    const upd = await req('PUT', `${KB}/knowledge/${lk.id}`, { token: lou, body: { answer: `Bản hai ${T} nệm giặt máy` } });
    const q4 = await preview(admin, 'searchKnowledge', { query: T });
    const pub2 = await req('POST', `${KB}/knowledge/${upd.b.id}/publish`, { token: admin });
    const q5 = await preview(admin, 'searchKnowledge', { query: T });
    const old = await req('GET', `${KB}/knowledge/${lk.id}`, { token: admin });
    const det = await req('GET', `${KB}/knowledge/${upd.b.id}`, { token: admin });
    const ret = await req('POST', `${KB}/knowledge/${upd.b.id}/retire`, { token: admin });
    const q6 = await preview(admin, 'searchKnowledge', { query: T });
    const v2 = (await req('GET', `${KB}/version`, { token: admin })).b.kb_version;
    const editRetired = await req('PUT', `${KB}/knowledge/${upd.b.id}`, { token: lou, body: { answer: 'x' } });
    const n = (r) => ((r.b.result && r.b.result.items) || []).length;
    const ans = (r) => ((r.b.result && r.b.result.items) || [])[0]?.answer || '';
    const audit = sql("select count(*) from chatbot_audit_events where op='kb.publish'");
    const ok = n(q1) === 0 && sub.b.status === 'needs_review' && n(q2) === 0 && pub.s === 200 && pub.b.status === 'published' && n(q3) === 1 &&
      v1 === v0 + 1 && upd.s === 200 && upd.b.id !== lk.id && upd.b.version === 2 && upd.b.item_key === lk.item_key && upd.b.status === 'draft' &&
      ans(q4).startsWith('Trả lời') && pub2.s === 200 && ans(q5).startsWith('Bản hai') && old.b.status === 'retired' &&
      Array.isArray(det.b.versions) && det.b.versions.length === 2 && ret.b.status === 'retired' && n(q6) === 0 && v2 === v0 + 3 &&
      editRetired.s === 400 && Number(audit) >= 2;
    check('CB1-03', ok, `draft=${n(q1)} review=${n(q2)} pub=${n(q3)} v2draft=${upd.b.version}/${upd.b.status} served="${ans(q4).slice(0, 12)}"→"${ans(q5).slice(0, 12)}" oldStatus=${old.b.status} versions=${det.b.versions && det.b.versions.length} retired=${n(q6)} kb_version ${v0}→${v1}→${v2} editRetired=${editRetired.s} audit_publish=${audit}`);
  });

  // CB1-04 effective dates + public_allowed
  await step('CB1-04', async () => {
    const mk = (extra) => req('POST', `${KB}/knowledge`, { token: admin, body: { topic: `faq.${T}.d`, answer: `Hiệu lực ${T}`, public_allowed: true, ...extra } });
    const exp = await mk({ answer: `Hethan ${T}`, effective_to: yesterday });
    const fut = await mk({ answer: `Tuonglai ${T}`, effective_from: tomorrow });
    const priv = await mk({ answer: `Noibo ${T}`, public_allowed: false });
    const cur = await mk({ answer: `Hienhanh ${T}`, effective_from: today });
    for (const x of [exp, fut, priv, cur]) await req('POST', `${KB}/knowledge/${x.b.id}/publish`, { token: admin });
    const f = async (w) => ((await preview(admin, 'searchKnowledge', { query: w })).b.result?.items || []).length;
    const r = { exp: await f(`Hethan ${T}`), fut: await f(`Tuonglai ${T}`), priv: await f(`Noibo ${T}`), cur: await f(`Hienhanh ${T}`) };
    check('CB1-04', r.exp === 0 && r.fut === 0 && r.priv === 0 && r.cur === 1, j(r));
  });

  // CB1-05 conflict lock
  await step('CB1-05', async () => {
    const a = await req('POST', `${KB}/knowledge`, { token: admin, body: { topic: 'product.thickness.finished', answer: `Do day ${T}`, public_allowed: true } });
    const b = await req('POST', `${KB}/knowledge`, { token: admin, body: { topic: `faq.${T}.lock`, answer: `Khoa ${T}`, conflict_code: 'D03', public_allowed: true } });
    const p1 = await req('POST', `${KB}/knowledge/${a.b.id}/publish`, { token: admin });
    const p2 = await req('POST', `${KB}/knowledge/${b.b.id}/publish`, { token: admin });
    const louResolve = await req('PUT', `${KB}/conflicts/D03`, { token: lou, body: { status: 'resolved', resolution: 'test' } });
    const res = await req('PUT', `${KB}/conflicts/D03`, { token: admin, body: { status: 'resolved', resolution: `test ${T}` } });
    const p3 = await req('POST', `${KB}/knowledge/${a.b.id}/publish`, { token: admin });
    const reopen = await req('PUT', `${KB}/conflicts/D03`, { token: admin, body: { status: 'open', resolution: null } });
    check('CB1-05', p1.s === 409 && errCode(p1) === 'CONFLICT_LOCKED' && p2.s === 409 && louResolve.s === 403 && res.s === 200 && p3.s === 200 && reopen.s === 200,
      `topicLock=${p1.s}/${errCode(p1)} codeLock=${p2.s} louResolve=${louResolve.s} resolve=${res.s} publishAfter=${p3.s} reopen=${reopen.s}`);
  });

  // website products
  const wp = await req('GET', `${KB}/website-products`, { token: admin });
  const skus = ((wp.b && wp.b.items) || []).map((x) => x.sku);
  const A = skus[0], B = skus[1];
  const nonWeb = sql('select sku from products where show_on_website is not true and sku is not null limit 1');

  // CB1-06 facts + catalog tools
  await step('CB1-06', async () => {
    const f1 = await req('POST', `${KB}/facts`, { token: admin, body: { sku: A, fact_key: 'size', value: '120x60', unit: 'cm' } });
    const f2 = await req('POST', `${KB}/facts`, { token: admin, body: { sku: A, fact_key: 'care_instruction', value: `Giặt máy chế độ nhẹ ${T}` } });
    const bad = await req('POST', `${KB}/facts`, { token: admin, body: { sku: nonWeb, fact_key: 'size', value: '1' } });
    const badKey = await req('POST', `${KB}/facts`, { token: admin, body: { sku: A, fact_key: 'magic', value: '1' } });
    const thick = await req('POST', `${KB}/facts`, { token: admin, body: { sku: A, fact_key: 'finished_thickness', value: '5', unit: 'cm' } });
    await req('POST', `${KB}/facts/${f1.b.id}/publish`, { token: admin });
    await req('POST', `${KB}/facts/${f2.b.id}/publish`, { token: admin });
    const pThick = await req('POST', `${KB}/facts/${thick.b.id}/publish`, { token: admin });
    const det = await preview(admin, 'getProductDetails', { sku: A });
    const facts = det.b.result?.product?.facts || [];
    const cat = await preview(admin, 'searchCatalog', { skus: [A, B] });
    const catSkus = (cat.b.result?.items || []).map((x) => x.sku);
    const cmp = await preview(admin, 'compareProducts', { skus: [A, B] });
    const sizeRow = (cmp.b.result?.rows || []).find((r) => r.fact_key === 'size');
    const cmp1 = await preview(admin, 'compareProducts', { skus: [A] });
    const nonWebDet = await preview(admin, 'getProductDetails', { sku: nonWeb });
    check('CB1-06',
      f1.s === 201 && f1.b.topic === 'product.spec.size' && bad.s === 400 && errCode(bad) === 'SKU_NOT_ON_WEBSITE' && badKey.s === 400 &&
      pThick.s === 409 && facts.length === 2 && !facts.some((x) => x.fact_key === 'finished_thickness') &&
      catSkus.includes(A) && !catSkus.includes(B) && sizeRow && sizeRow.values[A] === '120x60 cm' && sizeRow.values[B] === 'chưa xác nhận' &&
      cmp1.s === 400 && nonWebDet.b.result && nonWebDet.b.result.product === null,
      `A=${A} B=${B} topic=${f1.b.topic} nonWeb=${bad.s}/${errCode(bad)} badKey=${badKey.s} thicknessLocked=${pThick.s} facts=${facts.length} catalog=${catSkus.join(',')} compare=${sizeRow && j(sizeRow.values)} cmp1=${cmp1.s} nonWebDetail=${j(nonWebDet.b.result)}`);
  });

  // CB1-07 bundles
  await step('CB1-07', async () => {
    const bcode = `B${T}`.slice(0, 40);
    const okB = await req('POST', `${KB}/bundles`, { token: admin, body: { code: bcode, name: 'Bộ test', items: [{ sku: A, qty: 1 }, { sku: B, qty: 2 }] } });
    const badB = await req('POST', `${KB}/bundles`, { token: admin, body: { code: `X${T}`.slice(0, 40), name: 'Sai', items: [{ sku: nonWeb, qty: 1 }] } });
    const emptyB = await req('POST', `${KB}/bundles`, { token: admin, body: { code: `E${T}`.slice(0, 40), name: 'Rỗng', items: [] } });
    const pb = await req('POST', `${KB}/bundles/${okB.b.id}/publish`, { token: admin });
    check('CB1-07', okB.s === 201 && okB.b.topic === `bundle.${bcode}` && badB.s === 400 && emptyB.s === 400 && pb.s === 200,
      `create=${okB.s} topic=${okB.b.topic} nonWebSku=${badB.s} empty=${emptyB.s} publish=${pb.s}`);
  });

  // price setup: need fixtures allowed + price.* unlocked
  await step('CB1-08', async () => {
  const ver = (await req('GET', `${KB}/version`, { token: admin })).b || {};
  if (!ver.allow_fixtures) {
    for (const id of ['CB1-08', 'CB1-09', 'CB1-10', 'CB1-11', 'CB1-12', 'CB1-13', 'CB1-14']) check(id, false, 'BLOCKED: backend not started with CHATBOT_ALLOW_FIXTURES=true');
  } else {
    // price.* locked by D01/D02/D13 → verify lock first
    const code = A;
    const mkRule = (b) => req('POST', `${KB}/prices`, { token: admin, body: { target_type: 'sku', target_code: code, qty_scope: 'per_design', tax_included: true, valid_from: today, is_fixture: true, ...b } });
    const r30 = await mkRule({ qty_min: 30, qty_max: 49, unit_price: 100000 });
    const lockedPub = await req('POST', `${KB}/prices/${r30.b.id}/publish`, { token: admin });
    for (const c of ['D01', 'D02', 'D13']) await req('PUT', `${KB}/conflicts/${c}`, { token: admin, body: { status: 'resolved', resolution: `test ${T}` } });
    try {
      const p30 = await req('POST', `${KB}/prices/${r30.b.id}/publish`, { token: admin });
      const r50 = await mkRule({ qty_min: 50, qty_max: 300, unit_price: 90000 });
      const p50 = await req('POST', `${KB}/prices/${r50.b.id}/publish`, { token: admin });
      // CB1-08 quantity bands
      const est = async (q, extra = {}) => (await preview(admin, 'getPriceEstimate', { target_type: 'sku', target_code: code, quantity: q, ...extra })).b.result || {};
      const bands = {};
      for (const q of [29, 30, 49, 50, 99, 100, 300, 301]) { const e = await est(q); bands[q] = e.status === 'available' ? e.total : `${e.status}/${e.reason || ''}`; }
      check('CB1-08', lockedPub.s === 409 && errCode(lockedPub) === 'CONFLICT_LOCKED' && p30.s === 200 && p50.s === 200 &&
        bands[29] === 'needs_sales/no_rule' && bands[30] === 3000000 && bands[49] === 4900000 && bands[50] === 4500000 && bands[99] === 8910000 &&
        bands[100] === 9000000 && bands[300] === 27000000 && bands[301] === 'needs_sales/no_rule', `lockedBeforeResolve=${lockedPub.s} bands=${j(bands)}`);
      // CB1-09 overlap conflict
      const dup = await mkRule({ qty_min: 40, qty_max: 60, unit_price: 95000 });
      const pdup = await req('POST', `${KB}/prices/${dup.b.id}/publish`, { token: admin });
      check('CB1-09', pdup.s === 409 && errCode(pdup) === 'PRICE_CONFLICT', `overlap publish=${pdup.s}/${errCode(pdup)}`);
      // CB1-10 customer-scoped rule never used publicly
      const cust = await mkRule({ qty_min: 1, qty_max: 29, unit_price: 50000, customer_scope: 'CUSTOMER:1' });
      const pc = await req('POST', `${KB}/prices/${cust.b.id}/publish`, { token: admin });
      const e10 = await est(10);
      check('CB1-10', pc.s === 200 && e10.status === 'needs_sales' && !j(e10).includes('CUSTOMER') && !j(e10).includes('50000'), `publishCustomerRule=${pc.s} est10=${short(e10)}`);
      // CB1-11 discount request
      const e70 = await est(70, { requested_tier_qty: 100 });
      check('CB1-11', e70.status === 'needs_sales' && e70.reason === 'discount_request', short(e70));
      // CB1-12 tax handling
      const rt = await req('POST', `${KB}/prices`, { token: admin, body: { target_type: 'sku', target_code: B, qty_min: 1, qty_max: 100, unit_price: 100000, qty_scope: 'per_order', tax_included: false, tax_rate: 8, valid_from: today, is_fixture: true } });
      await req('POST', `${KB}/prices/${rt.b.id}/publish`, { token: admin });
      const eTax = (await preview(admin, 'getPriceEstimate', { target_type: 'sku', target_code: B, quantity: 10 })).b.result || {};
      const eIncl = await est(30);
      check('CB1-12', eTax.status === 'available' && eTax.total === 1080000 && eTax.lines?.[0]?.tax === 80000 && eIncl.lines?.[0]?.tax === 0 && eIncl.total === 3000000,
        `excl8%=${eTax.total} tax=${eTax.lines && eTax.lines[0] && eTax.lines[0].tax} incl=${eIncl.total}/${eIncl.lines && eIncl.lines[0] && eIncl.lines[0].tax}`);
      // CB1-13 missing service → partial without total
      const eSvc = await est(30, { services: [{ code: `LOGO_${T}` }] });
      check('CB1-13', eSvc.status === 'partial' && eSvc.total === undefined && (eSvc.missing || []).some((m) => String(m).includes(`LOGO_${T}`)), short(eSvc));
      // CB1-14 feature flag off → disabled
      const eOff = (await preview(admin, 'getPriceEstimate', { target_type: 'sku', target_code: code, quantity: 30 }, false)).b.result || {};
      check('CB1-14', eOff.status === 'disabled', short(eOff));
    } finally {
      for (const c of ['D01', 'D02', 'D13']) await req('PUT', `${KB}/conflicts/${c}`, { token: admin, body: { status: 'open', resolution: null } });
    }
  }
  });

  // CB1-15 validation / unknown fields
  await step('CB1-15', async () => {
    const u1 = await req('POST', `${KB}/knowledge`, { token: admin, body: { topic: 'faq.x', answer: 'x', evil: 1 } });
    const u2 = await req('POST', `${KB}/knowledge`, { token: admin, body: { topic: 'Bad Topic!', answer: 'x' } });
    const u3 = await req('POST', `${KB}/prices`, { token: admin, body: { target_type: 'sku', target_code: A, qty_min: 0, unit_price: 1.5, qty_scope: 'per_order', tax_included: true, valid_from: today } });
    const u4 = await req('POST', `${KB}/prices`, { token: admin, body: { target_type: 'sku', target_code: A, qty_min: 1, unit_price: 1, qty_scope: 'per_order', tax_included: true, valid_from: today, customer_scope: 'VIP' } });
    check('CB1-15', [u1, u2, u3, u4].every((r) => r.s === 400), `unknownField=${u1.s} badTopic=${u2.s} badPrice=${u3.s} badScope=${u4.s}`);
  });

  // CB1-16 PII + source refs never leak into tools
  await step('CB1-16', async () => {
    const pii = sql("select count(*) from chatbot_knowledge_items where (coalesce(question,'')||' '||answer) ~ '((\\+84|0)(3|5|7|8|9)[0-9]{8})|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[a-z]{2,})'");
    const q = await preview(admin, 'searchKnowledge', { query: 'nem' });
    const leak = /docs\.google\.com|internal_ref/.test(j(q.b));
    check('CB1-16', pii === '0' && !leak, `pii_rows=${pii} internal_ref_leak=${leak}`);
  });

  const fails = results.filter((r) => !r.ok).map((r) => r.id);
  log(`=== RESULT ${results.length - fails.length}/${results.length} PASS${fails.length ? ' — FAIL: ' + fails.join(',') : ''}`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error('HARNESS ERROR', e && e.stack);
  process.exit(1);
});
