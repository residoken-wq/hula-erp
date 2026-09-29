#!/usr/bin/env node
/*
 * Chatbot conversation-flow ("Sơ đồ kịch bản") acceptance harness.
 * Backend: NODE_ENV=development (sync ON, like prod), CHATBOT_LLM_PROVIDER unset/fake, freshly pgenv-reset DB.
 * Env: CB_BASE (default http://localhost:3999/api), CB_DB, CB_PSQL, CB_PGHOST/CB_PGUSER/CB_PGPASSWORD.
 * Also checks the website widget + CMS statically (quick replies, uuid client ids, editor wiring).
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
const F = '/chatbot/admin/flows';

const results = [];
const log = (...a) => console.log(...a);
const sql = (q) => { try { return execFileSync(PSQL, ['-w', '-h', PG.host, '-U', PG.user, '-d', DB, '-At', '-c', q], { env: { ...process.env, PGPASSWORD: PG.pass }, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim(); } catch { return 'SQLERR'; } };
const esc = (s) => String(s).replace(/'/g, "''");
const j = (x) => JSON.stringify(x);
const short = (x) => j(x).slice(0, 220);
const uuid = () => crypto.randomUUID();
const read = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };

async function req(method, p, { token, chat, body } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  if (chat) h['X-Chat-Session'] = chat;
  const r = await fetch(BASE + p, { method, headers: h, body: body === undefined ? undefined : j(body) });
  const t = await r.text();
  let b; try { b = JSON.parse(t); } catch { b = t; }
  return { s: r.status, b };
}
async function login(u) { const r = await req('POST', '/auth/login', { body: { username: u, password: 'test-local' } }); if (!r.b || !r.b.access_token) throw new Error('login ' + u); return r.b.access_token; }
function check(id, ok, detail) { results.push({ id, ok }); log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail || ''}`); }
async function step(id, fn) { try { await fn(); } catch (e) { check(id, false, 'ERROR ' + String((e && e.message) || e).split(/\r?\n/)[0]); } }
async function newSession() { const r = await req('POST', '/public/chat/sessions', { body: {} }); return { tok: r.b.session_token, code: r.b.conversation && r.b.conversation.public_code }; }
const msg = (tok, text) => req('POST', '/public/chat/messages', { chat: tok, body: { client_msg_id: uuid(), text } });
const act = (tok, action, value) => req('POST', '/public/chat/actions', { chat: tok, body: { client_msg_id: uuid(), action, value } });
const reply = (r) => ((r.b && r.b.replies) || [])[0] || {};
const convId = (pc) => sql(`select id from chatbot_conversations where public_code='${esc(pc)}'`);
const flowNode = (pc) => sql(`select node_id from chatbot_flow_states where conversation_id='${convId(pc)}'`);

const graph = () => ({
  nodes: [
    { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { start_actions: ['school'], keywords: ['dat cho truong'] } },
    { id: 'ask', type: 'message', position: { x: 300, y: 0 }, data: { text: 'FLOW-ASK {short_name}: trường cần gì ạ?', buttons: [
      { id: 'b_nem', label: 'Nệm ngủ trưa', keywords: ['nệm'] },
      { id: 'b_goi', label: 'Gối', keywords: [] },
      { id: 'b_kb', label: 'Cách vệ sinh', keywords: ['vệ sinh'] },
      { id: 'b_loose', label: 'Nút chưa nối', keywords: [] },
    ] } },
    { id: 'qty', type: 'message', position: { x: 600, y: 0 }, data: { text: 'FLOW-QTY bao nhiêu bộ ạ?', buttons: [] } },
    { id: 'kb', type: 'knowledge', position: { x: 600, y: 150 }, data: { topic: 'flowtest.care', fallback_text: 'FLOW-KB-FALLBACK' } },
    { id: 'other', type: 'handoff', position: { x: 600, y: 300 }, data: { text: 'FLOW-HANDOFF' } },
  ],
  edges: [
    { id: 'e1', source: 'start', sourceHandle: 'next', target: 'ask' },
    { id: 'e2', source: 'ask', sourceHandle: 'b_nem', target: 'qty' },
    { id: 'e3', source: 'ask', sourceHandle: 'b_goi', target: 'qty' },
    { id: 'e4', source: 'ask', sourceHandle: 'b_kb', target: 'kb' },
    { id: 'e5', source: 'ask', sourceHandle: 'other', target: 'other' },
  ],
});

(async () => {
  log(`=== accept-flow ${new Date().toISOString()} base=${BASE} db=${DB}`);
  const gid = sql("select id from user_groups where name='Planning Manager'");
  sql(`delete from group_permissions where group_id=${gid} and module_code='CHATBOT_KB'`);
  sql(`insert into group_permissions (group_id, module_code, can_view, can_create, can_update, can_delete, view_cost_price) values (${gid},'CHATBOT_KB',true,true,true,false,false)`);
  sql('delete from chatbot_flow_states; delete from chatbot_flows;');
  const admin = await login('admin');
  const sales = await login('sales01');
  const lou = await login('lou');

  const cfg0 = (await req('GET', '/chatbot/admin/config', { token: admin })).b;
  await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...cfg0, enabled: true } });

  let flowId = null;

  await step('FL-01 RBAC', async () => {
    const noKb = await req('GET', F, { token: sales });
    const louCreate = await req('POST', F, { token: lou, body: { name: 'lou draft', graph: graph() } });
    const louPublish = louCreate.b && louCreate.b.id ? await req('POST', `${F}/${louCreate.b.id}/publish`, { token: lou }) : { s: 0 };
    check('FL-01 RBAC', noKb.s === 403 && louCreate.s === 201 && louPublish.s === 403,
      `sales GET=${noKb.s} lou create=${louCreate.s} lou publish=${louPublish.s} (want 403/201/403)`);
    if (louCreate.b && louCreate.b.id) await req('DELETE', `${F}/${louCreate.b.id}`, { token: admin });
  });

  await step('FL-02 create+validate', async () => {
    const r = await req('POST', F, { token: admin, body: { name: 'Accept flow', graph: graph() } });
    flowId = r.b && r.b.id;
    const codes = ((r.b && r.b.issues) || []).map((i) => `${i.level}:${i.code}`);
    // knowledge topic not published but has fallback → warning; unconnected button → warning; no errors
    check('FL-02 create+validate', r.s === 201 && !codes.some((c) => c.startsWith('error')) && codes.includes('warning:TOPIC_NOT_PUBLISHED') && codes.includes('warning:BUTTON_UNCONNECTED'), short(codes));
  });

  await step('FL-03 publish blocks errors', async () => {
    const bad = graph();
    bad.edges = bad.edges.filter((e) => e.source !== 'start');
    const tmp = await req('POST', F, { token: admin, body: { name: 'Bad', graph: bad } });
    const p = await req('POST', `${F}/${tmp.b.id}/publish`, { token: admin });
    const codes = ((p.b && p.b.issues) || []).map((i) => i.code);
    check('FL-03 publish blocks errors', p.s === 400 && p.b.code === 'FLOW_INVALID' && codes.includes('START_UNCONNECTED'), `s=${p.s} ${short(codes)}`);
    await req('DELETE', `${F}/${tmp.b.id}`, { token: admin });
  });

  await step('FL-04 unpublished flow does not run', async () => {
    const { tok } = await newSession();
    const r = await act(tok, 'start', 'school');
    check('FL-04 unpublished flow does not run', r.s === 200 && !String(reply(r).text).includes('FLOW-ASK'), short(reply(r).text));
  });

  await step('FL-05 publish', async () => {
    const p = await req('POST', `${F}/${flowId}/publish`, { token: admin });
    check('FL-05 publish', p.s === 201 && p.b.published_version === 1 && p.b.has_unpublished_changes === false, `s=${p.s} v=${p.b && p.b.published_version}`);
  });

  let S = null;
  await step('FL-06 start button enters flow', async () => {
    S = await newSession();
    const r = await act(S.tok, 'start', 'school');
    const rp = reply(r);
    const labels = ((rp.payload && rp.payload.buttons) || []).map((b) => b.label);
    check('FL-06 start button enters flow',
      r.s === 200 && String(rp.text).startsWith('FLOW-ASK') && !String(rp.text).includes('{short_name}') && rp.payload.type === 'quick_replies' && labels.length === 4 && flowNode(S.code) === 'ask',
      `${short(rp.text)} buttons=${short(labels)} node=${flowNode(S.code)}`);
  });

  await step('FL-07 button label → branch, flow ends at leaf', async () => {
    const r = await msg(S.tok, 'Nệm ngủ trưa');
    const rp = reply(r);
    const meta = sql(`select llm_meta->>'route' from chatbot_messages where conversation_id='${convId(S.code)}' and role='ai' order by created_at desc limit 1`);
    check('FL-07 button label → branch', r.s === 200 && rp.text === 'FLOW-QTY bao nhiêu bộ ạ?' && !rp.payload && flowNode(S.code) === '' && meta === 'flow', `${short(rp.text)} node='${flowNode(S.code)}' route=${meta}`);
  });

  await step('FL-08 after flow ends, normal pipeline answers', async () => {
    const r = await msg(S.tok, 'khoảng 50 bộ');
    const meta = sql(`select coalesce(llm_meta->>'route','') from chatbot_messages where conversation_id='${convId(S.code)}' and role='ai' order by created_at desc limit 1`);
    check('FL-08 normal pipeline after flow', r.s === 200 && meta !== 'flow', `route=${meta}`);
  });

  await step('FL-09 keyword (accent-insensitive) → branch + knowledge fallback', async () => {
    const s = await newSession();
    await act(s.tok, 'start', 'school');
    const r = await msg(s.tok, 'cho hoi cach ve sinh the nao');
    check('FL-09 keyword → knowledge fallback', r.s === 200 && reply(r).text === 'FLOW-KB-FALLBACK', short(reply(r).text));
  });

  await step('FL-10 unmatched text → other branch (handoff payload)', async () => {
    const s = await newSession();
    await act(s.tok, 'start', 'school');
    const r = await msg(s.tok, 'xin chao shop');
    check('FL-10 other branch', r.s === 200 && reply(r).text === 'FLOW-HANDOFF' && reply(r).payload && reply(r).payload.type === 'handoff_suggest' && flowNode(s.code) === '', short(reply(r)));
  });

  await step('FL-11 unconnected button leaves flow', async () => {
    const s = await newSession();
    await act(s.tok, 'start', 'school');
    const r = await msg(s.tok, 'Nút chưa nối');
    const meta = sql(`select coalesce(llm_meta->>'route','') from chatbot_messages where conversation_id='${convId(s.code)}' and role='ai' order by created_at desc limit 1`);
    check('FL-11 unconnected button leaves flow', r.s === 200 && meta !== 'flow' && flowNode(s.code) === '', `route=${meta}`);
  });

  await step('FL-12 safety rules beat the flow', async () => {
    const s = await newSession();
    await act(s.tok, 'start', 'school');
    const r = await msg(s.tok, 'tôi muốn khiếu nại, nệm bị lỗi');
    const meta = sql(`select coalesce(llm_meta->>'route','') from chatbot_messages where conversation_id='${convId(s.code)}' and role='ai' order by created_at desc limit 1`);
    check('FL-12 safety beats flow', r.s === 200 && meta === 'script' && flowNode(s.code) === '', `route=${meta} node='${flowNode(s.code)}'`);
  });

  await step('FL-13 start keyword enters flow', async () => {
    const s = await newSession();
    const r = await msg(s.tok, 'Mình muốn đặt cho trường');
    check('FL-13 keyword start', r.s === 200 && String(reply(r).text).startsWith('FLOW-ASK') && flowNode(s.code) === 'ask', short(reply(r).text));
  });

  await step('FL-14 human takeover drops flow reply', async () => {
    const s = await newSession();
    await act(s.tok, 'start', 'school');
    sql(`update chatbot_conversations set human_active=true where id='${convId(s.code)}'`);
    const r = await msg(s.tok, 'Gối');
    check('FL-14 takeover drops flow reply', r.s === 200 && ((r.b && r.b.replies) || []).length === 0 && flowNode(s.code) === 'ask', `replies=${((r.b && r.b.replies) || []).length}`);
  });

  await step('FL-15 start-action conflict', async () => {
    const tmp = await req('POST', F, { token: admin, body: { name: 'Clash', graph: graph() } });
    const p = await req('POST', `${F}/${tmp.b.id}/publish`, { token: admin });
    const codes = ((p.b && p.b.issues) || []).map((i) => i.code);
    check('FL-15 start-action conflict', p.s === 400 && codes.includes('START_ACTION_TAKEN'), `s=${p.s} ${short(codes)}`);
    await req('DELETE', `${F}/${tmp.b.id}`, { token: admin });
  });

  await step('FL-16 republish: keep going if node exists, leave if removed', async () => {
    const s1 = await newSession();
    await act(s1.tok, 'start', 'school');
    const s2 = await newSession();
    await act(s2.tok, 'start', 'school');
    const g = graph();
    g.nodes.find((n) => n.id === 'qty').data.text = 'FLOW-QTY v2';
    await req('PUT', `${F}/${flowId}`, { token: admin, body: { graph: g } });
    const p2 = await req('POST', `${F}/${flowId}/publish`, { token: admin });
    const r1 = await msg(s1.tok, 'Gối');
    // v3 renames the waiting node → s2's position no longer exists
    g.nodes.find((n) => n.id === 'ask').id = 'ask2';
    g.edges.forEach((e) => { if (e.source === 'ask') e.source = 'ask2'; if (e.target === 'ask') e.target = 'ask2'; });
    await req('PUT', `${F}/${flowId}`, { token: admin, body: { graph: g } });
    const p3 = await req('POST', `${F}/${flowId}/publish`, { token: admin });
    const r2 = await msg(s2.tok, 'Gối');
    const meta2 = sql(`select coalesce(llm_meta->>'route','') from chatbot_messages where conversation_id='${convId(s2.code)}' and role='ai' order by created_at desc limit 1`);
    check('FL-16 republish', p2.b.published_version === 2 && p3.b.published_version === 3 && reply(r1).text === 'FLOW-QTY v2' && meta2 !== 'flow' && flowNode(s2.code) === '',
      `r1=${short(reply(r1).text)} s2 route=${meta2}`);
  });

  await step('FL-17 disable → legacy start reply', async () => {
    const d = await req('POST', `${F}/${flowId}/enabled`, { token: admin, body: { enabled: false } });
    const s = await newSession();
    const r = await act(s.tok, 'start', 'school');
    check('FL-17 disable', d.s === 201 && r.s === 200 && !String(reply(r).text).includes('FLOW-ASK') && !reply(r).payload, short(reply(r).text));
    await req('POST', `${F}/${flowId}/enabled`, { token: admin, body: { enabled: true } });
  });

  await step('FL-18 junk graph is sanitized', async () => {
    const r = await req('POST', F, { token: admin, body: { name: 'Junk', graph: { nodes: [{ id: '../x', type: 'script', data: {} }, { id: 'ok', type: 'end', data: { text: 'x'.repeat(5000) }, evil: 1 }], edges: [{ source: 'ok', target: 'nope' }] } } });
    const nodes = (r.b && r.b.draft_graph && r.b.draft_graph.nodes) || [];
    check('FL-18 junk sanitized', r.s === 201 && nodes.length === 1 && nodes[0].data.text.length === 1000 && nodes[0].evil === undefined && r.b.draft_graph.edges.length === 0, `nodes=${nodes.length}`);
    if (r.b && r.b.id) await req('DELETE', `${F}/${r.b.id}`, { token: admin });
  });

  await step('FL-19 static: widget + CMS wiring', async () => {
    const ctx = read('hula-web/website/src/components/chat/ChatWidgetContext.tsx') || '';
    const panel = read('hula-web/website/src/components/chat/ChatPanel.tsx') || '';
    const cmsPkg = read('hula-web/cms/package.json') || '';
    const editor = read('hula-web/cms/src/app/chatbot/flows/[id]/page.tsx') || '';
    const menu = read('hula-web/cms/src/components/AdminLayout.tsx') || '';
    const ok = !/'msg_'|'act_'/.test(ctx) && /randomUUID/.test(ctx) && /quick_replies/.test(panel) && /handoff_suggest/.test(panel) &&
      /@xyflow\/react/.test(cmsPkg) && /chatbotFlowApi\.publish/.test(editor) && /\/chatbot\/flows/.test(menu);
    check('FL-19 static wiring', ok, '');
  });

  await req('PUT', '/chatbot/admin/config', { token: admin, body: { ...cfg0 } });
  const fail = results.filter((r) => !r.ok);
  log(`=== ${results.length - fail.length}/${results.length} PASS${fail.length ? ' — FAIL: ' + fail.map((f) => f.id).join(', ') : ''}`);
  process.exit(fail.length ? 1 : 0);
})();
