#!/usr/bin/env node
/*
 * Chatbot P3 acceptance harness — written by Claude (audit). THIS FILE IS THE CONTRACT.
 * Antigravity: make it pass; do not edit. Report suspected harness bugs in REPORT_P3 §4.
 *
 * Backend: NODE_ENV=production CHATBOT_LLM_PROVIDER=fake CHATBOT_TEST_HOOKS=true CHATBOT_ALLOW_FIXTURES=true,
 *          FRESHLY pgenv-reset DB (one run per reset). Run from repo root.
 * Env: CB_BASE (default http://localhost:3999/api), CB_DB, CB_PSQL, CB_PGHOST/CB_PGUSER/CB_PGPASSWORD.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.CB_BASE || 'http://localhost:3999/api';
const DB = process.env.CB_DB || 'hula_db';
const PSQL = process.env.CB_PSQL || 'C:/pg15/pgsql/bin/psql.exe';
const PG = { host: process.env.CB_PGHOST || '127.0.0.1', user: process.env.CB_PGUSER || 'hula_user', pass: process.env.CB_PGPASSWORD || 'hula_password' };
const KB = '/chatbot/admin/kb';
const INBOX = '/chatbot/admin/inbox';

const results = [];
const log = (...a) => console.log(...a);
const sqlRaw = (q) => execFileSync(PSQL, ['-h', PG.host, '-U', PG.user, '-d', DB, '-At', '-c', q], { env: { ...process.env, PGPASSWORD: PG.pass }, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const sql = (q) => { try { return sqlRaw(q); } catch (e) { return 'SQLERR'; } };
const esc = (s) => String(s).replace(/'/g, "''");
const j = (x) => JSON.stringify(x);
const short = (x) => j(x).slice(0, 200);
const uuid = () => crypto.randomUUID();
const code = (r) => r && r.b && (r.b.code || (r.b.message && r.b.message.code) || r.b.message);
const MONEY = /\d[\d.,]*\s*(k\b|nghìn|ngàn|triệu|tr\b|đ\b|đồng|vnđ|vnd|%)/i;
const read = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };

async function req(method, p, { token, chat, body } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  if (chat) h['X-Chat-Session'] = chat;
  const t0 = Date.now();
  const r = await fetch(BASE + p, { method, headers: h, body: body === undefined ? undefined : j(body) });
  const t = await r.text();
  let b; try { b = JSON.parse(t); } catch { b = t; }
  return { s: r.status, b, ms: Date.now() - t0 };
}
async function login(u) { const r = await req('POST', '/auth/login', { body: { username: u, password: 'test-local' } }); if (!r.b || !r.b.access_token) throw new Error('login ' + u); return r.b.access_token; }
function check(id, ok, detail) { results.push({ id, ok }); log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail || ''}`); }
async function step(id, fn) { try { await fn(); } catch (e) { check(id, false, 'ERROR ' + String((e && e.message) || e).split(/\r?\n/)[0]); } }
async function newSession() { const r = await req('POST', '/public/chat/sessions', { body: {} }); return { tok: r.b.session_token, code: r.b.conversation && r.b.conversation.public_code }; }
const msg = (tok, text) => req('POST', '/public/chat/messages', { chat: tok, body: { client_msg_id: uuid(), text } });
const act = (tok, action, value) => req('POST', '/public/chat/actions', { chat: tok, body: { client_msg_id: uuid(), action, value } });
const convId = (pc) => sql(`select id from chatbot_conversations where public_code='${esc(pc)}'`);
const lastAiMeta = (pc) => { const v = sql(`select coalesce(llm_meta::text,'null') from chatbot_messages where conversation_id='${convId(pc)}' and role='ai' order by created_at desc limit 1`); try { return JSON.parse(v); } catch { return null; } };
const replyText = (r) => ((r.b && r.b.replies) || []).map((x) => x.text || '').join(' \n ');
const payloadTypes = (r) => ((r.b && r.b.replies) || []).map((x) => x.payload && x.payload.type).filter(Boolean);
const usageToday = () => { const key = 'CHATBOT_LLM_USAGE_' + new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()).replace(/-/g, ''); const v = sql(`select value from system_configs where key='${key}'`); return Number(v) || 0; };

(async () => {
  log(`=== accept-p3 ${new Date().toISOString()} base=${BASE} db=${DB}`);
  const gid = sql("select id from user_groups where name='Planning Manager'");
  sql(`delete from group_permissions where group_id=${gid} and module_code='CHATBOT_KB'`);
  sql(`insert into group_permissions (group_id, module_code, can_view, can_create, can_update, can_delete, view_cost_price) values (${gid},'CHATBOT_KB',true,true,true,false,false)`);
  const admin = await login('admin');
  const sales = await login('sales01');
  const lou = await login('lou');

  const cfg0 = (await req('GET', '/chatbot/admin/config', { token: admin })).b;
  const defaultBudget = cfg0 && cfg0.llm && cfg0.llm.daily_call_budget;
  let cfg = (await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...cfg0, enabled: true, contact_channels: { ...cfg0.contact_channels, email_public: 'sales-test@example.com' } } })).b;
  const putCfg = async (patch) => { const cur = (await req('GET', '/chatbot/admin/config', { token: admin })).b; const r = await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...cur, ...patch } }); return r; };

  const kbFile = JSON.parse(read('docs/chatbot/knowledge/kb-v2.json'));
  const total = kbFile.knowledge.length + kbFile.scripts.length;

  // CB3-01 import + idempotency
  await step('CB3-01', async () => {
    const a = await req('POST', `${KB}/import`, { token: admin, body: kbFile });
    const b2 = await req('POST', `${KB}/import`, { token: admin, body: kbFile });
    const n = sql("select count(*) from chatbot_knowledge_items where seed_key like 'kb2.%'");
    const pub = sql("select count(*) from chatbot_knowledge_items where seed_key like 'kb2.%' and status='published'");
    const d17 = sql("select status from chatbot_conflicts where code='D17'");
    const note = sql("select count(*) from chatbot_knowledge_items where seed_key='kb2.price.table.s2' and source_refs::text like '%note%'");
    check('CB3-01', a.s < 300 && a.b.inserted === total && a.b.skipped === 0 && a.b.conflicts_inserted === 1 && b2.s < 300 && b2.b.inserted === 0 && b2.b.skipped === total && b2.b.conflicts_inserted === 0 && Number(n) === total && pub === '0' && d17 === 'open' && note === '1',
      `first=${short(a.b)} second=${short(b2.b)} rows=${n}/${total} published=${pub} D17=${d17} review_note_saved=${note}`);
  });

  // CB3-02 import guards
  await step('CB3-02', async () => {
    const anon = await req('POST', `${KB}/import`, { body: kbFile });
    const s = await req('POST', `${KB}/import`, { token: sales, body: kbFile });
    const badStatus = { ...kbFile, knowledge: [{ seed_key: 'bad.one', topic: 'faq.bad', answer: 'x', status: 'published' }], scripts: [], conflicts: [] };
    const bs = await req('POST', `${KB}/import`, { token: admin, body: badStatus });
    const badField = { ...kbFile, knowledge: [{ seed_key: 'bad.two', topic: 'faq.bad', answer: 'x', status: 'draft', evil: 1 }], scripts: [], conflicts: [] };
    const bf = await req('POST', `${KB}/import`, { token: admin, body: badField });
    const badTopic = { ...kbFile, knowledge: [{ seed_key: 'bad.three', topic: 'Bad Topic', answer: 'x', status: 'draft' }], scripts: [], conflicts: [] };
    const bt = await req('POST', `${KB}/import`, { token: admin, body: badTopic });
    const leaked = sql("select count(*) from chatbot_knowledge_items where seed_key like 'bad.%'");
    const l = await req('POST', `${KB}/import`, { token: lou, body: kbFile });
    check('CB3-02', anon.s === 401 && s.s === 403 && bs.s === 400 && code(bs) === 'IMPORT_STATUS_NOT_ALLOWED' && bf.s === 400 && bt.s === 400 && leaked === '0' && l.s < 300 && l.b.inserted === 0,
      `anon=${anon.s} sales=${s.s} published=${bs.s}/${code(bs)} unknownField=${bf.s} badTopic=${bt.s} badRows=${leaked} louImport=${l.s}/${l.b && l.b.inserted}`);
  });

  const idOf = (k) => sql(`select id from chatbot_knowledge_items where seed_key='${esc(k)}' order by version desc limit 1`);

  // CB3-03 locked items stay locked; safe set publishes
  const SAFE = ['kb2.faq.price.process', 'kb2.faq.thickness.process', 'kb2.product.care.quilted', 'kb2.faq.logo.process', 'kb2.faq.infant', 'kb2.faq.return.process', 'kb2.faq.structure.compare', 'kb2.script.complaint', 'kb2.script.infant', 'kb2.script.price_pending', 'kb2.script.no_erp'];
  await step('CB3-03', async () => {
    const p1 = await req('POST', `${KB}/knowledge/${idOf('kb2.price.range.school_set')}/publish`, { token: admin });
    const p2 = await req('POST', `${KB}/knowledge/${idOf('kb2.product.spec.size.blanket')}/publish`, { token: admin });
    const p3 = await req('POST', `${KB}/knowledge/${idOf('kb2.leadtime.standard')}/publish`, { token: admin });
    const safe = [];
    for (const k of SAFE) { const r = await req('POST', `${KB}/knowledge/${idOf(k)}/publish`, { token: admin }); safe.push(r.s); }
    const d17 = p2.b && p2.b.conflicts ? p2.b.conflicts.includes('D17') : false;
    check('CB3-03', p1.s === 409 && code(p1) === 'CONFLICT_LOCKED' && p2.s === 409 && d17 && p3.s === 409 && safe.every((s) => s === 200),
      `price=${p1.s}/${code(p1)} blanket=${p2.s} D17=${d17} leadtime=${p3.s} safePublish=${safe.join(',')}`);
  });

  // CB3-04 placeholders rendered
  await step('CB3-04', async () => {
    const r = await req('POST', `${KB}/preview`, { token: admin, body: { tool: 'searchKnowledge', args: { query: 'logo mockup' } } });
    const ans = ((r.b.result && r.b.result.items) || [])[0]?.answer || '';
    check('CB3-04', ans.includes('sales-test@example.com') && !ans.includes('{email_public}'), `answer="${ans.slice(0, 120)}"`);
  });

  // CB3-05 pipeline: slots, no repeated question, llm_meta
  await step('CB3-05', async () => {
    const S = await newSession();
    await act(S.tok, 'start', 'parent');
    const r = await msg(S.tok, 'Bé 4 tuổi nằm giường lưới muốn dễ giặt');
    const c = await req('GET', '/public/chat/conversation', { chat: S.tok });
    const d = (c.b.brief && c.b.brief.data) || {};
    const t = replyText(r);
    const m = lastAiMeta(S.code) || {};
    check('CB3-05', r.s === 200 && d.age_years === 4 && /giường lưới/i.test(String(d.surface || '')) && t.length > 0 && !/mấy tuổi/i.test(t) && (t.match(/\?/g) || []).length <= 2 &&
      m.provider === 'fake' && typeof m.prompt_version === 'string' && typeof m.kb_version === 'number' && m.latency_ms && typeof m.input_preview === 'string',
      `brief=${j(d)} reply="${t.slice(0, 100)}" meta=${short(m)}`);
  });

  // CB3-06 thickness → safe answer, no numbers in cm
  await step('CB3-06', async () => {
    const S = await newSession();
    const r = await msg(S.tok, 'Nệm dày bao nhiêu cm?');
    const t = replyText(r);
    check('CB3-06', r.s === 200 && !/\d\s*(–|-)?\s*\d*\s*cm/i.test(t) && /chần gòn hay foam/i.test(t), `reply="${t.slice(0, 140)}"`);
  });

  // CB3-07 price question → no money, process answer
  await step('CB3-07', async () => {
    const S = await newSession();
    await act(S.tok, 'start', 'school');
    const r = await msg(S.tok, '30 bộ bao nhiêu tiền?');
    const t = replyText(r);
    check('CB3-07', r.s === 200 && !MONEY.test(t) && /báo giá chính thức/i.test(t) && !/bao nhiêu bộ/i.test(t), `reply="${t.slice(0, 160)}"`);
  });

  // CB3-08 PII redaction before LLM
  await step('CB3-08', async () => {
    const S = await newSession();
    const r = await msg(S.tok, 'sđt em 0987654321, email em là test.parent@example.com, tư vấn giúp em nệm cho bé');
    const m = lastAiMeta(S.code) || {};
    const metaTxt = j(m);
    const t = replyText(r);
    check('CB3-08', r.s === 200 && /\[SĐT\]/.test(m.input_preview || '') && /\[EMAIL\]/.test(m.input_preview || '') && !metaTxt.includes('0987654321') && !metaTxt.includes('test.parent@example.com') && !t.includes('0987654321'),
      `input_preview="${m.input_preview}"`);
  });

  // CB3-09 validator blocks injected reply
  await step('CB3-09', async () => {
    const S = await newSession();
    const r = await msg(S.tok, '[[fake:inject]] báo giá giúp em');
    const t = replyText(r);
    const m = lastAiMeta(S.code) || {};
    check('CB3-09', r.s === 200 && t.length > 0 && !t.includes('350.000') && !/đã gửi/i.test(t) && !/https?:\/\//i.test(t) && (t.match(/\?/g) || []).length <= 2 && m.validator && m.validator.blocked === true && (m.validator.rules || []).length >= 2,
      `reply="${t.slice(0, 120)}" validator=${short(m.validator)}`);
  });

  // CB3-10 complaint
  await step('CB3-10', async () => {
    const S = await newSession();
    const r = await msg(S.tok, 'Túi đồ ướt bị thấm, chất lượng kém quá');
    const types = payloadTypes(r);
    const t = replyText(r);
    check('CB3-10', r.s === 200 && types.includes('suggest_ticket') && !types.includes('product') && !types.includes('summary') && /rất tiếc/i.test(t) && !MONEY.test(t), `payloads=${j(types)} reply="${t.slice(0, 100)}"`);
  });

  // CB3-11 infant
  await step('CB3-11', async () => {
    const S = await newSession();
    const r = await msg(S.tok, 'Bé nhà em 8 tháng tuổi, có nệm không?');
    const types = payloadTypes(r);
    const t = replyText(r);
    check('CB3-11', r.s === 200 && types.includes('handoff_suggest') && !types.includes('product') && /chuyên viên|nhân viên/i.test(t), `payloads=${j(types)} reply="${t.slice(0, 100)}"`);
  });

  // CB3-12 knowledge gap + permissions
  await step('CB3-12', async () => {
    const S = await newSession();
    await msg(S.tok, 'Có bán nệm cho chó mèo không');
    await msg(S.tok, 'Có bán nệm cho chó mèo không');
    const row = sql("select count||'|'||status from chatbot_knowledge_gaps where question_norm like '%meo%' order by last_seen_at desc limit 1");
    const list = await req('GET', `${KB}/gaps?status=open`, { token: admin });
    const found = ((list.b && list.b.items) || []).some((g) => /mèo|meo/i.test((g.sample_text || '') + (g.question_norm || '')));
    const sl = await req('GET', `${KB}/gaps`, { token: sales });
    check('CB3-12', row.startsWith('2|open') && list.s === 200 && found && sl.s === 403, `gap=${row} listed=${found} salesList=${sl.s}`);
  });

  // CB3-13 timeout fallback
  await step('CB3-13', async () => {
    await putCfg({ llm: { ...cfg.llm, timeout_ms: 2000 } });
    const S = await newSession();
    const r = await msg(S.tok, '[[fake:timeout]] xin chào');
    const m = lastAiMeta(S.code) || {};
    await putCfg({ llm: { ...cfg.llm, timeout_ms: 20000 } });
    check('CB3-13', r.s === 200 && r.ms < 10000 && replyText(r).length > 0 && m.fallback === 'timeout', `ms=${r.ms} fallback=${m.fallback}`);
  });

  // CB3-14 budget exhausted → scripted fallback, no extra usage
  await step('CB3-14', async () => {
    const used = usageToday();
    await putCfg({ llm: { ...cfg.llm, timeout_ms: 20000, daily_call_budget: Math.max(1, used) } });
    const before = usageToday();
    const S = await newSession();
    const r = await msg(S.tok, 'Tư vấn giúp em nệm cho trường');
    const m = lastAiMeta(S.code) || {};
    const after = usageToday();
    await putCfg({ llm: { ...cfg.llm, timeout_ms: 20000, daily_call_budget: 600 } });
    check('CB3-14', r.s === 200 && replyText(r).length > 0 && m.fallback === 'budget' && after === before, `usage ${before}→${after} fallback=${m.fallback}`);
  });

  // CB3-15 human_active → no LLM call
  await step('CB3-15', async () => {
    const S = await newSession();
    await msg(S.tok, 'Xin chào');
    const cid = convId(S.code);
    const take = await req('POST', `${INBOX}/conversations/${cid}/take`, { token: sales });
    const before = usageToday();
    const r = await msg(S.tok, 'Em hỏi thêm chút');
    const after = usageToday();
    check('CB3-15', take.s < 300 && r.s === 200 && (r.b.replies || []).length === 0 && after === before, `take=${take.s} replies=${(r.b.replies || []).length} usage ${before}→${after}`);
  });

  // CB3-16 status + default budget
  await step('CB3-16', async () => {
    const st = await req('GET', '/chatbot/admin/status', { token: admin });
    check('CB3-16', st.s === 200 && ['CHATBOT_LLM_API_KEY', 'GEMINI_API_KEY', 'none'].includes(st.b.llm_key_source) && defaultBudget === 600, `key_source=${st.b.llm_key_source} model=${st.b.llm_model} defaultBudget=${defaultBudget}`);
  });

  // CB3-17 UI changes exist (static) + widget.subtitle
  await step('CB3-17', async () => {
    const chatDir = 'hula-web/website/src/components/chat';
    const files = ['ChatPanel.tsx', 'ChatTeaser.tsx', 'ChatWidgetContext.tsx'].map((f) => read(`${chatDir}/${f}`) || '');
    const all = files.join('\n');
    const header = read('hula-web/website/src/components/Header.tsx') || '';
    const hero = read('hula-web/website/src/components/HeroCarousel.tsx') || '';
    const cmsApi = read('hula-web/cms/src/lib/api.ts') || '';
    const gaps = read('hula-web/cms/src/app/chatbot/gaps/page.tsx');
    const matrix = read('docs/rbac_v2/route-matrix.csv') || '';
    const pc = await req('GET', '/public/chat/config');
    const r = {
      noWelcome: !/welcome_message/.test(all), noDatChuan: !/đạt chuẩn/i.test(all), usesGreeting: /greeting/.test(all), usesSubtitle: /subtitle/.test(all),
      headerNowrap: /whitespace-nowrap/.test(header), heroOpensChat: /useChatWidget|openChat/.test(hero), cmsImport: /kb\/import/.test(cmsApi), gapsPage: !!gaps,
      matrix: ['CB-120', 'CB-121', 'CB-122'].every((x) => matrix.includes(x)), subtitle: pc.b.widget && pc.b.widget.subtitle === 'Tư vấn nệm mầm non',
    };
    check('CB3-17', Object.values(r).every(Boolean), j(r));
  });

  const fails = results.filter((r) => !r.ok).map((r) => r.id);
  log(`=== RESULT ${results.length - fails.length}/${results.length} PASS${fails.length ? ' — FAIL: ' + fails.join(',') : ''}`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e && e.stack); process.exit(1); });
