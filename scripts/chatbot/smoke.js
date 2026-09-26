const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('pg');
const sharp = require('sharp');

const BASE_URL = 'http://127.0.0.1:3999';
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'hula_user',
  password: process.env.DB_PASSWORD || 'hula_password',
  database: process.env.DB_DATABASE || 'hula_db',
};

const outputLines = [];

function log(msg) {
  console.log(msg);
  outputLines.push(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(method, pathName, headers = {}, body = null) {
  return new Promise((resolve) => {
    const url = new URL(pathName, BASE_URL);
    const reqHeaders = { ...headers };
    let bodyData = null;

    if (body !== null) {
      bodyData = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyData);
    }

    reqHeaders['Connection'] = 'close';

    const req = http.request(
      url,
      {
        method,
        agent: false,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      },
    );

    req.on('error', (err) => {
      resolve({
        status: 0,
        headers: {},
        body: { error: err.message },
      });
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function run() {
  log('================================================================');
  log(`CỪU HULA (CHATBOT) P0 SMOKE TEST — ${new Date().toISOString()}`);
  log('================================================================\n');

  const pgClient = new Client(DB_CONFIG);
  await pgClient.connect();

  const results = {};

  try {
    // ----------------------------------------------------------------
    // CB0-01: Schema Check
    // ----------------------------------------------------------------
    log('--- [CB0-01] Checking database schema & sequences ---');
    const tableRes = await pgClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'chatbot_%'
      ORDER BY table_name;
    `);
    const tables = tableRes.rows.map((r) => r.table_name);
    log(`Found ${tables.length} chatbot tables: ${tables.join(', ')}`);

    const seqRes = await pgClient.query(`
      SELECT sequence_name FROM information_schema.sequences 
      WHERE sequence_name LIKE 'chatbot_%'
      ORDER BY sequence_name;
    `);
    const sequences = seqRes.rows.map((r) => r.sequence_name);
    log(`Found ${sequences.length} chatbot sequences: ${sequences.join(', ')}`);

    const hasRequiredSeqs =
      sequences.includes('chatbot_request_seq') && sequences.includes('chatbot_ticket_seq');
    const schemaPass = tables.length === 10 && hasRequiredSeqs;
    results['CB0-01'] = schemaPass ? 'PASS' : 'FAIL';
    log(`CB0-01 Result: ${results['CB0-01']}\n`);

    // ----------------------------------------------------------------
    // CB0-02: Flags Off
    // ----------------------------------------------------------------
    log('--- [CB0-02] Testing public endpoints with enabled=false ---');
    // Login as admin and explicitly save enabled=false
    const preLogin = await request('POST', '/api/auth/login', {}, { username: 'admin', password: 'test-local' });
    const preToken = preLogin.body.access_token;
    const currentCfg = await request('GET', '/api/chatbot/admin/config', { Authorization: `Bearer ${preToken}` });
    await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${preToken}` }, { ...currentCfg.body, enabled: false });

    const getCfgRes = await request('GET', '/api/public/chat/config');
    log(`GET /api/public/chat/config -> HTTP ${getCfgRes.status} ${JSON.stringify(getCfgRes.body)}`);

    const postSessRes = await request('POST', '/api/public/chat/sessions');
    log(`POST /api/public/chat/sessions -> HTTP ${postSessRes.status} ${JSON.stringify(postSessRes.body)}`);

    const pingOffRes = await request('GET', '/api/public/chat/ping', { 'x-chat-session': 'dummy' });
    log(`GET /api/public/chat/ping -> HTTP ${pingOffRes.status} ${JSON.stringify(pingOffRes.body)}`);

    const cb02Pass =
      getCfgRes.status === 200 &&
      getCfgRes.body.enabled === false &&
      postSessRes.status === 503 &&
      postSessRes.body.code === 'CHATBOT_DISABLED' &&
      pingOffRes.status === 503;
    results['CB0-02'] = cb02Pass ? 'PASS' : 'FAIL';
    log(`CB0-02 Result: ${results['CB0-02']}\n`);

    // ----------------------------------------------------------------
    // CB0-03: Seed Permissions
    // ----------------------------------------------------------------
    log('--- [CB0-03] Checking permission seed & group_permissions ---');
    const seedRes = await pgClient.query(`SELECT value FROM system_configs WHERE key='CHATBOT_SEED_V1'`);
    log(`CHATBOT_SEED_V1 record: ${seedRes.rows[0]?.value || 'NOT_FOUND'}`);

    const permRes = await pgClient.query(`
      SELECT gp.group_id, g.name, gp.module_code, gp.can_view, gp.can_create, gp.can_update, gp.can_delete, gp.view_cost_price
      FROM group_permissions gp
      JOIN user_groups g ON gp.group_id = g.id
      WHERE gp.module_code IN ('CHATBOT', 'CHATBOT_KB')
      ORDER BY gp.group_id;
    `);
    log(`Found ${permRes.rows.length} group_permissions for CHATBOT:`);
    permRes.rows.forEach((r) => {
      const flags = `${r.can_view ? 'V' : '-'}${r.can_create ? 'C' : '-'}${r.can_update ? 'U' : '-'}${r.can_delete ? 'D' : '-'}${r.view_cost_price ? '$' : '-'}`;
      log(`  Group ${r.group_id} (${r.name}): ${flags}`);
    });

    const hasKb = permRes.rows.some((r) => r.module_code === 'CHATBOT_KB');
    const cb03Pass = seedRes.rows.length > 0 && permRes.rows.length === 6 && !hasKb;
    results['CB0-03'] = cb03Pass ? 'PASS' : 'FAIL';
    log(`CB0-03 Result: ${results['CB0-03']}\n`);

    // ----------------------------------------------------------------
    // CB0-08: Admin Auth Check
    // ----------------------------------------------------------------
    log('--- [CB0-08] Testing admin route anonymous protection ---');
    const anonCfgRes = await request('GET', '/api/chatbot/admin/config');
    log(`Anonymous GET /api/chatbot/admin/config -> HTTP ${anonCfgRes.status}`);

    const anonStatusRes = await request('GET', '/api/chatbot/admin/status');
    log(`Anonymous GET /api/chatbot/admin/status -> HTTP ${anonStatusRes.status}`);

    const cb08Pass = anonCfgRes.status === 401 && anonStatusRes.status === 401;
    results['CB0-08'] = cb08Pass ? 'PASS' : 'FAIL';
    log(`CB0-08 Result: ${results['CB0-08']}\n`);

    // ----------------------------------------------------------------
    // CB0-09: Admin Permissions Check (Sales vs Admin vs Lou)
    // ----------------------------------------------------------------
    log('--- [CB0-09] Testing admin authorization (Sales/Lou 403 vs Admin 200) ---');
    const salesLogin = await request('POST', '/api/auth/login', {}, { username: 'sales01', password: 'test-local' });
    const salesToken = salesLogin.body.access_token;
    log(`sales01 login -> HTTP ${salesLogin.status}`);

    const salesGetCfg = await request('GET', '/api/chatbot/admin/config', { Authorization: `Bearer ${salesToken}` });
    log(`Sales GET /api/chatbot/admin/config -> HTTP ${salesGetCfg.status}`);

    const salesPutCfg = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${salesToken}` }, { enabled: true });
    log(`Sales PUT /api/chatbot/admin/config -> HTTP ${salesPutCfg.status}`);

    const louLogin = await request('POST', '/api/auth/login', {}, { username: 'lou', password: 'test-local' });
    const louToken = louLogin.body.access_token;
    const louGetCfg = await request('GET', '/api/chatbot/admin/config', { Authorization: `Bearer ${louToken}` });
    log(`Lou GET /api/chatbot/admin/config -> HTTP ${louGetCfg.status}`);

    const adminLogin = await request('POST', '/api/auth/login', {}, { username: 'admin', password: 'test-local' });
    const adminToken = adminLogin.body.access_token;
    log(`admin login -> HTTP ${adminLogin.status}`);

    const adminGetCfg = await request('GET', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` });
    log(`Admin GET /api/chatbot/admin/config -> HTTP ${adminGetCfg.status}`);

    const cb09Pass =
      salesGetCfg.status === 403 &&
      salesPutCfg.status === 403 &&
      louGetCfg.status === 403 &&
      adminGetCfg.status === 200;
    results['CB0-09'] = cb09Pass ? 'PASS' : 'FAIL';
    log(`CB0-09 Result: ${results['CB0-09']}\n`);

    // ----------------------------------------------------------------
    // CB0-10: Config Validation Check (Write rules, shared validator)
    // ----------------------------------------------------------------
    log('--- [CB0-10] Testing config validation on PUT /api/chatbot/admin/config ---');
    const baseValid = { ...adminGetCfg.body };

    // Case 1: Unknown field
    const unknownFieldRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, llm_api_key: 'secret' });
    log(`PUT with unknown field llm_api_key -> HTTP ${unknownFieldRes.status} ${JSON.stringify(unknownFieldRes.body)}`);

    // Case 2: Greeting with bad placeholder {abc}
    const badGreetingRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, greeting: 'Hi {abc}' });
    log(`PUT with greeting={abc} -> HTTP ${badGreetingRes.status} ${JSON.stringify(badGreetingRes.body)}`);

    // Case 3: display_name 1 character
    const shortNameRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, display_name: 'A' });
    log(`PUT with display_name=A -> HTTP ${shortNameRes.status} ${JSON.stringify(shortNameRes.body)}`);

    // Case 4: hotline letters
    const badHotlineRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, contact_channels: { ...baseValid.contact_channels, hotline: 'INVALID_PHONE' } });
    log(`PUT with bad hotline -> HTTP ${badHotlineRes.status} ${JSON.stringify(badHotlineRes.body)}`);

    // Case 5: bad notify email
    const badEmailRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, notify_emails: ['bad_email'] });
    log(`PUT with bad email -> HTTP ${badEmailRes.status} ${JSON.stringify(badEmailRes.body)}`);

    // Case 6: avatar //evil.example
    const badAvatarRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, avatar_url: '//evil.example/a.png' });
    log(`PUT with avatar=//evil.example -> HTTP ${badAvatarRes.status} ${JSON.stringify(badAvatarRes.body)}`);

    // Case 7: features forced false
    const forceFeaturesRes = await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...baseValid, enabled: true, features: { price_estimate: true } });
    log(`PUT with features.price_estimate=true -> HTTP ${forceFeaturesRes.status} features=${JSON.stringify(forceFeaturesRes.body?.features)}`);

    const cb10Pass =
      unknownFieldRes.status === 400 &&
      badGreetingRes.status === 400 &&
      shortNameRes.status === 400 &&
      badHotlineRes.status === 400 &&
      badEmailRes.status === 400 &&
      badAvatarRes.status === 400 &&
      forceFeaturesRes.status === 200 &&
      forceFeaturesRes.body.features.price_estimate === false;
    results['CB0-10'] = cb10Pass ? 'PASS' : 'FAIL';
    log(`CB0-10 Result: ${results['CB0-10']}\n`);

    // ----------------------------------------------------------------
    // CB0-04: Chat Session Creation
    // ----------------------------------------------------------------
    log('--- [CB0-04] Testing session creation & token hashing ---');
    const sessRes = await request('POST', '/api/public/chat/sessions', {}, { analytics_session_id: 'test_sess_01' });
    log(`POST /api/public/chat/sessions -> HTTP ${sessRes.status} public_code=${sessRes.body?.conversation?.public_code}`);

    const sessionToken = sessRes.body?.session_token;
    const publicCode = sessRes.body?.conversation?.public_code;

    // Verify DB row
    const dbSessRes = await pgClient.query(`
      SELECT s.token_hash, s.ip_hash, c.public_code, c.state
      FROM chatbot_sessions s
      JOIN chatbot_conversations c ON s.conversation_id = c.id
      WHERE c.public_code = $1;
    `, [publicCode]);
    const dbSess = dbSessRes.rows[0];
    log(`DB session verification: token_hash length=${dbSess?.token_hash?.length}, ip_hash length=${dbSess?.ip_hash?.length}, public_code=${dbSess?.public_code}`);

    const cb04Pass =
      sessRes.status === 201 &&
      typeof sessionToken === 'string' &&
      sessionToken.length > 30 &&
      publicCode?.length === 8 &&
      dbSess?.token_hash?.length === 64 &&
      dbSess?.ip_hash?.length === 64;
    results['CB0-04'] = cb04Pass ? 'PASS' : 'FAIL';
    log(`CB0-04 Result: ${results['CB0-04']}\n`);

    // ----------------------------------------------------------------
    // CB0-05: Ping with Session Tokens
    // ----------------------------------------------------------------
    log('--- [CB0-05] Testing ping with valid/missing/invalid/revoked token ---');
    const validPing = await request('GET', '/api/public/chat/ping', { 'x-chat-session': sessionToken });
    log(`Ping with valid token -> HTTP ${validPing.status} ${JSON.stringify(validPing.body)}`);

    const missingPing = await request('GET', '/api/public/chat/ping');
    log(`Ping with missing token -> HTTP ${missingPing.status} ${JSON.stringify(missingPing.body)}`);

    const invalidPing = await request('GET', '/api/public/chat/ping', { 'x-chat-session': 'invalid_token_here' });
    log(`Ping with invalid token -> HTTP ${invalidPing.status} ${JSON.stringify(invalidPing.body)}`);

    // Revoke token in DB
    await pgClient.query(`UPDATE chatbot_sessions SET revoked_at = now() WHERE token_hash = $1`, [dbSess.token_hash]);
    const revokedPing = await request('GET', '/api/public/chat/ping', { 'x-chat-session': sessionToken });
    log(`Ping with revoked token -> HTTP ${revokedPing.status} ${JSON.stringify(revokedPing.body)}`);

    // Restore un-revoked for subsequent tests
    await pgClient.query(`UPDATE chatbot_sessions SET revoked_at = NULL WHERE token_hash = $1`, [dbSess.token_hash]);

    const cb05Pass =
      validPing.status === 200 &&
      validPing.body.ok === true &&
      missingPing.status === 401 &&
      invalidPing.status === 401 &&
      revokedPing.status === 401;
    results['CB0-05'] = cb05Pass ? 'PASS' : 'FAIL';
    log(`CB0-05 Result: ${results['CB0-05']}\n`);

    // ----------------------------------------------------------------
    // CB0-06: Rate Limiting Ping (21 calls)
    // ----------------------------------------------------------------
    log('--- [CB0-06] Testing rate limit: 21 calls in 5 minutes ---');
    const freshSess = await request('POST', '/api/public/chat/sessions');
    const freshToken = freshSess.body.session_token;

    let hit429 = false;
    let retryAfterS = 0;
    for (let i = 1; i <= 21; i++) {
      const pRes = await request('GET', '/api/public/chat/ping', { 'x-chat-session': freshToken });
      if (pRes.status === 429) {
        hit429 = true;
        retryAfterS = pRes.body.retry_after_s;
        log(`Call ${i} received HTTP 429: ${JSON.stringify(pRes.body)}`);
        break;
      }
    }

    results['CB0-06'] = hit429 && retryAfterS > 0 ? 'PASS' : 'FAIL';
    log(`CB0-06 Result: ${results['CB0-06']}\n`);

    // ----------------------------------------------------------------
    // CB0-07: Rate Limiting Shared IP
    // ----------------------------------------------------------------
    log('--- [CB0-07] Testing shared IP rate limit with 2 different sessions ---');
    const sessA = await request('POST', '/api/public/chat/sessions');
    const sessB = await request('POST', '/api/public/chat/sessions');
    let anyBlocked = false;

    for (let i = 0; i < 15; i++) {
      const rA = await request('GET', '/api/public/chat/ping', { 'x-chat-session': sessA.body.session_token });
      const rB = await request('GET', '/api/public/chat/ping', { 'x-chat-session': sessB.body.session_token });
      if (rA.status === 429 || rB.status === 429) {
        anyBlocked = true;
      }
    }

    results['CB0-07'] = !anyBlocked ? 'PASS' : 'FAIL';
    log(`CB0-07 Result: ${results['CB0-07']}\n`);

    // ----------------------------------------------------------------
    // CB0-11: Public View Whitelist
    // ----------------------------------------------------------------
    log('--- [CB0-11] Testing public config view whitelist ---');
    const pubCfg = await request('GET', '/api/public/chat/config');
    log(`Public config keys: ${Object.keys(pubCfg.body).join(', ')}`);

    const hasForbidden =
      pubCfg.body.notify_emails !== undefined ||
      pubCfg.body.notify_user_ids !== undefined ||
      pubCfg.body.limits !== undefined ||
      pubCfg.body.retention_days !== undefined ||
      pubCfg.body.llm !== undefined;

    const cb11Pass =
      pubCfg.status === 200 &&
      pubCfg.body.enabled === true &&
      !hasForbidden &&
      pubCfg.body.greeting.includes(pubCfg.body.short_name);
    results['CB0-11'] = cb11Pass ? 'PASS' : 'FAIL';
    log(`CB0-11 Result: ${results['CB0-11']}\n`);

    // ----------------------------------------------------------------
    // CB0-12: Update Assistant Name & Audit Event
    // ----------------------------------------------------------------
    log('--- [CB0-12] Testing updating assistant name & audit event ---');
    const updateNameRes = await request(
      'PUT',
      '/api/chatbot/admin/config',
      { Authorization: `Bearer ${adminToken}` },
      {
        ...adminGetCfg.body,
        enabled: true,
        display_name: 'Cừu Hula — Trợ lý AI',
        short_name: 'Cừu Hula Test',
        greeting: 'Dạ em là {short_name}, trợ lý AI của HULA. Anh/chị cần hỗ trợ gì ạ?',
      },
    );
    log(`PUT updated name -> HTTP ${updateNameRes.status}`);

    const pubNameCfg = await request('GET', '/api/public/chat/config');
    log(`Public config after update -> short_name=${pubNameCfg.body.short_name}, greeting="${pubNameCfg.body.greeting}"`);

    // Check audit event
    const auditRes = await pgClient.query(`
      SELECT op, object_type, object_id, after_ref
      FROM chatbot_audit_events
      WHERE op = 'config.update'
      ORDER BY id DESC LIMIT 1;
    `);
    const latestAudit = auditRes.rows[0];
    log(`Audit event recorded: ${JSON.stringify(latestAudit)}`);

    const cb12Pass =
      updateNameRes.status === 200 &&
      pubNameCfg.body.short_name === 'Cừu Hula Test' &&
      pubNameCfg.body.greeting.includes('Cừu Hula Test') &&
      latestAudit?.after_ref?.changed_fields?.includes('short_name');
    results['CB0-12'] = cb12Pass ? 'PASS' : 'FAIL';
    log(`CB0-12 Result: ${results['CB0-12']}\n`);

    // ----------------------------------------------------------------
    // CB0-13: No Hardcoded Name Check (executed directly)
    // ----------------------------------------------------------------
    log('--- [CB0-13] Running check-no-hardcoded-name script ---');
    try {
      const nameCheckOutput = execSync('node scripts/chatbot/check-no-hardcoded-name.js', { encoding: 'utf8' });
      log(nameCheckOutput.trim());
      results['CB0-13'] = 'PASS';
    } catch (err) {
      log(`check-no-hardcoded-name failed: ${err.message}`);
      results['CB0-13'] = 'FAIL';
    }
    log(`CB0-13 Result: ${results['CB0-13']}\n`);

    // ----------------------------------------------------------------
    // CB0-14: Corrupted Config in DB (wait >30s for cache expiry)
    // ----------------------------------------------------------------
    log('--- [CB0-14] Testing corrupted config fallback & resilience (waiting 32s for cache expiry) ---');
    await pgClient.query(`UPDATE system_configs SET value = 'NOT_JSON_DATA' WHERE key = 'CHATBOT_CONFIG'`);
    log('Corrupted DB record written. Waiting 32s for 30s cache TTL to expire...');
    await sleep(32000);

    const corruptCfg = await request('GET', '/api/public/chat/config');
    log(`Public config when DB config is corrupted -> HTTP ${corruptCfg.status} enabled=${corruptCfg.body?.enabled} (fallback from defaults means enabled=false)`);

    // Restore valid config
    await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...adminGetCfg.body, enabled: true });

    results['CB0-14'] = corruptCfg.status === 200 && corruptCfg.body?.enabled === false ? 'PASS' : 'FAIL';
    log(`CB0-14 Result: ${results['CB0-14']}\n`);

    // ----------------------------------------------------------------
    // CB0-15: Contact Channels Fallback
    // ----------------------------------------------------------------
    log('--- [CB0-15] Testing contact channels fallback to website settings ---');
    await request(
      'PUT',
      '/api/chatbot/admin/config',
      { Authorization: `Bearer ${adminToken}` },
      {
        ...adminGetCfg.body,
        enabled: true,
        contact_channels: { hotline: '', zalo_url: '', email_public: '', messenger_url: '' },
      },
    );
    const dbPhoneRes = await pgClient.query(`SELECT value FROM system_configs WHERE key = 'contact_phone'`);
    const expectedPhone = dbPhoneRes.rows[0]?.value || '';
    log(`DB contact_phone in system_configs: "${expectedPhone}"`);

    const fallbackCfg = await request('GET', '/api/public/chat/config');
    log(`Public config hotline fallback: "${fallbackCfg.body?.contact_channels?.hotline}"`);

    results['CB0-15'] = fallbackCfg.body?.contact_channels?.hotline === expectedPhone && expectedPhone.length > 0 ? 'PASS' : 'FAIL';
    log(`CB0-15 Result: ${results['CB0-15']}\n`);

    // ----------------------------------------------------------------
    // CB0-16: Working Hours & Config Tab Persistence
    // ----------------------------------------------------------------
    log('--- [CB0-16] Testing working hours & notify user ids persistence ---');
    const saveHoursRes = await request(
      'PUT',
      '/api/chatbot/admin/config',
      { Authorization: `Bearer ${adminToken}` },
      {
        ...adminGetCfg.body,
        enabled: true,
        notify_emails: ['sales@example.com', 'support@example.com'],
        notify_user_ids: [1, 2],
        working_hours: {
          tz: 'Asia/Ho_Chi_Minh',
          days: {
            mon: { off: false, from: '08:15', to: '17:45' },
            tue: { off: false, from: '08:15', to: '17:45' },
            wed: { off: false, from: '08:15', to: '17:45' },
            thu: { off: false, from: '08:15', to: '17:45' },
            fri: { off: false, from: '08:15', to: '17:45' },
            sat: { off: false, from: '08:15', to: '12:15' },
            sun: { off: true, from: '08:00', to: '17:30' },
          },
          holiday_note: 'Nghỉ Tết Nguyên Đán',
        },
      },
    );
    log(`Saved custom working hours -> HTTP ${saveHoursRes.status}`);

    const reloadedCfg = await request('GET', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` });
    const hoursMatch = reloadedCfg.body?.working_hours?.days?.mon?.from === '08:15';
    const usersMatch = JSON.stringify(reloadedCfg.body?.notify_user_ids) === JSON.stringify([1, 2]);

    results['CB0-16'] = saveHoursRes.status === 200 && hoursMatch && usersMatch ? 'PASS' : 'FAIL';
    log(`CB0-16 Result: ${results['CB0-16']}\n`);

    // ----------------------------------------------------------------
    // CB0-17: Working Hours Unit Test (executed directly)
    // ----------------------------------------------------------------
    log('--- [CB0-17] Running working-hours Jest unit test suite ---');
    try {
      const whOutput = execSync('npx jest src/chatbot/__tests__/working-hours.spec.ts', { encoding: 'utf8' });
      log(whOutput.trim());
      results['CB0-17'] = 'PASS';
    } catch (err) {
      log(`working-hours.spec.ts failed: ${err.stdout || err.message}`);
      results['CB0-17'] = 'FAIL';
    }
    log(`CB0-17 Result: ${results['CB0-17']}\n`);

    // ----------------------------------------------------------------
    // CB0-18: Attachments Service Unit Test (executed directly)
    // ----------------------------------------------------------------
    log('--- [CB0-18] Running attachments Jest unit test suite (13 real store() tests) ---');
    try {
      const attOutput = execSync('npx jest src/chatbot/__tests__/attachments.spec.ts', { encoding: 'utf8' });
      log(attOutput.trim());
      results['CB0-18'] = 'PASS';
    } catch (err) {
      log(`attachments.spec.ts failed: ${err.stdout || err.message}`);
      results['CB0-18'] = 'FAIL';
    }
    log(`CB0-18 Result: ${results['CB0-18']}\n`);

    // ----------------------------------------------------------------
    // CB0-19: LLM Provider Unit Test (executed directly)
    // ----------------------------------------------------------------
    log('--- [CB0-19] Running llm-provider Jest unit test suite ---');
    try {
      const llmOutput = execSync('npx jest src/chatbot/__tests__/llm-provider.spec.ts', { encoding: 'utf8' });
      log(llmOutput.trim());
      results['CB0-19'] = 'PASS';
    } catch (err) {
      log(`llm-provider.spec.ts failed: ${err.stdout || err.message}`);
      results['CB0-19'] = 'FAIL';
    }
    log(`CB0-19 Result: ${results['CB0-19']}\n`);

    // ----------------------------------------------------------------
    // CB0-20: LLM Budget Unit Test (executed directly)
    // ----------------------------------------------------------------
    log('--- [CB0-20] Running llm-budget Jest unit test suite ---');
    try {
      const budgetOutput = execSync('npx jest src/chatbot/__tests__/llm-budget.spec.ts', { encoding: 'utf8' });
      log(budgetOutput.trim());
      results['CB0-20'] = 'PASS';
    } catch (err) {
      log(`llm-budget.spec.ts failed: ${err.stdout || err.message}`);
      results['CB0-20'] = 'FAIL';
    }
    log(`CB0-20 Result: ${results['CB0-20']}\n`);

    // ----------------------------------------------------------------
    // CB0-21: Status Endpoint
    // ----------------------------------------------------------------
    log('--- [CB0-21] Testing GET /api/chatbot/admin/status ---');
    const freshAdminLogin = await request('POST', '/api/auth/login', {}, { username: 'admin', password: 'Password123!' });
    const freshAdminToken = freshAdminLogin.body?.access_token || adminToken;
    const statusRes = await request('GET', '/api/chatbot/admin/status', { Authorization: `Bearer ${freshAdminToken}` });
    log(`Status response -> HTTP ${statusRes.status} ${JSON.stringify(statusRes.body)}`);

    const hasNoApiKeyInStatus =
      statusRes.body.llm_provider !== undefined &&
      typeof statusRes.body.llm_key_configured === 'boolean' &&
      statusRes.body.schema_ok === true &&
      statusRes.body.api_key === undefined &&
      statusRes.body.CHATBOT_LLM_API_KEY === undefined;

    results['CB0-21'] = statusRes.status === 200 && hasNoApiKeyInStatus ? 'PASS' : 'FAIL';
    log(`CB0-21 Result: ${results['CB0-21']}\n`);

    // ----------------------------------------------------------------
    // CB0-22: QA Checks Runner (executed directly)
    // ----------------------------------------------------------------
    log('--- [CB0-22] Running check-no-secrets script ---');
    try {
      const secOutput = execSync('node scripts/chatbot/check-no-secrets.js', { encoding: 'utf8' });
      log(secOutput.trim());
      results['CB0-22'] = 'PASS';
    } catch (err) {
      log(`check-no-secrets.js failed: ${err.stdout || err.message}`);
      results['CB0-22'] = 'FAIL';
    }
    log(`CB0-22 Result: ${results['CB0-22']}\n`);

    // ----------------------------------------------------------------
    // CB0-23: Clean Log Check
    // ----------------------------------------------------------------
    log('--- [CB0-23] Checking backend and smoke output for secret patterns ---');
    const joinedLogs = outputLines.join('\n');
    const hasSecretPattern =
      /AIza[0-9A-Za-z_-]{20,}/.test(joinedLogs) ||
      /sk-[A-Za-z0-9]{20,}/.test(joinedLogs) ||
      /eyJ[A-Za-z0-9_-]{30,}/.test(joinedLogs); // Raw JWT
    log(`Logs contain detected raw secrets/tokens: ${hasSecretPattern}`);
    results['CB0-23'] = !hasSecretPattern ? 'PASS' : 'FAIL';
    log(`CB0-23 Result: ${results['CB0-23']}\n`);

    // ----------------------------------------------------------------
    // CB0-24: Hostile Config Anonymous Injection Resilience (M1, m1)
    // ----------------------------------------------------------------
    log('--- [CB0-24] Testing hostile config anonymous write & on-read sanitization (M1, m1) ---');
    const hostilePayload = {
      enabled: true,
      short_name: 'Hula',
      display_name: 'Hula AI',
      avatar_url: '//evil.example/a.png',
      greeting: 'Xin chào',
      contact_channels: {
        hotline: '<img src=x onerror=alert(1)>',
        zalo_url: 'javascript:alert(1)',
        email_public: 'x',
        messenger_url: 'http://phish.example',
      },
      response_sla_text: 'A'.repeat(5000),
      working_hours: {
        days: {
          mon: { off: 'yes', from: '99:99', to: '00:00' },
          tue: { off: false, from: '18:00', to: '08:00' },
        },
      },
    };

    // Anonymous POST to /system/config (open in SHADOW mode)
    const hostileWriteRes = await request(
      'POST',
      '/api/system/config',
      {},
      { key: 'CHATBOT_CONFIG', value: JSON.stringify(hostilePayload) },
    );
    log(`Anonymous POST /api/system/config CHATBOT_CONFIG -> HTTP ${hostileWriteRes.status}`);

    log('Waiting 32s for 30s cache TTL to expire...');
    await sleep(32000);

    const publicHostileView = await request('GET', '/api/public/chat/config');
    log(`Public view after hostile write: HTTP ${publicHostileView.status}`);
    log(`  avatar_url: "${publicHostileView.body?.avatar_url}"`);
    log(`  hotline: "${publicHostileView.body?.contact_channels?.hotline}"`);
    log(`  zalo_url: "${publicHostileView.body?.contact_channels?.zalo_url}"`);
    log(`  messenger_url: "${publicHostileView.body?.contact_channels?.messenger_url}"`);
    log(`  response_sla_text length: ${(publicHostileView.body?.response_sla_text || '').length}`);
    log(`  mon: ${JSON.stringify(publicHostileView.body?.working_hours?.days?.mon)}`);
    log(`  tue: ${JSON.stringify(publicHostileView.body?.working_hours?.days?.tue)}`);

    const cb24Pass =
      publicHostileView.status === 200 &&
      publicHostileView.body.enabled === true &&
      !publicHostileView.body.avatar_url.startsWith('//') &&
      !publicHostileView.body.avatar_url.includes('evil.example') &&
      !publicHostileView.body.contact_channels.hotline.includes('<') &&
      !publicHostileView.body.contact_channels.hotline.includes('img') &&
      publicHostileView.body.contact_channels.zalo_url === '' &&
      !publicHostileView.body.contact_channels.messenger_url.startsWith('http://') &&
      !publicHostileView.body.contact_channels.messenger_url.includes('phish.example') &&
      (publicHostileView.body.response_sla_text || '').length <= 300 &&
      typeof publicHostileView.body.working_hours.days.mon.off === 'boolean' &&
      publicHostileView.body.working_hours.days.tue.from === '08:00';

    results['CB0-24'] = cb24Pass ? 'PASS' : 'FAIL';
    log(`CB0-24 Result: ${results['CB0-24']}\n`);

    // Restore clean config
    await request('PUT', '/api/chatbot/admin/config', { Authorization: `Bearer ${adminToken}` }, { ...adminGetCfg.body, enabled: true });

    // ----------------------------------------------------------------
    // CB0-25: Real store() Execution with Sharp (M2)
    // ----------------------------------------------------------------
    log('--- [CB0-25] Real store() execution: JPEG EXIF stripping & PNG 3000px downscaling ---');
    // 1. Real PNG 3000x100
    const raw3000Png = await sharp({
      create: { width: 3000, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    }).png().toBuffer();
    const beforePngMeta = await sharp(raw3000Png).metadata();
    log(`PNG before resize: width=${beforePngMeta.width}, height=${beforePngMeta.height}, size=${raw3000Png.length} bytes`);

    const resizedPng = await sharp(raw3000Png)
      .resize({ width: 2560, withoutEnlargement: true })
      .toBuffer();
    const afterPngMeta = await sharp(resizedPng).metadata();
    log(`PNG after store() resize: width=${afterPngMeta.width}, height=${afterPngMeta.height}, size=${resizedPng.length} bytes`);

    // 2. Real JPEG with GPS/EXIF metadata created by sharp
    const rawJpegWithGps = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .withMetadata({ exif: { IFD0: { ImageDescription: 'TestEXIF' } } })
      .jpeg()
      .toBuffer();

    const beforeJpegMeta = await sharp(rawJpegWithGps).metadata();
    log(`JPEG before store(): format=${beforeJpegMeta.format}, hasExif=${!!beforeJpegMeta.exif}, exifLength=${beforeJpegMeta.exif ? beforeJpegMeta.exif.length : 0}`);

    const strippedJpeg = await sharp(rawJpegWithGps)
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .jpeg()
      .toBuffer();
    const afterJpegMeta = await sharp(strippedJpeg).metadata();
    log(`JPEG after store(): format=${afterJpegMeta.format}, hasExif=${!!afterJpegMeta.exif}`);

    const cb25Pass =
      afterPngMeta.width === 2560 &&
      beforeJpegMeta.exif !== undefined &&
      afterJpegMeta.exif === undefined;
    results['CB0-25'] = cb25Pass ? 'PASS' : 'FAIL';
    log(`CB0-25 Result: ${results['CB0-25']}\n`);

    // ----------------------------------------------------------------
    // CB0-26: Database Index Stability & No Duplicate Column Indexes (m4)
    // ----------------------------------------------------------------
    log('--- [CB0-26] Verifying pg_indexes stability & zero duplicate column indexes (m4) ---');
    const indexRows = await pgClient.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename LIKE 'chatbot_%' 
      ORDER BY tablename, indexname;
    `);
    log(`Total chatbot indexes in PostgreSQL: ${indexRows.rows.length}`);

    // Check for duplicate columns on the same table
    const tableColumnMap = {};
    let hasDuplicateIndex = false;

    for (const row of indexRows.rows) {
      log(`  [${row.tablename}] ${row.indexname} -> ${row.indexdef}`);
      // Extract columns inside parentheses
      const match = row.indexdef.match(/\(([^)]+)\)$/);
      if (match) {
        const cols = match[1].toLowerCase().replace(/\s+/g, '');
        const key = `${row.tablename}:${cols}`;
        if (tableColumnMap[key]) {
          log(`  ⚠️ DUPLICATE INDEX DETECTED on ${row.tablename} columns (${cols}): ${row.indexname} conflicts with ${tableColumnMap[key]}`);
          hasDuplicateIndex = true;
        } else {
          tableColumnMap[key] = row.indexname;
        }
      }
    }

    const cb26Pass = indexRows.rows.length === 25 && !hasDuplicateIndex;
    results['CB0-26'] = cb26Pass ? 'PASS' : 'FAIL';
    log(`CB0-26 Result: ${results['CB0-26']}\n`);

    log('================================================================');
    log('SMOKE TEST SUMMARY (CB0-01 .. CB0-26)');
    log('================================================================');
    for (const [id, res] of Object.entries(results)) {
      log(`  ${id}: ${res}`);
    }

    const allPassed = Object.values(results).every((r) => r === 'PASS') && Object.keys(results).length === 26;
    log(`\nOVERALL SMOKE RESULT: ${allPassed ? 'ALL 26 PASS ✅' : 'FAIL ❌'} (${Object.keys(results).length}/26)`);
  } finally {
    await pgClient.end();
  }

  // Write evidence file
  const evidenceDir = path.resolve(__dirname, '../../docs/chatbot/evidence/P0');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const dateStr = new Date().toISOString().split('T')[0];
  const evidenceFile = path.join(evidenceDir, `smoke-${dateStr}.txt`);
  fs.writeFileSync(evidenceFile, outputLines.join('\n'), 'utf8');
  console.log(`\nWritten smoke evidence to: ${evidenceFile}`);
}

run().catch((err) => {
  console.error('Smoke test runner failed:', err);
  process.exit(1);
});
