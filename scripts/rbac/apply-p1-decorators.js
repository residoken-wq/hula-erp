// Purpose: Batch applies RBAC decorators according to route-matrix.csv (one-off P1)
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const isDryRun = process.argv.includes('--dry-run');

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

const matrixContent = fs.readFileSync('docs/rbac_v2/route-matrix.csv', 'utf8');
const matrixLines = matrixContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const matrixMap = new Map();
for (let i = 1; i < matrixLines.length; i++) {
  const row = parseCSVLine(matrixLines[i]);
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
    review: row[10]
  });
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
const files = getControllerFiles('src');

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

// Special unlisted routes definition
const customRouteRules = {
  // P0 / Auth
  'GET /api/auth/permission-catalog': { tier: 'AUTH' },
  'GET /api/auth/me': { tier: 'AUTH' },
  'GET /api/auth/rbac/mode': { tier: 'PERM', perm: 'SYSTEM:view' },
  'PUT /api/auth/rbac/mode': { tier: 'PERM', perm: 'SYSTEM:update' },
  'GET /api/auth/rbac/report': { tier: 'PERM', perm: 'SYSTEM:view' },
  'GET /api/auth/rbac/unclassified': { tier: 'PERM', perm: 'SYSTEM:view' },
  // Categories (D6)
  'GET /api/categories/:id': { tier: 'AUTH' },
  'POST /api/categories': { tier: 'PERM', perm: 'PRODUCT:create' },
  'POST /api/categories/:id/sync-size': { tier: 'PERM', perm: 'PRODUCT:update' },
  'PUT /api/categories/:id': { tier: 'PERM', perm: 'PRODUCT:update' },
  'DELETE /api/categories/:id': { tier: 'PERM', perm: 'PRODUCT:delete' },
  // Customers
  'GET /api/customers': { tier: 'PERM', perm: 'SALES:view' },
  'PUT /api/customers/:id': { tier: 'PERM', perm: 'SALES:update' },
  'DELETE /api/customers/:id': { tier: 'PERM', perm: 'SALES:delete' },
  // Finance
  'GET /api/finance/categories': { tier: 'PERM', perm: 'FINANCE:view' },
  'POST /api/finance/categories': { tier: 'PERM', perm: 'FINANCE:create' },
  'PUT /api/finance/categories/:id': { tier: 'PERM', perm: 'FINANCE:update' },
  'DELETE /api/finance/categories/:id': { tier: 'PERM', perm: 'FINANCE:delete' },
  'PUT /api/finance/transactions/:id': { tier: 'PERM', perm: 'FINANCE:update' },
  'DELETE /api/finance/transactions/:id': { tier: 'PERM', perm: 'FINANCE:delete' },
  // Planning
  'GET /api/planning/suggestion': { tier: 'PERM', perm: 'PRODUCTION:view' },
  'GET /api/planning/booking-stats': { tier: 'PERM', perm: 'PRODUCTION:view' },
  'GET /api/planning/bookings': { tier: 'PERM', perm: 'PRODUCTION:view' },
  'GET /api/planning/bookings/:sku': { tier: 'PERM', perm: 'PRODUCTION:view' },
  'GET /api/planning/gantt': { tier: 'PERM', perm: 'PRODUCTION:view' },
  'POST /api/planning/sync-booking-stock': { tier: 'PERM', perm: 'PRODUCTION:create' },
  'POST /api/planning/:id/confirm-bookings': { tier: 'PERM', perm: 'PRODUCTION:update' },
  'POST /api/planning/bookings/:itemId/revert': { tier: 'PERM', perm: 'PRODUCTION:update' },
  // Processes
  'POST /api/processes': { tier: 'PERM', perm: 'PRODUCTION:create' },
  'PUT /api/processes/:id': { tier: 'PERM', perm: 'PRODUCTION:update' },
  'DELETE /api/processes/:id': { tier: 'PERM', perm: 'PRODUCTION:delete' },
  // Products (D6)
  'GET /api/products/:id': { tier: 'AUTH' },
  'PUT /api/products/:id': { tier: 'PERM', perm: 'PRODUCT:update' },
  'DELETE /api/products/:id': { tier: 'PERM', perm: 'PRODUCT:delete' },
  'POST /api/products/:id/routings': { tier: 'PERM', perm: 'PRODUCT:update' },
  'POST /api/products/:id/logistics': { tier: 'PERM', perm: 'PRODUCT:update' },
  'POST /api/products/:id/pattern': { tier: 'PERM', perm: 'PRODUCT:update' },
  'POST /api/products/:id/website-config': { tier: 'PERM', perm: 'PRODUCT:update' },
  'POST /api/products/:id/boms': { tier: 'PERM', perm: 'PRODUCT:update' },
  'POST /api/products/combo/add': { tier: 'PERM', perm: 'PRODUCT:create' },
  'DELETE /api/products/combo/item/:id': { tier: 'PERM', perm: 'PRODUCT:delete' },
  // Purchasing
  'DELETE /api/purchasing/pooled/all': { tier: 'PERM', perm: 'PURCHASE:delete' },
  'POST /api/purchasing/create-pooled': { tier: 'PERM', perm: 'PURCHASE:create' },
  'GET /api/purchasing/pooled/:id/aggregate': { tier: 'PERM', perm: 'PURCHASE:view' },
  // Sales
  'POST /api/sales/portal/:uuid/action': { tier: 'PERM', perm: 'SALES:update' },
  // Tasks
  'PUT /api/tasks/:id': { tier: 'AUTH' },
  'DELETE /api/tasks/:id': { tier: 'AUTH' },
};

function determineTargetDecorator(key, matrixEntry, file, currentDecTexts) {
  // 1. R022 GET /api/test in app.controller.ts -> @Public() (P1_Instruction line 40)
  if (key === 'GET /api/test' && file.includes('app.controller.ts')) {
    return { dec: '@Public()', type: 'PUBLIC' };
  }

  // 2. POST /api/hr/review-questions-seed -> @Perm('HR', 'create') (P1_Instruction line 41)
  if (key === 'POST /api/hr/review-questions-seed') {
    return { dec: "@Perm('HR', 'create')", type: 'PERM', replacePublic: true };
  }

  // 3. HR check-in, check-out, POST leaves -> @Perm('HR', 'create') (P1_Instruction line 100)
  if (file.includes('hr.controller.ts')) {
    if (key === 'POST /api/hr/check-in' || key === 'POST /api/hr/check-out' || key === 'POST /api/hr/leaves') {
      return { dec: "@Perm('HR', 'create')", type: 'PERM' };
    }
  }

  // 4. Designs controller dual permission D5 (P1_Instruction line 16 & D5)
  if (file.includes('designs.controller.ts')) {
    let action = 'view';
    const reqDec = currentDecTexts.find(t => t.startsWith('RequirePermission'));
    if (reqDec) {
      if (reqDec.includes('can_create')) action = 'create';
      else if (reqDec.includes('can_update')) action = 'update';
      else if (reqDec.includes('can_delete')) action = 'delete';
      else if (reqDec.includes('can_view')) action = 'view';
    } else if (matrixEntry && matrixEntry.perm) {
      action = matrixEntry.perm.split(':')[1] || 'view';
    }
    return {
      dec: `@AnyPerm(['PRODUCT', '${action}'], ['PRODUCTION', '${action}'])`,
      type: 'PERM',
      replaceRequirePermission: true
    };
  }

  // 5. Products packing-specs and GET products (D6)
  if (file.includes('products.controller.ts')) {
    if (key === 'GET /api/products/packing-specs' || key === 'GET /api/products' || key === 'GET /api/products/:id') {
      return { dec: '@AuthOnly()', type: 'AUTH', replaceRequirePermission: true };
    }
  }

  // 6. Custom rules for unlisted routes
  if (customRouteRules[key]) {
    const rule = customRouteRules[key];
    if (rule.tier === 'AUTH') {
      return { dec: '@AuthOnly()', type: 'AUTH' };
    } else if (rule.tier === 'PUBLIC') {
      return { dec: '@Public()', type: 'PUBLIC' };
    } else if (rule.tier === 'PERM') {
      const [m, a] = rule.perm.split(':');
      return { dec: `@Perm('${m}', '${a}')`, type: 'PERM' };
    }
  }

  // 7. Matrix entry
  if (matrixEntry) {
    if (matrixEntry.tier === 'PUBLIC') {
      return { dec: '@Public()', type: 'PUBLIC' };
    }
    if (matrixEntry.tier === 'AUTH') {
      return { dec: '@AuthOnly()', type: 'AUTH' };
    }
    if (matrixEntry.tier === 'PERM') {
      const hasReqPerm = currentDecTexts.some(t => t.startsWith('RequirePermission'));
      if (matrixEntry.change === 'NO_CHANGE' && hasReqPerm) {
        return { dec: null, type: 'PERM_KEEP_LEGACY' };
      }
      if (matrixEntry.perm && matrixEntry.perm.includes('|')) {
        const pairs = matrixEntry.perm.split('|').map(s => {
          const [m, a] = s.trim().split(':');
          return `['${m}', '${a}']`;
        });
        return { dec: `@AnyPerm(${pairs.join(', ')})`, type: 'PERM' };
      }
      if (matrixEntry.perm) {
        const [m, a] = matrixEntry.perm.split(':');
        return { dec: `@Perm('${m}', '${a}')`, type: 'PERM' };
      }
    }
    if (matrixEntry.tier === 'APIKEY') {
      return { dec: null, type: 'APIKEY' };
    }
  }

  return null;
}

console.log(`Processing ${files.length} controller files...`);

let stats = {
  applied: 0,
  alreadyDecorated: 0,
  legacyKept: 0,
  apiKey: 0,
  unknown: 0
};

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let sf = ts.createSourceFile(f, content, ts.ScriptTarget.Latest, true);

  let modifications = [];
  let needsPublicImport = false;
  let needsPermImport = new Set();

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
          let httpDecNode = null;
          let subPath = '';

          for (const d of decs) {
            const text = d.expression.getText(sf);
            const m = httpMethods.find(h => text.startsWith(h + '(') || text === h);
            if (m) {
              httpMethod = m.toUpperCase();
              httpDecNode = d;
              subPath = text.includes('(') ? extractStringArg(text) : '';
              break;
            }
          }

          if (httpMethod) {
            const fullRoute = cleanRoute(controllerPrefix, subPath);
            const key = `${httpMethod} ${fullRoute}`;
            const matrixEntry = matrixMap.get(key);
            const currentDecTexts = decs.map(d => d.expression.getText(sf));

            if (hasApiKeyGuardClass) {
              stats.apiKey++;
              return;
            }

            const target = determineTargetDecorator(key, matrixEntry, f, currentDecTexts);
            if (!target) {
              console.warn(`UNKNOWN: ${key} in ${f}`);
              stats.unknown++;
              return;
            }

            if (target.type === 'APIKEY') {
              stats.apiKey++;
              return;
            }

            if (target.type === 'PERM_KEEP_LEGACY') {
              stats.legacyKept++;
              return;
            }

            const hasReqPerm = currentDecTexts.some(t => t.startsWith('RequirePermission'));
            if (target.type === 'PERM' && hasReqPerm && !target.replaceRequirePermission) {
              stats.legacyKept++;
              return;
            }

            const hasExact = currentDecTexts.some(t => {
              if (target.dec.startsWith('@Public') && (t === 'Public()' || t === 'Public')) return true;
              if (target.dec.startsWith('@AuthOnly') && (t === 'AuthOnly()' || t === 'AuthOnly')) return true;
              if (target.dec.startsWith('@Perm') && t.startsWith('Perm')) return true;
              if (target.dec.startsWith('@AnyPerm') && t.startsWith('AnyPerm')) return true;
              return false;
            });

            if (hasExact && !target.replaceRequirePermission && !target.replacePublic) {
              stats.alreadyDecorated++;
              return;
            }

            if (target.dec.includes('@Public()')) needsPublicImport = true;
            if (target.dec.includes('@AuthOnly()')) needsPermImport.add('AuthOnly');
            if (target.dec.includes('@Perm(')) needsPermImport.add('Perm');
            if (target.dec.includes('@AnyPerm(')) needsPermImport.add('AnyPerm');

            if (target.replacePublic) {
              const pubDec = decs.find(d => d.expression.getText(sf).startsWith('Public'));
              if (pubDec) {
                modifications.push({
                  start: pubDec.getStart(sf),
                  end: pubDec.getEnd(),
                  text: target.dec
                });
                stats.applied++;
                return;
              }
            }

            if (target.replaceRequirePermission) {
              const reqDec = decs.find(d => d.expression.getText(sf).startsWith('RequirePermission'));
              if (reqDec) {
                modifications.push({
                  start: reqDec.getStart(sf),
                  end: reqDec.getEnd(),
                  text: target.dec
                });
                stats.applied++;
                return;
              }
            }

            // Normal insertion before httpDecNode
            const httpStart = httpDecNode.getStart(sf);
            const lineStart = content.lastIndexOf('\n', httpStart) + 1;
            const indent = content.slice(lineStart, httpStart);

            modifications.push({
              start: httpStart,
              end: httpStart,
              text: `${target.dec}\n${indent}`
            });

            stats.applied++;
          }
        }
      });
    }
  });

  if (modifications.length > 0) {
    modifications.sort((a, b) => b.start - a.start);
    let newContent = content;
    for (const mod of modifications) {
      newContent = newContent.slice(0, mod.start) + mod.text + newContent.slice(mod.end);
    }

    const fileDir = path.dirname(f);
    
    if (needsPublicImport) {
      let rel = path.relative(fileDir, 'src/auth/public.decorator').replace(/\\/g, '/');
      if (!rel.startsWith('.')) rel = './' + rel;
      if (!newContent.includes("from '" + rel + "'") && !newContent.includes('from "' + rel + '"') && !newContent.match(/import\s*\{[^}]*Public[^}]*\}\s*from/)) {
        newContent = `import { Public } from '${rel}';\n` + newContent;
      }
    }

    if (needsPermImport.size > 0) {
      let rel = path.relative(fileDir, 'src/auth/permissions.decorator').replace(/\\/g, '/');
      if (!rel.startsWith('.')) rel = './' + rel;

      const importRegex = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${rel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}['"];?`);
      const match = newContent.match(importRegex);
      if (match) {
        const existingItems = match[1].split(',').map(s => s.trim()).filter(Boolean);
        for (const item of needsPermImport) {
          if (!existingItems.includes(item)) {
            existingItems.push(item);
          }
        }
        newContent = newContent.replace(match[0], `import { ${existingItems.join(', ')} } from '${rel}';`);
      } else {
        newContent = `import { ${Array.from(needsPermImport).join(', ')} } from '${rel}';\n` + newContent;
      }
    }

    if (!isDryRun) {
      fs.writeFileSync(f, newContent, 'utf8');
      console.log(`Updated ${f} (${modifications.length} changes)`);
    } else {
      console.log(`[DRY-RUN] Would update ${f} (${modifications.length} changes)`);
    }
  }
}

console.log('Result summary:', stats);
