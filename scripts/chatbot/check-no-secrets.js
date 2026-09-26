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

const secretPatterns = [
  { name: 'Google API Key pattern', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: 'OpenAI Secret Key pattern', regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'Real Gmail address', regex: /[a-zA-Z0-9._%+-]+@gmail\.com/g }
];

let hasError = false;
let scannedFiles = 0;

for (const target of scanTargets) {
  const files = getFiles(target);
  for (const file of files) {
    // Exclude unit tests and specs from Gmail test checks if fixture
    const isTest = file.includes('__tests__') || file.includes('.spec.') || file.includes('.test.');
    scannedFiles++;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Allow regex definitions themselves in checks or DTOs
      if (line.includes('/AIza[0-9A-Za-z_-]{20,}/') || line.includes('/sk-[A-Za-z0-9]{20,}/')) {
        return;
      }
      for (const p of secretPatterns) {
        if (p.name === 'Real Gmail address' && isTest) continue;
        const matches = line.match(p.regex);
        if (matches) {
          console.error(`[SECRET FOUND] ${p.name} in ${path.relative(projectRoot, file)}:${idx + 1}`);
          console.error(`  Line: ${line.trim()}`);
          hasError = true;
        }
      }
    });
  }
}

if (hasError) {
  console.error('\n❌ check-no-secrets: Found secret-like strings or real emails in codebase!');
  process.exit(1);
} else {
  console.log(`\n✅ check-no-secrets: Scanned ${scannedFiles} files. No secrets or real emails detected.`);
  process.exit(0);
}
