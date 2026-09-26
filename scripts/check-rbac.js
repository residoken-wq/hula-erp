const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function parseCSVLine(text) {
  let row = [''], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i], next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else {
      row[row.length - 1] += c;
    }
  }
  return row;
}

function loadMatrix() {
  const matrixPath = path.resolve(__dirname, '../docs/rbac_v2/route-matrix.csv');
  if (!fs.existsSync(matrixPath)) {
    console.warn(`[WARN] Matrix file not found at ${matrixPath}`);
    return new Map();
  }
  const content = fs.readFileSync(matrixPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const matrixMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const key = `${row[1]} ${row[2]}`;
    matrixMap.set(key, {
      id: row[0],
      method: row[1],
      route: row[2],
      source: row[3],
      handler: row[4],
      current: row[5],
      tier: row[6],
      perm: row[7],
      change: row[8],
      review: row[10],
      note: row[11]
    });
  }
  return matrixMap;
}

function getControllerFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) results.push(...getControllerFiles(full));
    else if (file.endsWith('.controller.ts')) results.push(full.replace(/\\/g, '/'));
  }
  return results;
}

const httpMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All', 'Options', 'Head'];

function cleanRoute(base, sub) {
  let r = '/api';
  if (base) {
    base = base.trim().replace(/^\/+|\/+$/g, '');
    if (base) r += '/' + base;
  }
  if (sub) {
    sub = sub.trim().replace(/^\/+|\/+$/g, '');
    if (sub) r += '/' + sub;
  }
  return r;
}

function extractStringArg(decoratorText) {
  const match = decoratorText.match(/\(['"]([^'"]*)['"]\)/);
  return match ? match[1] : '';
}

function runCheck() {
  console.log('======================================================');
  console.log('               RBAC V2 ROUTE CHECKER                  ');
  console.log('======================================================');

  const matrixMap = loadMatrix();
  const rootSrc = path.resolve(__dirname, '../src');
  const files = getControllerFiles(rootSrc);

  const scannedRoutes = [];
  const unclassified = [];
  const multipleDecorated = [];
  const diffs = [];

  const tierCounts = {
    PUBLIC: 0,
    AUTH: 0,
    PERM: 0,
    APIKEY: 0,
  };

  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const sf = ts.createSourceFile(f, code, ts.ScriptTarget.Latest, true);

    ts.forEachChild(sf, node => {
      if (ts.isClassDeclaration(node)) {
        let controllerPrefix = '';
        const classDecs = (ts.canHaveDecorators(node) ? ts.getDecorators(node) : node.decorators) || [];
        const hasApiKeyGuardClass = classDecs.some(d => d.expression.getText(sf).includes('ApiKeyGuard'));

        for (const d of classDecs) {
          const text = d.expression.getText(sf);
          if (text.startsWith('Controller(')) {
            controllerPrefix = extractStringArg(text);
          }
        }

        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member)) {
            const decs = (ts.canHaveDecorators(member) ? ts.getDecorators(member) : member.decorators) || [];
            let httpMethod = null;
            let subPath = '';

            for (const d of decs) {
              const text = d.expression.getText(sf);
              const m = httpMethods.find(h => text.startsWith(h + '(') || text === h);
              if (m) {
                httpMethod = m.toUpperCase();
                subPath = text.includes('(') ? extractStringArg(text) : '';
                break;
              }
            }

            if (httpMethod) {
              const fullRoute = cleanRoute(controllerPrefix, subPath);
              const key = `${httpMethod} ${fullRoute}`;
              const relFile = path.relative(path.resolve(__dirname, '..'), f).replace(/\\/g, '/');
              const methodName = member.name.getText(sf);

              // Find RBAC decorators
              const rbacDecs = [];
              if (hasApiKeyGuardClass) {
                rbacDecs.push({ type: 'APIKEY', raw: 'ApiKeyGuard(class)' });
              }

              for (const d of decs) {
                const text = d.expression.getText(sf);
                if (text.startsWith('Public(') || text === 'Public') {
                  rbacDecs.push({ type: 'PUBLIC', raw: text });
                } else if (text.startsWith('AuthOnly(') || text === 'AuthOnly') {
                  rbacDecs.push({ type: 'AUTH', raw: text });
                } else if (text.startsWith('Perm(')) {
                  const m = text.match(/Perm\(\s*['"]([^'"]+)['"]/);
                  rbacDecs.push({ type: 'PERM', raw: text, modules: m ? [m[1]] : [] });
                } else if (text.startsWith('AnyPerm(')) {
                  const mods = [...text.matchAll(/\['([A-Z_]+)'/g)].map(m => m[1]);
                  rbacDecs.push({ type: 'PERM', raw: text, modules: mods });
                } else if (text.startsWith('RequirePermission(')) {
                  const m = text.match(/RequirePermission\(\s*['"]([^'"]+)['"]/);
                  rbacDecs.push({ type: 'PERM', raw: text, legacy: true, module: m ? m[1] : null });
                }
              }

              // Check for valid transition pair: @RequirePermission + @Perm/@AnyPerm where legacy module in modern modules
              let isTransitionPair = false;
              if (rbacDecs.length === 2) {
                const legacyDec = rbacDecs.find(d => d.legacy);
                const modernDec = rbacDecs.find(d => !d.legacy && d.type === 'PERM' && d.modules);
                if (legacyDec && modernDec && legacyDec.module && modernDec.modules.includes(legacyDec.module)) {
                  isTransitionPair = true;
                }
              }

              const routeInfo = {
                key,
                method: httpMethod,
                route: fullRoute,
                file: relFile,
                methodName,
                rbacDecs
              };

              scannedRoutes.push(routeInfo);

              if (rbacDecs.length === 0) {
                unclassified.push(routeInfo);
              } else if (rbacDecs.length > 1 && !isTransitionPair) {
                // If it has multiple and not a valid transition pair, flag error
                multipleDecorated.push(routeInfo);
              } else {
                const tier = isTransitionPair ? 'PERM' : rbacDecs[0].type;
                tierCounts[tier] = (tierCounts[tier] || 0) + 1;
              }

              // Compare with matrix
              const matrixEntry = matrixMap.get(key);
              const effectiveCodeTier = isTransitionPair ? 'PERM' : rbacDecs[0]?.type;
              if (!matrixEntry) {
                diffs.push({
                  key,
                  type: 'NOT_IN_MATRIX',
                  codeTier: effectiveCodeTier || 'NONE',
                  matrixTier: null,
                  file: relFile,
                  methodName
                });
              } else {
                const codeTier = effectiveCodeTier;
                if (codeTier && codeTier !== matrixEntry.tier) {
                  diffs.push({
                    key,
                    type: 'TIER_MISMATCH',
                    codeTier,
                    matrixTier: matrixEntry.tier,
                    id: matrixEntry.id,
                    file: relFile,
                    note: matrixEntry.note
                  });
                }
              }
            }
          }
        });
      }
    });
  }

  // Print summary
  console.log(`\nTotal routes scanned: ${scannedRoutes.length}`);
  console.log(`Matrix route count:   ${matrixMap.size}`);
  console.log('\n--- Route Breakdown by Tier ---');
  console.log(`  PUBLIC:        ${tierCounts.PUBLIC}`);
  console.log(`  AUTH:          ${tierCounts.AUTH}`);
  console.log(`  PERM:          ${tierCounts.PERM}`);
  console.log(`  APIKEY:        ${tierCounts.APIKEY}`);
  console.log(`  UNCLASSIFIED:  ${unclassified.length}`);
  console.log(`  MULTI-TIER:    ${multipleDecorated.length}`);

  if (unclassified.length > 0) {
    console.error('\n[ERROR] Unclassified routes found (must be 0):');
    unclassified.forEach(r => console.error(`  - ${r.key} (${r.file} -> ${r.methodName})`));
  }

  if (multipleDecorated.length > 0) {
    console.error('\n[ERROR] Routes with multiple RBAC decorators:');
    multipleDecorated.forEach(r => {
      console.error(`  - ${r.key} (${r.file} -> ${r.methodName}): ${r.rbacDecs.map(d => d.raw).join(', ')}`);
    });
  }

  if (diffs.length > 0) {
    console.log(`\n[INFO] Matrix differences detected (${diffs.length} differences - informational):`);
    diffs.forEach(d => {
      if (d.type === 'NOT_IN_MATRIX') {
        console.log(`  * [NOT_IN_MATRIX] ${d.key} -> Code: ${d.codeTier} (${d.file})`);
      } else if (d.type === 'TIER_MISMATCH') {
        console.log(`  * [TIER_MISMATCH] ${d.id} ${d.key} -> Code: ${d.codeTier} vs Matrix: ${d.matrixTier} (${d.note || 'no note'})`);
      }
    });
  }

  console.log('\n======================================================');
  if (unclassified.length === 0 && multipleDecorated.length === 0) {
    console.log('✅ RBAC CHECK PASSED: 100% routes classified with single decorator.');
    console.log('======================================================\n');
    return 0;
  } else {
    console.error('❌ RBAC CHECK FAILED: Found unclassified or ambiguous routes.');
    console.log('======================================================\n');
    return 1;
  }
}

if (require.main === module) {
  const exitCode = runCheck();
  process.exit(exitCode);
}

module.exports = { runCheck };
