#!/usr/bin/env node
/*
 * Chatbot P2 acceptance harness — written by Claude (audit). THIS FILE IS THE CONTRACT.
 * Antigravity: make it pass; do not edit. Report suspected harness bugs in REPORT_P2 §4.
 *
 * Backend: NODE_ENV=production CHATBOT_ALLOW_FIXTURES=true CHATBOT_TEST_HOOKS=true, FRESHLY pgenv-reset DB (one run per reset).
 * Env: CB_BASE (default http://localhost:3999/api), CB_DB, CB_PSQL, CB_PGHOST/CB_PGUSER/CB_PGPASSWORD.
 * Exit code 0 = all PASS.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');

const BASE = process.env.CB_BASE || 'http://localhost:3999/api';
const DB = process.env.CB_DB || 'hula_db';
const PSQL = process.env.CB_PSQL || 'C:/pg15/pgsql/bin/psql.exe';
const PG = { host: process.env.CB_PGHOST || '127.0.0.1', user: process.env.CB_PGUSER || 'hula_user', pass: process.env.CB_PGPASSWORD || 'hula_password' };
const T = 'cb2' + Date.now().toString(36);
const INBOX = '/chatbot/admin/inbox';

const results = [];
const log = (...a) => console.log(...a);
const sqlRaw = (q) =>
  execFileSync(PSQL, ['-h', PG.host, '-U', PG.user, '-d', DB, '-At', '-c', q], { env: { ...process.env, PGPASSWORD: PG.pass }, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
const sql = (q) => { try { return sqlRaw(q); } catch (e) { return 'SQLERR'; } };
const esc = (s) => String(s).replace(/'/g, "''");
const j = (x) => JSON.stringify(x);
const short = (x) => j(x).slice(0, 220);
const uuid = () => crypto.randomUUID();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (r) => r && r.b && (r.b.code || (r.b.message && r.b.message.code) || r.b.message);

async function req(method, path, { token, chat, body } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  if (chat) h['X-Chat-Session'] = chat;
  const r = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : j(body) });
  const t = await r.text();
  let b;
  try { b = JSON.parse(t); } catch { b = t; }
  return { s: r.status, b };
}
async function login(u) {
  const r = await req('POST', '/auth/login', { body: { username: u, password: 'test-local' } });
  if (!r.b || !r.b.access_token) throw new Error(`login ${u} failed ${r.s}`);
  return r.b.access_token;
}
function check(id, ok, detail) { results.push({ id, ok }); log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail || ''}`); }
async function step(id, fn) { try { await fn(); } catch (e) { check(id, false, 'ERROR ' + String((e && e.message) || e).split(/\r?\n/)[0]); } }
async function newSession() {
  const r = await req('POST', '/public/chat/sessions', { body: {} });
  return { tok: r.b.session_token, code: r.b.conversation && r.b.conversation.public_code, s: r.s };
}
const msg = (tok, text, id = uuid()) => req('POST', '/public/chat/messages', { chat: tok, body: { client_msg_id: id, text } });
const act = (tok, action, value) => req('POST', '/public/chat/actions', { chat: tok, body: { client_msg_id: uuid(), action, value } });
const conv = (tok) => req('GET', '/public/chat/conversation', { chat: tok });
const convId = (pc) => sql(`select id from chatbot_conversations where public_code='${esc(pc)}'`);
const randPhone = () => '098' + String(Math.floor(Math.random() * 1e7)).padStart(7, '0');
const qCount = (s) => (String(s).match(/\?/g) || []).length;

(async () => {
  log(`=== accept-p2 ${new Date().toISOString()} base=${BASE} db=${DB} token=${T}`);
  const admin = await login('admin');
  const sales = await login('sales01');
  const ketoan = await login('ketoan');
  const maiuyen = await login('maiuyen');
  const adminId = Number(sql("select id from users where username='admin'"));

  // setup: enable + notify config
  const cfg = (await req('GET', '/chatbot/admin/config', { token: admin })).b;
  const put = await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...cfg, enabled: true, notify_emails: ['sales-test@example.com'], notify_user_ids: [adminId] } });
  log(`setup enable=${put.s}${put.s !== 200 ? ' ' + short(put.b) : ''}`);

  // CB2-01 widget config
  await step('CB2-01', async () => {
    const pc = await req('GET', '/public/chat/config');
    const w = pc.b.widget || {};
    check('CB2-01', pc.s === 200 && pc.b.enabled === true && w.cta_label === 'Tư vấn ngay' && w.auto_open === true && w.auto_open_delay_s === 5 && w.auto_open_mobile === 'teaser' && w.snooze_hours === 24,
      `widget=${j(w)}`);
    const bad = await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...put.b, widget: { ...w, auto_open_delay_s: 1 } } });
    const bad2 = await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...put.b, widget: { ...w, auto_open_mobile: 'popup' } } });
    const good = await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...put.b, widget: { ...w, auto_open_delay_s: 7 } } });
    const back = await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...put.b, widget: { ...w, auto_open_delay_s: 5 } } });
    check('CB2-01b', bad.s === 400 && bad2.s === 400 && good.s === 200 && good.b.widget && good.b.widget.auto_open_delay_s === 7 && back.s === 200, `delay1=${bad.s} mobileBad=${bad2.s} valid7=${good.s} restore=${back.s}`);
  });

  // CB2-02 start flow
  let S1;
  await step('CB2-02', async () => {
    S1 = await newSession();
    const r = await act(S1.tok, 'start', 'school');
    const rep = (r.b.replies || [])[0] || {};
    const shortName = (await req('GET', '/public/chat/config')).b.short_name;
    check('CB2-02', S1.s === 201 && r.s === 200 && (r.b.replies || []).length === 1 && rep.role === 'ai' && qCount(rep.text) <= 2 && qCount(rep.text) >= 1 && rep.sender_label === shortName && !/\d[\d.]*\s*(đ|k|nghìn|triệu)/i.test(rep.text),
      `status=${r.s} replies=${(r.b.replies || []).length} q=${qCount(rep.text)} label=${rep.sender_label} text="${String(rep.text).slice(0, 80)}"`);
  });

  // CB2-03 idempotent messages
  await step('CB2-03', async () => {
    const id = uuid();
    const a = await msg(S1.tok, `Xin chào ${T}`, id);
    const b = await msg(S1.tok, `Xin chào ${T}`, id);
    const n = sql(`select count(*) from chatbot_messages where client_msg_id='${id}'`);
    const same = a.b.message && b.b.message && a.b.message.id === b.b.message.id && j((a.b.replies || []).map((x) => x.id)) === j((b.b.replies || []).map((x) => x.id));
    const long = await msg(S1.tok, 'a'.repeat(2001));
    const empty = await msg(S1.tok, '   ');
    check('CB2-03', a.s === 200 && b.s === 200 && same && n === '1' && long.s === 400 && code(long) === 'MESSAGE_TOO_LONG' && empty.s === 400,
      `sameIds=${same} dbRows=${n} tooLong=${long.s}/${code(long)} empty=${empty.s}`);
  });

  // CB2-04 slot extraction + summary card
  await step('CB2-04', async () => {
    const r = await msg(S1.tok, 'Lớp mới cần 30 bộ màu be');
    const c = await conv(S1.tok);
    const d = (c.b.brief && c.b.brief.data) || {};
    const summary = (r.b.replies || []).find((x) => x.payload && x.payload.type === 'summary');
    const asksQtyAgain = (r.b.replies || []).some((x) => /bao nhiêu|số lượng/i.test(x.text || ''));
    check('CB2-04', d.quantity === 30 && /be/i.test(String(d.colors || '')) && d.segment === 'school' && !!summary && summary.payload.brief_revision === c.b.brief.revision && c.b.conversation.state === 'request_review' && !asksQtyAgain,
      `brief=${j(d)} rev=${c.b.brief && c.b.brief.revision} summary=${!!summary} state=${c.b.conversation && c.b.conversation.state} asksQtyAgain=${asksQtyAgain}`);
  });

  // CB2-05 brief PUT
  let rev;
  await step('CB2-05', async () => {
    const c = await conv(S1.tok);
    const r0 = c.b.brief.revision;
    const stale = await req('PUT', '/public/chat/brief', { chat: S1.tok, body: { base_revision: r0 - 1, patch: { quantity: 40 } } });
    const unk = await req('PUT', '/public/chat/brief', { chat: S1.tok, body: { base_revision: r0, patch: { price: 1 } } });
    const badQ = await req('PUT', '/public/chat/brief', { chat: S1.tok, body: { base_revision: r0, patch: { quantity: 0 } } });
    const ok = await req('PUT', '/public/chat/brief', { chat: S1.tok, body: { base_revision: r0, patch: { quantity: 60, items: ['nệm', 'gối'], school_name: `Trường ${T}` } } });
    rev = ok.b.brief && ok.b.brief.revision;
    const revRows = sql(`select count(*) from chatbot_briefs where conversation_id='${convId(S1.code)}'`);
    check('CB2-05', stale.s === 409 && code(stale) === 'BRIEF_STALE' && stale.b.brief && unk.s === 400 && badQ.s === 400 && ok.s === 200 && rev === r0 + 1 && ok.b.brief.data.quantity === 60 && Number(revRows) === rev,
      `stale=${stale.s}/${code(stale)} unknown=${unk.s} qty0=${badQ.s} ok=${ok.s} rev ${r0}→${rev} rows=${revRows}`);
  });

  // CB2-06 request validation + creation + idempotency
  let REQ = {}, PHONE = randPhone();
  await step('CB2-06', async () => {
    const base = { type: 'quote', brief_revision: rev, contact: { name: `Cô Test ${T}`, phone: PHONE, preferred_channel: 'phone' }, consent: { contact: true, marketing: false, notice_version: 'v1' } };
    const noConsent = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: uuid(), consent: { ...base.consent, contact: false } } });
    const noContact = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: uuid(), contact: { name: 'x', preferred_channel: 'phone' } } });
    const wrongPref = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: uuid(), contact: { name: 'x', phone: PHONE, preferred_channel: 'email' } } });
    const badPhone = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: uuid(), contact: { name: 'x', phone: '12345', preferred_channel: 'phone' } } });
    const stale = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: uuid(), brief_revision: rev - 1 } });
    const key = uuid();
    const ok = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: key } });
    const dup = await req('POST', '/public/chat/requests', { chat: S1.tok, body: { ...base, idempotency_key: key } });
    REQ = { code: ok.b.code, id: sql(`select id from chatbot_requests where idempotency_key='${key}'`) };
    const nReq = sql(`select count(*) from chatbot_requests where idempotency_key='${key}'`);
    const ob = sql(`select string_agg(channel, ',' order by channel) from chatbot_outbox where event='request.created' and ref_id='${REQ.id}'`);
    const c = await conv(S1.tok);
    const sys = (c.b.messages || []).filter((m) => m.role === 'system').map((m) => m.text).join(' | ');
    check('CB2-06',
      noConsent.s === 400 && code(noConsent) === 'CONSENT_REQUIRED' && noContact.s === 400 && code(noContact) === 'CONTACT_REQUIRED' && wrongPref.s === 400 && code(wrongPref) === 'CONTACT_REQUIRED' &&
      badPhone.s === 400 && code(badPhone) === 'PHONE_INVALID' && stale.s === 409 && code(stale) === 'BRIEF_STALE' &&
      ok.s === 201 && /^YC-\d{6}-\d{4}$/.test(ok.b.code || '') && ok.b.status === 'received' && dup.s === 200 && dup.b.code === ok.b.code && nReq === '1' && ob === 'email,inapp' &&
      sys.includes(ok.b.code) && !/đã nhận|đã đọc|đã xử lý/i.test(sys) && c.b.conversation.state === 'submitted',
      `consent=${noConsent.s}/${code(noConsent)} contact=${noContact.s}/${code(noContact)} pref=${code(wrongPref)} phone=${code(badPhone)} stale=${stale.s} ok=${ok.s} ${ok.b.code} dup=${dup.s}/${dup.b.code} rows=${nReq} outbox=${ob} state=${c.b.conversation && c.b.conversation.state} sys="${sys.slice(0, 90)}"`);
  });

  // CB2-07 LEAD create + dedupe by normalized phone
  await step('CB2-07', async () => {
    const lead = sql(`select code||'|'||type||'|'||lead_source||'|'||lead_status||'|'||phone||'|'||name from customers where code='LEAD-${esc(REQ.code)}'`);
    const custId = sql(`select customer_id from chatbot_requests where id='${REQ.id}'`);
    const S2 = await newSession();
    await req('PUT', '/public/chat/brief', { chat: S2.tok, body: { base_revision: 0, patch: { segment: 'school', quantity: 20, items: ['nệm'] } } });
    const r2 = (await conv(S2.tok)).b.brief.revision;
    const pretty = '+84 ' + PHONE.slice(1, 4) + ' ' + PHONE.slice(4, 7) + ' ' + PHONE.slice(7);
    const o2 = await req('POST', '/public/chat/requests', { chat: S2.tok, body: { idempotency_key: uuid(), type: 'quote', brief_revision: r2, contact: { name: 'Người khác', phone: pretty, preferred_channel: 'phone' }, consent: { contact: true, marketing: false, notice_version: 'v1' } } });
    const cust2 = sql(`select customer_id from chatbot_requests where code='${esc(o2.b.code)}'`);
    const nCust = sql(`select count(*) from customers where regexp_replace(coalesce(phone,''),'[^0-9]','','g') in ('${PHONE}','84${PHONE.slice(1)}')`);
    const hist = sql(`select count(*) from customers c, jsonb_array_elements(c.history) h where c.id=${Number(custId) || 0} and h->>'action'='CHATBOT_REQUEST'`);
    const newLead2 = sql(`select count(*) from customers where code='LEAD-${esc(o2.b.code)}'`);
    check('CB2-07', lead.startsWith(`LEAD-${REQ.code}|LEAD|CHATBOT|NEW|${PHONE}|Trường ${T}`) && custId && cust2 === custId && nCust === '1' && hist === '1' && newLead2 === '0' && o2.s === 201,
      `lead="${lead}" cust1=${custId} cust2=${cust2} customersWithPhone=${nCust} historyAppend=${hist} secondLeadCreated=${newLead2} o2=${o2.s}`);
  });

  // CB2-08 DB failure rollback (T26)
  await step('CB2-08', async () => {
    const S3 = await newSession();
    await req('PUT', '/public/chat/brief', { chat: S3.tok, body: { base_revision: 0, patch: { segment: 'school', quantity: 10, items: ['nệm'] } } });
    const r3 = (await conv(S3.tok)).b.brief.revision;
    const key = uuid(); const ph = randPhone();
    const f = await req('POST', '/public/chat/requests', { chat: S3.tok, body: { idempotency_key: key, type: 'quote', brief_revision: r3, contact: { name: '[[fail:db]]', phone: ph, preferred_channel: 'phone' }, consent: { contact: true, marketing: false, notice_version: 'v1' } } });
    const cid = convId(S3.code);
    const nReq = sql(`select count(*) from chatbot_requests where idempotency_key='${key}'`);
    const nLead = sql(`select count(*) from customers where phone='${ph}'`);
    const nCons = sql(`select count(*) from chatbot_consents where conversation_id='${cid}'`);
    const st = sql(`select state from chatbot_conversations where id='${cid}'`);
    const c = await conv(S3.tok);
    const leaked = /YC-\d{6}/.test(j(c.b.messages || []));
    check('CB2-08', f.s === 500 && code(f) === 'SUBMIT_FAILED' && nReq === '0' && nLead === '0' && nCons === '0' && st === 'submission_failed' && !leaked,
      `status=${f.s}/${code(f)} requests=${nReq} leads=${nLead} consents=${nCons} state=${st} codeLeakedToCustomer=${leaked}`);
  });

  // CB2-09 inbox permissions
  let CID;
  await step('CB2-09', async () => {
    CID = convId(S1.code);
    const anon = await req('GET', `${INBOX}/conversations`);
    const mu = await req('GET', `${INBOX}/conversations`, { token: maiuyen });
    const sl = await req('GET', `${INBOX}/conversations?q=${S1.code}`, { token: sales });
    const kt = await req('POST', `${INBOX}/conversations/${CID}/take`, { token: ketoan });
    const found = (sl.b.items || []).some((x) => x.public_code === S1.code && (x.request_codes || []).includes(REQ.code));
    check('CB2-09', anon.s === 401 && mu.s === 403 && sl.s === 200 && found && kt.s === 403, `anon=${anon.s} maiuyen=${mu.s} sales=${sl.s} found=${found} ketoanTake=${kt.s}`);
  });

  // CB2-10 human request
  await step('CB2-10', async () => {
    const S4 = await newSession();
    await act(S4.tok, 'start', 'parent');
    const r = await msg(S4.tok, 'cho tôi gặp nhân viên');
    const c = await conv(S4.tok);
    const ob = sql(`select count(*) from chatbot_outbox where event='human.requested' and ref_id='${convId(S4.code)}'`);
    const txt = ((r.b.replies || [])[0] || {}).text || '';
    check('CB2-10', c.b.conversation.state === 'waiting_sales' && Number(ob) >= 1 && /nhân viên/i.test(txt) && !/\d+\s*phút/.test(txt) && c.b.poll_ms === 4000,
      `state=${c.b.conversation.state} outbox=${ob} poll=${c.b.poll_ms} reply="${txt.slice(0, 80)}"`);
  });

  // CB2-11 take / staff message / bot silence / release
  await step('CB2-11', async () => {
    const notTaken = await req('POST', `${INBOX}/conversations/${CID}/messages`, { token: sales, body: { text: 'chào' } });
    const take = await req('POST', `${INBOX}/conversations/${CID}/take`, { token: sales });
    const cm = await msg(S1.tok, 'Em ơi cho chị hỏi thêm');
    const staff = await req('POST', `${INBOX}/conversations/${CID}/messages`, { token: sales, body: { text: `Chào chị, em hỗ trợ ${T}` } });
    const c = await conv(S1.tok);
    const sm = (c.b.messages || []).find((m) => m.role === 'staff');
    const rel = await req('POST', `${INBOX}/conversations/${CID}/release`, { token: sales });
    const c2 = await conv(S1.tok);
    const ok = notTaken.s === 409 && code(notTaken) === 'NOT_TAKEN' && take.s < 300 && (cm.b.replies || []).length === 0 && staff.s < 300 &&
      !!sm && sm.sender_label === 'Nhân viên HULA' && !('sender_user_id' in sm) && !/sales01/.test(j(c.b)) && c.b.conversation.human_active === true && rel.s < 300 && c2.b.conversation.human_active === false;
    check('CB2-11', ok,
      `notTaken=${notTaken.s}/${code(notTaken)} take=${take.s} botRepliesWhileHuman=${(cm.b.replies || []).length} staff=${staff.s} label=${sm && sm.sender_label} leaksUserId=${sm && 'sender_user_id' in sm} release=${rel.s} human_active ${c.b.conversation && c.b.conversation.human_active}→${c2.b.conversation && c2.b.conversation.human_active}`);
  });

  // CB2-12 T35 takeover during bot generation
  await step('CB2-12', async () => {
    const S5 = await newSession();
    await act(S5.tok, 'start', 'parent');
    const cid = convId(S5.code);
    const pending = msg(S5.tok, 'Bé 4 tuổi [[delay:3000]]');
    await sleep(800);
    const take = await req('POST', `${INBOX}/conversations/${cid}/take`, { token: sales });
    const r = await pending;
    const aiAfter = sql(`select count(*) from chatbot_messages m where m.conversation_id='${cid}' and m.role='ai' and m.created_at > (select max(created_at) from chatbot_messages where conversation_id='${cid}' and role='customer')`);
    check('CB2-12', take.s < 300 && r.s === 200 && (r.b.replies || []).length === 0 && aiAfter === '0', `take=${take.s} replies=${(r.b.replies || []).length} aiRowsAfterCustomer=${aiAfter}`);
  });

  // CB2-13 request admin: internal fields hidden from customer; transitions
  await step('CB2-13', async () => {
    const d = await req('GET', `${INBOX}/requests/${REQ.id}`, { token: sales });
    const u1 = await req('PUT', `${INBOX}/requests/${REQ.id}`, { token: sales, body: { status: 'assigned', owner_user_id: adminId, internal_note: `SECRET_NOTE_${T}` } });
    const back = await req('PUT', `${INBOX}/requests/${REQ.id}`, { token: sales, body: { status: 'received' } });
    const c = await conv(S1.tok);
    const pub = j(c.b);
    const leak = pub.includes('SECRET_NOTE') || pub.includes('owner_user_id') || pub.includes('customer_id') || pub.includes(PHONE) || pub.includes('internal_note');
    const cancel = await req('PUT', `${INBOX}/requests/${REQ.id}`, { token: sales, body: { status: 'cancelled' } });
    const kt = await req('PUT', `${INBOX}/requests/${REQ.id}`, { token: ketoan, body: { status: 'closed' } });
    check('CB2-13', d.s === 200 && d.b.customer && d.b.customer.code === `LEAD-${REQ.code}` && u1.s === 200 && back.s === 400 && code(back) === 'INVALID_TRANSITION' && !leak && cancel.s === 200 && kt.s === 403,
      `detail=${d.s} customer=${d.b.customer && d.b.customer.code} assign=${u1.s} backwards=${back.s}/${code(back)} customerLeak=${leak} cancel=${cancel.s} ketoanUpdate=${kt.s}`);
  });

  // CB2-14 outbox run: in-app sent, email fails and is retried (T27)
  await step('CB2-14', async () => {
    const run = await req('POST', `${INBOX}/outbox/run`, { token: admin });
    const inapp = sql(`select status from chatbot_outbox where event='request.created' and channel='inapp' and ref_id='${REQ.id}'`);
    const email = sql(`select status||'|'||attempts||'|'||(next_attempt_at > now())::text||'|'||coalesce(last_error,'') from chatbot_outbox where event='request.created' and channel='email' and ref_id='${REQ.id}'`);
    const notif = sql(`select count(*) from notifications where user_id=${adminId} and link like '/chatbot/%'`);
    const ob = await req('GET', `${INBOX}/outbox`, { token: sales });
    const [st, att, future, err] = email.split('|');
    check('CB2-14', run.s < 300 && inapp === 'sent' && Number(notif) >= 1 && st === 'pending' && Number(att) >= 1 && future === 'true' && err.length > 0 && !err.includes('@') && ob.s === 200 && typeof ob.b.failed_count === 'number',
      `run=${run.s} ${short(run.b)} inapp=${inapp} email=${st}/attempts=${att}/retryLater=${future}/errHasAt=${err.includes('@')} notifications=${notif} failed_count=${ob.b && ob.b.failed_count}`);
  });

  // CB2-15 flag off closes public chat; config shows enabled false
  await step('CB2-15', async () => {
    const cur = (await req('GET', '/chatbot/admin/config', { token: admin })).b;
    await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...cur, enabled: false } });
    const pc = await req('GET', '/public/chat/config');
    const m = await msg(S1.tok, 'còn đó không');
    check('CB2-15', pc.b.enabled === false && m.s === 503, `config=${short(pc.b)} message=${m.s}`);
  });

  const fails = results.filter((r) => !r.ok).map((r) => r.id);
  log(`=== RESULT ${results.length - fails.length}/${results.length} PASS${fails.length ? ' — FAIL: ' + fails.join(',') : ''}`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e && e.stack); process.exit(1); });
