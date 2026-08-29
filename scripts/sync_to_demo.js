const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_ROOT = path.resolve(__dirname, '..');
const TARGET_ROOT = process.env.ERP4U_DEMO_PATH || path.resolve(SOURCE_ROOT, '..', 'erp4u-demo');

console.log('====================================================');
console.log('🔄 ERP4U DEMO SYNC UTILITY');
console.log(`Source: ${SOURCE_ROOT}`);
console.log(`Target: ${TARGET_ROOT}`);
console.log('====================================================');

if (!fs.existsSync(TARGET_ROOT)) {
  console.error(`❌ Target demo repository not found at: ${TARGET_ROOT}`);
  console.error('Please ensure erp4u-demo is cloned at the sibling directory or set ERP4U_DEMO_PATH.');
  process.exit(1);
}

// Protected files/directories in target that MUST NOT be overwritten from source
const PROTECTED_TARGET_PATHS = [
  'LICENSE',
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'CHANGELOG.md',
  '.github',
  '.gitignore',
  '.env.example',
  'docker-compose.demo.yml',
  'docker-compose.yml',
  'vercel.json',
  'src/common/encryption',
  'src/database/seeds',
  'src/main.ts',
];

// Clean items that should be removed if present in target
const UNWANTED_DEMO_FILES = [
  'add_cms_permission.js',
  'check_routings.js',
  'db_query.js',
  'fix_bookings.js',
  'generate_sql.js',
  'parse_questions.js',
  'parsed_questions.json',
  'query.ts',
  'query_bom_items.js',
  'seed-app.ts',
  'seed.js',
  'test-bom.ts',
  'test-db-connection.js',
  'test_perf.js',
  'test_remote.js',
  'backup_project.ps1',
  'commit_dump.txt',
  'docker-compose_bk.yml',
  'null',
  'frontend/Dockerfile_bk',
  'docs/0311874522-API.txt',
  'docs/QA_WORKFLOW.md',
  'docs/Recruitment_Module.md',
  'docs/agent_brain',
  'docs/b2b_portal.md',
  'docs/mrp_v2',
  'docs/salesteam.md',
  'docs/template',
  'docs/website_v2',
];

function cleanUnwantedTargetFiles() {
  for (const item of UNWANTED_DEMO_FILES) {
    const full = path.join(TARGET_ROOT, item);
    if (fs.existsSync(full)) {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        fs.rmSync(full, { recursive: true, force: true });
      } else {
        fs.unlinkSync(full);
      }
    }
  }
}

function sanitizeContent(content, relPath) {
  let updated = content;

  // Domain sanitization
  updated = updated.replace(/erp\.nemmamnon\.com/g, 'localhost:3000');
  updated = updated.replace(/cms\.nemmamnon\.com/g, 'localhost:3001');
  updated = updated.replace(/beta\.nemmamnon\.com/g, 'localhost:5173');
  updated = updated.replace(/www\.nemmamnon\.com/g, 'localhost:8080');
  updated = updated.replace(/nemmamnon\.com/gi, 'demo.erp4u.local');
  updated = updated.replace(/nemmamnon/gi, 'erp4u');
  updated = updated.replace(/35\.225\.213\.160/g, 'localhost');

  // Rebranding
  updated = updated.replace(/HULA_SUPPLIED/g, 'COMPANY_SUPPLIED');
  updated = updated.replace(/Hula ERP/g, 'ERP4U');
  updated = updated.replace(/HULA ERP/g, 'ERP4U');
  updated = updated.replace(/Hula/g, 'ERP4U');
  updated = updated.replace(/HULA/g, 'ERP4U');
  updated = updated.replace(/hula-erp-frontend/g, 'erp4u-frontend');
  updated = updated.replace(/hula-erp-app/g, 'erp4u-app');
  updated = updated.replace(/hula-erp/g, 'erp4u');
  updated = updated.replace(/hula_db/g, 'erp4u_db');
  updated = updated.replace(/hula_user/g, 'erp4u_user');
  updated = updated.replace(/hula_password/g, 'erp4u_password');
  updated = updated.replace(/hula/g, 'erp4u');

  // Specific entity PII encryption injection
  if (relPath === 'src/customers/customer.entity.ts') {
    if (!updated.includes('EncryptionTransformer')) {
      updated = "import { EncryptionTransformer } from '../common/encryption/encryption.transformer';\n" + updated;
    }
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+phone: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) phone: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+email: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) email: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+tax_code: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) tax_code: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+legal_name: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) legal_name: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+legal_address: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) legal_address: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+legal_representative: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) legal_representative: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+einvoice_email: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) einvoice_email: string;");
  } else if (relPath === 'src/customers/customer-contact.entity.ts') {
    if (!updated.includes('EncryptionTransformer')) {
      updated = "import { EncryptionTransformer } from '../common/encryption/encryption.transformer';\n" + updated;
    }
    updated = updated.replace(/@Column\(\)\s+full_name: string;/g, "@Column({ type: 'text', transformer: new EncryptionTransformer() }) full_name: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+email: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) email: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+phone: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) phone: string;");
  } else if (relPath === 'src/suppliers/supplier.entity.ts') {
    if (!updated.includes('EncryptionTransformer')) {
      updated = "import { EncryptionTransformer } from '../common/encryption/encryption.transformer';\n" + updated;
    }
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+tax_code: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) tax_code: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+legal_name: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) legal_name: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+phone: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) phone: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+email: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) email: string;");
  } else if (relPath === 'src/suppliers/supplier-contact.entity.ts') {
    if (!updated.includes('EncryptionTransformer')) {
      updated = "import { EncryptionTransformer } from '../common/encryption/encryption.transformer';\n" + updated;
    }
    updated = updated.replace(/@Column\(\)\s+full_name: string;/g, "@Column({ type: 'text', transformer: new EncryptionTransformer() }) full_name: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+phone_number: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) phone_number: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+email: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) email: string;");
  } else if (relPath === 'src/hr/entities/employee.entity.ts') {
    if (!updated.includes('EncryptionTransformer')) {
      updated = "import { EncryptionTransformer } from '../../common/encryption/encryption.transformer';\n" + updated;
    }
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+phone: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) phone: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+address: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) address: string;");
  } else if (relPath === 'src/users/entities/user.entity.ts') {
    if (!updated.includes('EncryptionTransformer')) {
      updated = "import { EncryptionTransformer } from '../../common/encryption/encryption.transformer';\n" + updated;
    }
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+email: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) email: string;");
    updated = updated.replace(/@Column\(\{ nullable: true \}\)\s+ip_address: string;/g, "@Column({ type: 'text', nullable: true, transformer: new EncryptionTransformer() }) ip_address: string;");
  } else if (relPath === 'src/app.module.ts') {
    updated = updated.replace(/import \{ FirebaseModule \} from '\.\/firebase\/firebase\.module';/g, "import { EncryptionModule } from './common/encryption/encryption.module';");
    updated = updated.replace(/FirebaseModule, \/\/ Firebase real-time notifications/g, "EncryptionModule, // Column-level PII encryption");
    updated = updated.replace(/host: configService\.get<string>\('DB_HOST'\) \|\| 'erp4u_db'/g, "host: configService.get<string>('DB_HOST') || 'localhost'");
    updated = updated.replace(/synchronize: configService\.get<string>\('NODE_ENV'\) !== 'production',/g, "synchronize: true, // Always sync demo database schema");
  } else if (relPath === 'src/notifications/notifications.service.ts') {
    const targetFile = path.join(TARGET_ROOT, 'src/notifications/notifications.service.ts');
    if (fs.existsSync(targetFile)) {
      return fs.readFileSync(targetFile, 'utf8');
    }
  } else if (relPath === 'src/notifications/notifications.controller.ts') {
    const targetFile = path.join(TARGET_ROOT, 'src/notifications/notifications.controller.ts');
    if (fs.existsSync(targetFile)) {
      return fs.readFileSync(targetFile, 'utf8');
    }
  } else if (relPath === 'package.json') {
    try {
      const srcPkg = JSON.parse(content);
      const targetPkgPath = path.join(TARGET_ROOT, 'package.json');
      const targetPkg = fs.existsSync(targetPkgPath) ? JSON.parse(fs.readFileSync(targetPkgPath, 'utf8')) : {};

      targetPkg.dependencies = {
        ...(srcPkg.dependencies || {}),
        '@faker-js/faker': '^9.5.0',
      };
      targetPkg.devDependencies = srcPkg.devDependencies || {};
      targetPkg.scripts = {
        ...(srcPkg.scripts || {}),
        seed: 'ts-node src/database/seeds/seed-runner.ts',
        'seed:reset': 'ts-node src/database/seeds/seed-runner.ts --reset',
      };
      targetPkg.name = 'erp4u';
      targetPkg.description = 'ERP4U - Modern Open Source Manufacturing ERP (NestJS + React + PostgreSQL)';
      targetPkg.license = 'AGPL-3.0-or-later';
      targetPkg.private = false;
      targetPkg.repository = {
        type: 'git',
        url: 'https://github.com/residoken-wq/erp4u-demo.git',
      };
      return JSON.stringify(targetPkg, null, 2) + '\n';
    } catch (e) {
      return updated;
    }
  } else if (relPath === 'frontend/package.json') {
    try {
      const srcPkg = JSON.parse(content);
      srcPkg.name = 'erp4u-frontend';
      srcPkg.description = 'ERP4U Frontend - React + Vite + Ant Design';
      srcPkg.license = 'AGPL-3.0-or-later';
      srcPkg.private = false;
      return JSON.stringify(srcPkg, null, 2) + '\n';
    } catch (e) {
      return updated;
    }
  } else if (relPath === 'package-lock.json') {
    try {
      const lockObj = JSON.parse(content);
      if (lockObj.name) lockObj.name = 'erp4u';
      if (lockObj.packages && lockObj.packages['']) {
        lockObj.packages[''].name = 'erp4u';
      }
      return JSON.stringify(lockObj, null, 2) + '\n';
    } catch (e) {
      return updated;
    }
  } else if (relPath === 'frontend/package-lock.json') {
    try {
      const lockObj = JSON.parse(content);
      if (lockObj.name) lockObj.name = 'erp4u-frontend';
      if (lockObj.packages && lockObj.packages['']) {
        lockObj.packages[''].name = 'erp4u-frontend';
      }
      return JSON.stringify(lockObj, null, 2) + '\n';
    } catch (e) {
      return updated;
    }
  }

  return updated;
}

const SYNC_TARGETS = [
  { type: 'dir', src: 'src', dest: 'src' },
  { type: 'dir', src: 'frontend/src', dest: 'frontend/src' },
  { type: 'dir', src: 'frontend/public', dest: 'frontend/public' },
  { type: 'file', src: 'frontend/package.json', dest: 'frontend/package.json' },
  { type: 'file', src: 'frontend/package-lock.json', dest: 'frontend/package-lock.json' },
  { type: 'file', src: 'frontend/tsconfig.json', dest: 'frontend/tsconfig.json' },
  { type: 'file', src: 'frontend/tsconfig.node.json', dest: 'frontend/tsconfig.node.json' },
  { type: 'file', src: 'frontend/vite.config.ts', dest: 'frontend/vite.config.ts' },
  { type: 'file', src: 'frontend/postcss.config.js', dest: 'frontend/postcss.config.js' },
  { type: 'file', src: 'frontend/tailwind.config.js', dest: 'frontend/tailwind.config.js' },
  { type: 'file', src: 'frontend/index.html', dest: 'frontend/index.html' },
  { type: 'file', src: 'frontend/nginx.conf', dest: 'frontend/nginx.conf' },
  { type: 'file', src: 'frontend/Dockerfile', dest: 'frontend/Dockerfile' },
  { type: 'file', src: 'package.json', dest: 'package.json' },
  { type: 'file', src: 'package-lock.json', dest: 'package-lock.json' },
  { type: 'file', src: 'tsconfig.json', dest: 'tsconfig.json' },
  { type: 'file', src: 'tsconfig.build.json', dest: 'tsconfig.build.json' },
  { type: 'file', src: 'nest-cli.json', dest: 'nest-cli.json' },
  { type: 'file', src: 'Dockerfile', dest: 'Dockerfile' },
  { type: 'file', src: 'docs/TECHNICAL_ARCHITECTURE.md', dest: 'docs/TECHNICAL_ARCHITECTURE.md' },
];

let syncCount = 0;

function syncFile(srcRel, destRel) {
  if (PROTECTED_TARGET_PATHS.includes(destRel)) {
    return;
  }
  const srcFull = path.join(SOURCE_ROOT, srcRel);
  const destFull = path.join(TARGET_ROOT, destRel);
  if (!fs.existsSync(srcFull)) return;

  const ext = path.extname(srcFull).toLowerCase();
  const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.txt', '.sql'];

  fs.mkdirSync(path.dirname(destFull), { recursive: true });

  if (textExtensions.includes(ext)) {
    const content = fs.readFileSync(srcFull, 'utf8');
    const sanitized = sanitizeContent(content, destRel.replace(/\\/g, '/'));
    fs.writeFileSync(destFull, sanitized, 'utf8');
  } else {
    fs.copyFileSync(srcFull, destFull);
  }
  syncCount++;
}

function syncDirRecursive(srcRel, destRel) {
  const srcFull = path.join(SOURCE_ROOT, srcRel);
  if (!fs.existsSync(srcFull)) return;

  const items = fs.readdirSync(srcFull);
  for (const item of items) {
    const itemSrcRel = path.join(srcRel, item).replace(/\\/g, '/');
    const itemDestRel = path.join(destRel, item).replace(/\\/g, '/');

    if (PROTECTED_TARGET_PATHS.some(p => itemDestRel === p || itemDestRel.startsWith(p + '/'))) {
      continue;
    }
    if (['node_modules', '.git', 'firebase', 'dist', 'build'].includes(item)) {
      continue;
    }

    const fullItemSrc = path.join(SOURCE_ROOT, itemSrcRel);
    const stat = fs.statSync(fullItemSrc);
    if (stat.isDirectory()) {
      syncDirRecursive(itemSrcRel, itemDestRel);
    } else {
      syncFile(itemSrcRel, itemDestRel);
    }
  }
}

console.log('🚀 Starting sync process...');
for (const target of SYNC_TARGETS) {
  if (target.type === 'file') {
    syncFile(target.src, target.dest);
  } else if (target.type === 'dir') {
    syncDirRecursive(target.src, target.dest);
  }
}

cleanUnwantedTargetFiles();

console.log(`✅ Synced ${syncCount} core files/directories.`);

console.log('\n📦 Regenerating package-lock.json files to sync dynamic dependencies...');
try {
  execSync('npm install --package-lock-only --ignore-scripts', { cwd: TARGET_ROOT, stdio: 'inherit' });
  execSync('npm install --package-lock-only --ignore-scripts', { cwd: path.join(TARGET_ROOT, 'frontend'), stdio: 'inherit' });
  console.log('✅ Lock files regenerated successfully.');
} catch (err) {
  console.warn('⚠️ Warning: Failed to regenerate lock files:', err.message);
}

// Post-sync Security Audit
console.log('\n🔍 Running Post-Sync Security & Brand Audit...');
const suspiciousPatterns = [
  { name: 'Residual "hula"', regex: /\bhula\b/i },
  { name: 'Nemmamnon domain', regex: /nemmamnon/i },
  { name: 'Production IP', regex: /35\.225\.213\.160/ },
  { name: 'Firebase Service Account JSON', regex: /type": "service_account/ },
  { name: 'Private Key PEM', regex: /BEGIN PRIVATE KEY/ },
];

let auditFindings = [];
function auditDir(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (['node_modules', '.git', 'dist', 'build'].includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      auditDir(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.md', '.env', '.html'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of suspiciousPatterns) {
          if (pattern.regex.test(content)) {
            const rel = path.relative(TARGET_ROOT, fullPath);
            auditFindings.push({ file: rel, issue: pattern.name });
          }
        }
      }
    }
  }
}

auditDir(TARGET_ROOT);

if (auditFindings.length === 0) {
  console.log('✨ AUDIT PASSED: Demo repo is 100% clean of sensitive strings and ready to push.');
} else {
  console.warn(`⚠️ AUDIT WARNING: Found ${auditFindings.length} suspicious references:`);
  auditFindings.forEach((f) => console.warn(`   - [${f.issue}] in ${f.file}`));
}

// Optional Git Commit in Demo Repo
if (process.argv.includes('--commit') || process.argv.includes('-c')) {
  try {
    console.log('\n📦 Staging and committing changes in demo repository...');
    execSync('git add .', { cwd: TARGET_ROOT, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: TARGET_ROOT, encoding: 'utf8' });
    if (status.trim()) {
      const commitMsg = `sync: update demo codebase from upstream (${new Date().toISOString().split('T')[0]})`;
      execSync(`git commit -m "${commitMsg}"`, { cwd: TARGET_ROOT, stdio: 'inherit' });
      console.log(`🎉 Changes committed: "${commitMsg}"`);
    } else {
      console.log('ℹ️ No changes to commit in demo repository.');
    }
  } catch (err) {
    console.error('Failed to commit in demo repository:', err.message);
  }
}

console.log('\n====================================================');
console.log('🎉 SYNC COMPLETE!');
console.log('To run again anytime: npm run sync:demo');
console.log('To sync and auto-commit: npm run sync:demo:commit');
console.log('====================================================\n');
