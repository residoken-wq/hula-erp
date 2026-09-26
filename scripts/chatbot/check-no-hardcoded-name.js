const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');

const scanTargets = [
  path.join(projectRoot, 'src/chatbot'),
  path.join(projectRoot, 'frontend/src/components/system/ChatbotConfigTab.tsx'),
  path.join(projectRoot, 'hula-web/website/src/components/chat')
];

function getFiles(targetPath) {
  if (!fs.existsSync(targetPath)) return [];
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return [targetPath];
  let files = [];
  for (const item of fs.readdirSync(targetPath)) {
    const full = path.join(targetPath, item);
    if (fs.statSync(full).isDirectory()) {
      files.push(...getFiles(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
      files.push(full);
    }
  }
  return files;
}

let hasError = false;
let scannedFiles = 0;

for (const target of scanTargets) {
  const files = getFiles(target);
  for (const file of files) {
    const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');

    // ONLY src/chatbot/chatbot.defaults.ts is allowed to contain the hardcoded name!
    if (relPath === 'src/chatbot/chatbot.defaults.ts') {
      continue;
    }

    // Unit tests and specs are explicitly allowed by spec
    if (relPath.includes('__tests__') || relPath.includes('.spec.') || relPath.includes('.test.')) {
      continue;
    }

    scannedFiles++;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Check for 'Cừu Hula' or 'Cuu Hula'
      if (line.includes('Cừu Hula') || line.includes('Cuu Hula')) {
        console.error(`[HARDCODED NAME FOUND] in ${relPath}:${idx + 1}`);
        console.error(`  Line: ${line.trim()}`);
        hasError = true;
      }
    });
  }
}

if (hasError) {
  console.error('\n❌ check-no-hardcoded-name: Found hardcoded assistant name outside chatbot.defaults.ts!');
  process.exit(1);
} else {
  console.log(`\n✅ check-no-hardcoded-name: Scanned ${scannedFiles} files. No hardcoded name outside defaults.`);
  process.exit(0);
}
