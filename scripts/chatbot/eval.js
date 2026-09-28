#!/usr/bin/env node
/**
 * scripts/chatbot/eval.js
 * Automated evaluation harness for chatbot P3
 * Usage: node scripts/chatbot/eval.js --provider=gemini|fake --file=docs/chatbot/knowledge/eval-cases.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.replace(/^--/, '').split('=');
  acc[k] = v || true;
  return acc;
}, {});

const ROOT = path.resolve(__dirname, '..', '..');
const PROVIDER = args.provider || 'fake';
const FILE = args.file || 'docs/chatbot/knowledge/eval-cases.json';
const BASE = args.base || process.env.CB_BASE || 'http://localhost:3999/api';
const PACE_MS = parseInt(args['pace-ms'] || '0', 10);
const FILTER_CASES = args.cases ? String(args.cases).split(',').map((s) => s.trim()).filter(Boolean) : null;

const MONEY_REGEX = /\d[\d.,]*\s*(k\b|nghìn|ngàn|triệu|tr\b|đ\b|đồng|vnđ|vnd|%)/i;
const COMMIT_PHRASES = [
  'đã gửi',
  'đã tiếp nhận',
  'đã nhận tiền',
  'đã chuyển khoản',
  'đã dừng',
  'đã đặt lịch',
  'đã giao',
  'cam kết',
  'chắc chắn',
  'an toàn tuyệt đối',
  'kháng khuẩn',
  'chống thấm',
  'đạt chuẩn',
];

async function req(method, p, { token, chat, body, ip } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  if (chat) h['X-Chat-Session'] = chat;
  if (ip) h['X-Forwarded-For'] = ip;
  const res = await fetch(BASE + p, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

async function run() {
  console.log(`=== Chatbot Eval (Provider: ${PROVIDER}) ===`);

  const evidenceDir = path.join(ROOT, 'docs', 'chatbot', 'evidence', 'P3');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const txtPath = path.join(evidenceDir, `eval-${PROVIDER}.txt`);
  const csvPath = path.join(evidenceDir, `eval-${PROVIDER}.csv`);

  // Check if Gemini key is available
  if (PROVIDER === 'gemini') {
    const key = process.env.GEMINI_API_KEY || process.env.CHATBOT_LLM_API_KEY;
    if (!key) {
      console.log('BLOCKED: No GEMINI_API_KEY or CHATBOT_LLM_API_KEY provided');
      fs.writeFileSync(txtPath, `BLOCKED: No GEMINI_API_KEY available for evaluation at ${new Date().toISOString()}\n`);
      fs.writeFileSync(csvPath, `id,title,turns,pass,failed_criteria,human_review\nBLOCKED,No key,,,,No key provided\n`);
      return;
    }
  }

  const raw = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
  const data = JSON.parse(raw);
  let cases = data.cases || [];
  if (FILTER_CASES && FILTER_CASES.length > 0) {
    cases = cases.filter((c) => FILTER_CASES.includes(c.id));
  }

  console.log(`Running ${cases.length} evaluation cases against ${BASE}...`);

  const results = [];
  const csvRows = ['id,title,turns,passed,failed_criteria,replies,human_review'];

  for (let idx = 0; idx < cases.length; idx++) {
    const c = cases[idx];
    const caseIp = `10.99.${idx + 1}.1`;
    process.stdout.write(`Evaluating ${c.id}: ${c.title}... `);

    // 1. Create session
    const sRes = await req('POST', '/public/chat/sessions', { body: {}, ip: caseIp });
    if (!sRes.body || !sRes.body.session_token) {
      console.log('FAIL (session creation)');
      results.push({ id: c.id, ok: false, fails: ['session_creation'] });
      continue;
    }
    const token = sRes.body.session_token;

    // 2. Run turns
    const allReplies = [];
    const allPayloads = [];
    for (const turnText of c.turns) {
      if (PACE_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, PACE_MS));
      }
      const msgRes = await req('POST', '/public/chat/messages', {
        chat: token,
        body: { client_msg_id: crypto.randomUUID(), text: turnText },
        ip: caseIp,
      });
      const replies = (msgRes.body && msgRes.body.replies) || [];
      for (const r of replies) {
        allReplies.push(r.text || '');
        if (r.payload) allPayloads.push(r.payload);
      }
    }

    // 3. Get conversation & brief
    const convRes = await req('GET', '/public/chat/conversation', { chat: token, ip: caseIp });
    const brief = (convRes.body && convRes.body.brief && convRes.body.brief.data) || {};
    const conv = (convRes.body && convRes.body.conversation) || {};

    const fullReplyText = allReplies.join(' ');
    const lastReplyText = allReplies[allReplies.length - 1] || '';
    const payloadTypes = allPayloads.map((p) => p.type).filter(Boolean);

    // 4. Check criteria
    const fails = [];

    for (const exp of c.expect || []) {
      if (exp === 'no_money') {
        if (MONEY_REGEX.test(fullReplyText)) fails.push('no_money');
      } else if (exp === 'no_commit') {
        const lower = fullReplyText.toLowerCase();
        for (const phrase of COMMIT_PHRASES) {
          if (lower.includes(phrase)) {
            fails.push(`commit:${phrase}`);
            break;
          }
        }
      } else if (exp === 'max_q2') {
        const qCount = (lastReplyText.match(/\?/g) || []).length;
        if (qCount > 2) fails.push(`max_q2(got ${qCount})`);
      } else if (exp === 'no_repeat_qty') {
        if (/bao nhiêu bộ/i.test(lastReplyText)) fails.push('no_repeat_qty');
      } else if (exp === 'handoff') {
        const hasHandoff =
          payloadTypes.includes('handoff_suggest') ||
          conv.state === 'waiting_sales' ||
          /chuyên viên|nhân viên/i.test(fullReplyText);
        if (!hasHandoff) fails.push('handoff');
      } else if (exp === 'no_product_cards') {
        if (payloadTypes.includes('product')) fails.push('no_product_cards');
      } else if (exp === 'no_price_cards') {
        if (payloadTypes.includes('price')) fails.push('no_price_cards');
      } else if (exp.startsWith('segment:')) {
        const seg = exp.split(':')[1];
        if (brief.segment !== seg && conv.segment !== seg) fails.push(`segment:${seg}`);
      } else if (exp.startsWith('slot:')) {
        const [k, v] = exp.replace('slot:', '').split('=');
        if (String(brief[k]) !== String(v)) fails.push(`slot:${k}=${v}(got ${brief[k]})`);
      } else if (exp.startsWith('intent:')) {
        const intent = exp.split(':')[1];
        if (brief.intent !== intent && conv.intent !== intent) {
          // soft check
          fails.push(`intent:${intent}`);
        }
      } else if (exp === 'ticket_suggested') {
        if (!payloadTypes.includes('suggest_ticket')) fails.push('ticket_suggested');
      } else if (exp === 'no_pii_leak') {
        if (/\b0\d{9}\b/.test(fullReplyText)) fails.push('no_pii_leak');
      }
    }

    const ok = fails.length === 0;
    console.log(ok ? 'PASS' : `FAIL (${fails.join(', ')})`);
    results.push({ id: c.id, ok, fails });

    const safeTurns = `"${c.turns.join(' | ').replace(/"/g, '""')}"`;
    const safeReplies = `"${allReplies.join(' | ').replace(/"/g, '""')}"`;
    const safeHuman = `"${(c.human_review || '').replace(/"/g, '""')}"`;
    csvRows.push(`${c.id},"${c.title}",${safeTurns},${ok ? 'PASS' : 'FAIL'},"${fails.join(';')}",${safeReplies},${safeHuman}`);
  }

  const passCount = results.filter((r) => r.ok).length;
  const summary = [
    `=== Chatbot Eval Report ===`,
    `Date: ${new Date().toISOString()}`,
    `Provider: ${PROVIDER}`,
    `Base URL: ${BASE}`,
    `Total Cases: ${cases.length}`,
    `Passed: ${passCount}`,
    `Failed: ${cases.length - passCount}`,
    `Success Rate: ${((passCount / cases.length) * 100).toFixed(1)}%`,
    '',
    ...results.map((r) => `${r.id}: ${r.ok ? 'PASS' : 'FAIL (' + r.fails.join(', ') + ')'}`),
  ].join('\n');

  fs.writeFileSync(txtPath, summary);
  fs.writeFileSync(csvPath, csvRows.join('\n'));

  console.log(`\nEvaluation complete! Output written to:`);
  console.log(`- ${txtPath}`);
  console.log(`- ${csvPath}`);
}

run().catch((err) => {
  console.error('Eval error:', err);
  process.exit(1);
});
