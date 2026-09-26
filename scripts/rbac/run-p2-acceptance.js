const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client } = require('pg');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const evidenceDir = path.resolve(rootDir, 'docs/rbac_v2/evidence/P2');

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3999,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: data
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function getPgClient() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'hula_user',
    password: 'hula_password',
    database: 'hula_db'
  });
  await client.connect();
  return client;
}

async function runAcceptanceP2() {
  console.log('======================================================');
  console.log('         RBAC V2 PHASE 2.0 ACCEPTANCE TEST            ');
  console.log('======================================================\n');

  const pg = await getPgClient();
  const results = {};

  try {
    // ---------------------------------------------------------------
    // P2-00a: Watermark B2B public (E5)
    // ---------------------------------------------------------------
    console.log('--- Testing P2-00a: Watermark B2B public (E5) ---');
    // Clear previous logs for clean assertion
    await pg.query("DELETE FROM rbac_access_logs WHERE route LIKE '%watermark%'");

    const wmRes = await request({
      path: '/api/upload/watermark/b2b/config',
      method: 'GET'
    });

    console.log(`GET /api/upload/watermark/b2b/config -> HTTP ${wmRes.status}`);

    const wmLogs = await pg.query("SELECT * FROM rbac_access_logs WHERE route = '/api/upload/watermark/b2b/config'");
    const hasDenyNoAuth = wmLogs.rows.some(r => r.decision === 'DENY_NO_AUTH');

    const p2_00a_pass = wmRes.status === 200 && !hasDenyNoAuth && wmRes.data && wmRes.data.enabled !== undefined;
    results['P2-00a'] = {
      pass: p2_00a_pass,
      status: wmRes.status,
      denyNoAuthLogs: wmLogs.rows.length,
      payloadSnippet: JSON.stringify(wmRes.data).substring(0, 120)
    };

    const evidence00a = [
      `=== EVIDENCE P2-00a: Watermark B2B public (E5) ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `Request: GET /api/upload/watermark/b2b/config (No Authorization header)`,
      `HTTP Status: ${wmRes.status}`,
      `Response Payload:`,
      JSON.stringify(wmRes.data, null, 2),
      ``,
      `Database Check: rbac_access_logs WHERE route = '/api/upload/watermark/b2b/config'`,
      `Log rows found: ${wmLogs.rows.length}`,
      `DENY_NO_AUTH present: ${hasDenyNoAuth ? 'YES (FAIL)' : 'NO (PASS)'}`,
      ``,
      `Conclusion: ${p2_00a_pass ? 'PASS' : 'FAIL'}`
    ].join('\n');

    fs.writeFileSync(path.join(evidenceDir, 'P2-00a_watermark-b2b.txt'), evidence00a, 'utf8');
    console.log(`P2-00a Result: ${p2_00a_pass ? 'PASS' : 'FAIL'}\n`);

    // ---------------------------------------------------------------
    // P2-00b: NPL portal NCC theo uuid (E6)
    // ---------------------------------------------------------------
    console.log('--- Testing P2-00b: NPL portal NCC theo uuid (E6) ---');
    // Clear previous logs for PO outsourcing materials
    await pg.query("DELETE FROM rbac_access_logs WHERE route LIKE '%outsourcing-materials%'");

    const nccA_uuid = '01d122d7-b9a2-42aa-b964-d64ce66f0cfc'; // Hưng Nguyên (ID 17)
    const nccA_poId = 596; // Belongs to Hưng Nguyên
    const nccB_poId = 595; // Belongs to Ngọc Cường (ID 3)

    // 1. NCC A views own PO NPL
    const ownPoRes = await request({
      path: `/api/purchasing/supplier-portal/${nccA_uuid}/outsourcing-materials/${nccA_poId}`,
      method: 'GET'
    });
    console.log(`NCC A view own PO ${nccA_poId} -> HTTP ${ownPoRes.status}`);

    // 2. NCC A attempts to view NCC B PO NPL
    const otherPoRes = await request({
      path: `/api/purchasing/supplier-portal/${nccA_uuid}/outsourcing-materials/${nccB_poId}`,
      method: 'GET'
    });
    console.log(`NCC A view NCC B PO ${nccB_poId} -> HTTP ${otherPoRes.status}`);

    // 3. Old route without token
    const oldRouteRes = await request({
      path: `/api/purchasing/${nccA_poId}/outsourcing-materials`,
      method: 'GET'
    });
    console.log(`Old route /api/purchasing/${nccA_poId}/outsourcing-materials (no token) -> HTTP ${oldRouteRes.status}`);

    // Wait 500ms for fire-and-forget log write
    await new Promise(r => setTimeout(r, 500));

    // Check logs for old route (logged as pattern /api/purchasing/:id/outsourcing-materials)
    const oldRouteLogs = await pg.query("SELECT * FROM rbac_access_logs WHERE route LIKE '%outsourcing-materials%' AND route NOT LIKE '%supplier-portal%'");
    const oldRouteHasDeny = oldRouteLogs.rows.some(r => r.decision === 'DENY_NO_AUTH' && r.required === 'PURCHASE:view');

    // Check logs for new public route (must NOT log DENY)
    const newRouteLogs = await pg.query("SELECT * FROM rbac_access_logs WHERE route LIKE '%supplier-portal%'");
    const newRouteHasDeny = newRouteLogs.rows.some(r => r.decision.startsWith('DENY'));

    const p2_00b_pass = ownPoRes.status === 200 &&
                        Array.isArray(ownPoRes.data) &&
                        otherPoRes.status === 404 &&
                        oldRouteRes.status === 200 &&
                        oldRouteHasDeny &&
                        !newRouteHasDeny;

    results['P2-00b'] = {
      pass: p2_00b_pass,
      ownPoStatus: ownPoRes.status,
      otherPoStatus: otherPoRes.status,
      oldRouteStatus: oldRouteRes.status,
      oldRouteLoggedDeny: oldRouteHasDeny,
      newRouteNoDeny: !newRouteHasDeny
    };

    const evidence00b = [
      `=== EVIDENCE P2-00b: NPL portal NCC theo uuid (E6) ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `NCC A (Hưng Nguyên, ID 17, UUID ${nccA_uuid})`,
      `NCC B (Ngọc Cường, ID 3, UUID 9c9fe50a-63b0-45d7-908a-aed88a7e398a)`,
      ``,
      `1. NCC A xem NPL đơn PO của mình (PO ${nccA_poId}):`,
      `   GET /api/purchasing/supplier-portal/${nccA_uuid}/outsourcing-materials/${nccA_poId}`,
      `   HTTP Status: ${ownPoRes.status} (Expected: 200)`,
      `   Materials Count: ${Array.isArray(ownPoRes.data) ? ownPoRes.data.length : 0}`,
      `   Sample Item: ${JSON.stringify(Array.isArray(ownPoRes.data) ? ownPoRes.data[0] : ownPoRes.data)}`,
      ``,
      `2. NCC A đổi poId sang PO của NCC B (PO ${nccB_poId}):`,
      `   GET /api/purchasing/supplier-portal/${nccA_uuid}/outsourcing-materials/${nccB_poId}`,
      `   HTTP Status: ${otherPoRes.status} (Expected: 404)`,
      `   Response: ${JSON.stringify(otherPoRes.data)}`,
      ``,
      `3. Route cũ không có token (vẫn ghi DENY_NO_AUTH để chặn khi ENFORCE):`,
      `   GET /api/purchasing/${nccA_poId}/outsourcing-materials`,
      `   HTTP Status: ${oldRouteRes.status} (SHADOW mode)`,
      `   Log records in rbac_access_logs: ${oldRouteLogs.rows.length}`,
      `   Logged decision: ${oldRouteLogs.rows[0]?.decision}, required: ${oldRouteLogs.rows[0]?.required}`,
      ``,
      `Conclusion: ${p2_00b_pass ? 'PASS' : 'FAIL'}`
    ].join('\n');

    fs.writeFileSync(path.join(evidenceDir, 'P2-00b_supplier-portal-npl.txt'), evidence00b, 'utf8');
    console.log(`P2-00b Result: ${p2_00b_pass ? 'PASS' : 'FAIL'}\n`);

    // ---------------------------------------------------------------
    // P2-00c: Quét bề mặt ẩn danh (check-public-callers.js)
    // ---------------------------------------------------------------
    console.log('--- Testing P2-00c: Quét bề mặt ẩn danh ---');
    const callerRun = spawnSync('node', ['scripts/rbac/check-public-callers.js'], { cwd: rootDir, encoding: 'utf8' });
    console.log(callerRun.stdout);
    if (callerRun.stderr) console.error(callerRun.stderr);

    const p2_00c_pass = callerRun.status === 0;
    results['P2-00c'] = {
      pass: p2_00c_pass,
      exitCode: callerRun.status
    };

    const evidence00c = [
      `=== EVIDENCE P2-00c: Quét bề mặt ẩn danh (check-public-callers.js) ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `Command: node scripts/rbac/check-public-callers.js`,
      `Exit Code: ${callerRun.status}`,
      `Output:`,
      callerRun.stdout,
      callerRun.stderr ? `Error:\n${callerRun.stderr}` : '',
      `Conclusion: ${p2_00c_pass ? 'PASS' : 'FAIL'}`
    ].join('\n');

    fs.writeFileSync(path.join(evidenceDir, 'P2-00c_check-public-callers.txt'), evidence00c, 'utf8');
    console.log(`P2-00c Result: ${p2_00c_pass ? 'PASS' : 'FAIL'}\n`);

    // ---------------------------------------------------------------
    // Verify check-rbac.js integrity
    // ---------------------------------------------------------------
    console.log('--- Running check-rbac.js ---');
    const rbacRun = spawnSync('node', ['scripts/check-rbac.js'], { cwd: rootDir, encoding: 'utf8' });
    console.log(rbacRun.stdout);

    fs.writeFileSync(path.join(evidenceDir, 'check-rbac.txt'), rbacRun.stdout, 'utf8');

    console.log('======================================================');
    console.log('                 ACCEPTANCE SUMMARY                   ');
    console.log('======================================================');
    console.log(`  P2-00a (Watermark B2B public E5):       ${results['P2-00a']?.pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  P2-00b (NPL portal NCC theo uuid E6):   ${results['P2-00b']?.pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  P2-00c (Quét bề mặt ẩn danh):           ${results['P2-00c']?.pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log('======================================================\n');

  } finally {
    await pg.end();
  }
}

runAcceptanceP2().catch(err => {
  console.error('Fatal error during acceptance test:', err);
  process.exit(1);
});
