const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const rootDir = path.resolve(__dirname, '../..');

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
  const matrixPath = path.resolve(rootDir, 'docs/rbac_v2/route-matrix.csv');
  if (!fs.existsSync(matrixPath)) {
    throw new Error(`Matrix file not found: ${matrixPath}`);
  }
  const content = fs.readFileSync(matrixPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const matrix = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const method = row[1];
    const route = row[2];
    const tier = row[6];

    // Build regex to match incoming paths
    // e.g. /api/public/portal/quote/:uuid -> ^/api/public/portal/quote/[^/]+$
    const regexStr = '^' + route
      .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
      .replace(/\*/g, '.*') + '$';

    matrix.push({
      id: row[0],
      method,
      route,
      tier,
      regex: new RegExp(regexStr)
    });
  }
  return matrix;
}

function getFiles(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFiles(full, filterFn));
    } else if (filterFn(entry.name, full)) {
      results.push(full);
    }
  }
  return results;
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length))
    .replace(/(?<!:)\/\/.*$/gm, match => ' '.repeat(match.length));
}

function normalizeCallerPath(rawUrl, isWebsiteApiInstance) {
  let cleaned = rawUrl.replace(/^[`'"]|[`'"]$/g, '').trim();
  cleaned = cleaned.split('?')[0];

  // If it's an external URL (not erp), return null
  if (/^https?:\/\/(?!localhost|127\.0\.0\.1|erp\.)/i.test(cleaned) && !cleaned.includes('API_URL')) {
    return null;
  }

  // Remove variable base prefixes: ${API_URL}, ${apiUrl}, ${baseUrl}, etc.
  cleaned = cleaned.replace(/\$\{[^}]*(?:API_URL|apiUrl|baseUrl|getApiUrl\(\)|getApiBaseUrl\(\)|base)[^}]*\}/gi, '');
  cleaned = cleaned.replace(/https?:\/\/[^/]+/i, '');

  // Website lib/api.ts baseURL is /public
  if (isWebsiteApiInstance) {
    if (!cleaned.startsWith('/public')) {
      cleaned = '/public' + (cleaned.startsWith('/') ? cleaned : '/' + cleaned);
    }
  }

  if (!cleaned.startsWith('/api')) {
    cleaned = '/api' + (cleaned.startsWith('/') ? cleaned : '/' + cleaned);
  }

  // Normalize path variables ${...} to wildcard placeholder
  cleaned = cleaned.replace(/\$\{[^}]+\}/g, 'PARAM_VAL');
  cleaned = cleaned.replace(/\/+/g, '/');

  return cleaned;
}

function scanPublicCallers() {
  console.log('======================================================');
  console.log('           RBAC V2 PUBLIC CALLERS CHECKER             ');
  console.log('======================================================\n');

  const matrix = loadMatrix();

  const targetFiles = [
    ...getFiles(path.resolve(rootDir, 'hula-web/website/src'), f => /\.(tsx?|jsx?)$/.test(f)),
    ...getFiles(path.resolve(rootDir, 'frontend/src/pages'), f => /^Portal.*\.tsx$/.test(f)),
    ...getFiles(path.resolve(rootDir, 'frontend/src/components/b2b'), f => /\.(tsx?|jsx?)$/.test(f)),
  ];

  console.log(`Scanning ${targetFiles.length} files across public callers:`);
  console.log(`  - hula-web/website/src`);
  console.log(`  - frontend/src/pages/Portal*.tsx`);
  console.log(`  - frontend/src/components/b2b\n`);

  const calls = [];

  for (const file of targetFiles) {
    const rawContent = fs.readFileSync(file, 'utf8');
    const content = stripComments(rawContent);
    const isWebsite = file.includes(path.join('hula-web', 'website'));

    // 1. api/axios method calls
    const apiRegex = /\b(api|axios)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*([`'"][^`'"]*[`'"])/g;
    let match;
    while ((match = apiRegex.exec(content)) !== null) {
      const callerName = match[1];
      const method = match[2].toUpperCase();
      const rawUrl = match[3];
      const isWebsiteApiInstance = isWebsite && callerName === 'api';
      const normPath = normalizeCallerPath(rawUrl, isWebsiteApiInstance);
      if (normPath) {
        const line = content.substring(0, match.index).split('\n').length;
        calls.push({
          file: path.relative(rootDir, file).replace(/\\/g, '/'),
          line,
          method,
          rawUrl,
          normPath,
          caller: callerName
        });
      }
    }

    // 2. fetch calls
    const fetchRegex = /\bfetch\s*\(\s*([`'"][^`'"]*[`'"])([\s\S]*?\))/g;
    while ((match = fetchRegex.exec(content)) !== null) {
      const rawUrl = match[1];
      const optionsBlock = match[2] || '';
      let method = 'GET';
      if (/method\s*:\s*['"]POST['"]/i.test(optionsBlock)) method = 'POST';
      else if (/method\s*:\s*['"]PUT['"]/i.test(optionsBlock)) method = 'PUT';
      else if (/method\s*:\s*['"]DELETE['"]/i.test(optionsBlock)) method = 'DELETE';

      const normPath = normalizeCallerPath(rawUrl, false);
      if (normPath) {
        const line = content.substring(0, match.index).split('\n').length;
        calls.push({
          file: path.relative(rootDir, file).replace(/\\/g, '/'),
          line,
          method,
          rawUrl,
          normPath,
          caller: 'fetch'
        });
      }
    }
  }

  console.log(`Found ${calls.length} public/anonymous API calls.`);

  const nonPublicMismatches = [];
  const notFoundMismatches = [];

  calls.forEach(c => {
    const matched = matrix.find(m => m.method === c.method && m.regex.test(c.normPath));
    if (!matched) {
      notFoundMismatches.push(c);
    } else if (matched.tier !== 'PUBLIC') {
      nonPublicMismatches.push({ ...c, matched });
    }
  });

  if (notFoundMismatches.length > 0) {
    console.error(`\n❌ [ERROR] ${notFoundMismatches.length} API call(s) could not be matched to any route in matrix:`);
    notFoundMismatches.forEach(c => {
      console.error(`  * ${c.method} ${c.normPath} (raw: ${c.rawUrl}) at ${c.file}:${c.line}`);
    });
  }

  if (nonPublicMismatches.length > 0) {
    console.error(`\n❌ [ERROR] ${nonPublicMismatches.length} API call(s) target NON-PUBLIC routes (will fail under ENFORCE):`);
    nonPublicMismatches.forEach(c => {
      console.error(`  * ${c.method} ${c.normPath} -> Matched ${c.matched.id} [${c.matched.tier}] (perm: ${c.matched.perm || 'none'}) at ${c.file}:${c.line}`);
    });
  }

  console.log('\n======================================================');
  if (notFoundMismatches.length === 0 && nonPublicMismatches.length === 0) {
    console.log(`✅ CHECK-PUBLIC-CALLERS PASSED: 0 mismatched calls across all ${calls.length} endpoints.`);
    console.log('======================================================\n');
    return 0;
  } else {
    console.error(`❌ CHECK-PUBLIC-CALLERS FAILED: ${nonPublicMismatches.length + notFoundMismatches.length} mismatched call(s).`);
    console.log('======================================================\n');
    return 1;
  }
}

if (require.main === module) {
  const code = scanPublicCallers();
  process.exit(code);
}

module.exports = { scanPublicCallers };
